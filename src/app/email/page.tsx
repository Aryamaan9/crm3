"use client";

import { useState } from "react";
import { useLeads } from "@/hooks/useLeads";
import { useEmailQueue } from "@/hooks/useEmailQueue";
import { useSettings } from "@/hooks/useSettings";
import { EmailComposer } from "@/components/email/EmailComposer";
import { Mail, Send, CheckCircle2, Eye, MousePointerClick, AlertCircle, Settings2, Plus, Clock } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

export default function EmailModule() {
  const router = useRouter();
  const { leads, loading: leadsLoading } = useLeads();
  const { campaigns, loading: queueLoading, recordCampaign } = useEmailQueue();
  const { settings } = useSettings();

  const [isComposing, setIsComposing] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

  // Filter state for dashboard
  const [stageFilter, setStageFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLeads = leads.filter(lead => {
    const matchesStage = stageFilter === "All" || lead.leadStage === stageFilter;
    const matchesType = typeFilter === "All" || lead.investorType === typeFilter;
    const matchesSearch = !searchQuery || 
      `${lead.firstName} ${lead.lastName} ${lead.email} ${lead.organization}`
      .toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStage && matchesType && matchesSearch;
  });

  const handleSelectAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const toggleLead = (id: string) => {
    const newSet = new Set(selectedLeads);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedLeads(newSet);
  };

  const totalCampaigns = campaigns.length;
  const sentCampaigns = campaigns.filter(c => c.status === 'sent').length;
  const failedCampaigns = campaigns.filter(c => c.status === 'failed').length;
  const sentRecipients = campaigns.filter(c => c.status === 'sent').reduce((acc, c) => acc + (c.successCount || 0), 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Email Broadcasts</h1>
          <span className="px-2.5 py-0.5 rounded-md border border-slate-200 text-xs font-medium text-slate-600 bg-white shadow-sm">
            Brevo Engine Active
          </span>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.push('/settings')} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-md font-medium text-sm hover:bg-slate-50 transition-colors shadow-sm">
            <Settings2 className="w-4 h-4" /> Config
          </button>
          <button 
            onClick={() => setIsComposing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] text-white rounded-md font-medium text-sm hover:bg-black transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Campaign
          </button>
        </div>
      </div>
      
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4"><Mail className="w-5 h-5 text-slate-400"/><span className="text-xs font-semibold text-slate-500 uppercase">Total Campaigns</span></div>
          <div className="text-3xl font-bold text-slate-900">{totalCampaigns}</div>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4"><Send className="w-5 h-5 text-blue-500"/><span className="text-xs font-semibold text-slate-500 uppercase">Total Delivered</span></div>
          <div className="text-3xl font-bold text-slate-900">{sentRecipients}</div>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4"><Eye className="w-5 h-5 text-emerald-500"/><span className="text-xs font-semibold text-slate-500 uppercase">Open Rate</span></div>
          <div className="text-3xl font-bold text-slate-900">--%</div>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4"><AlertCircle className="w-5 h-5 text-amber-500"/><span className="text-xs font-semibold text-slate-500 uppercase">Failed</span></div>
          <div className="text-3xl font-bold text-slate-900">{failedCampaigns}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Audience Selection (Takes up 1/3) */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-semibold text-slate-900">Audience Selection</h3>
            <p className="text-xs text-slate-500 mb-4">Select leads for your next campaign</p>
            
            <input 
              type="text" 
              placeholder="Search leads..." 
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-md mb-2 outline-none focus:border-slate-400"
            />
            <div className="flex gap-2">
              <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} className="flex-1 text-xs px-2 py-1.5 border border-slate-200 rounded outline-none bg-white">
                <option value="All">All Stages</option>
                {settings.leadStages?.map((s: string) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="flex-1 text-xs px-2 py-1.5 border border-slate-200 rounded outline-none bg-white">
                <option value="All">All Types</option>
                {settings.investorTypes?.map((t: string) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="p-2 border-b border-slate-100 flex justify-between items-center bg-white">
            <span className="text-xs font-medium text-slate-600">{selectedLeads.size} selected</span>
            <button onClick={handleSelectAll} className="text-xs font-semibold text-slate-900 hover:underline">Select All Filtered</button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {leadsLoading ? (
              <div className="p-4 text-center text-xs text-slate-500">Loading leads...</div>
            ) : filteredLeads.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">No leads match filters.</div>
            ) : (
              filteredLeads.map(lead => (
                <div 
                  key={lead.id} 
                  onClick={() => toggleLead(lead.id)}
                  className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${selectedLeads.has(lead.id) ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
                >
                  <input type="checkbox" checked={selectedLeads.has(lead.id)} readOnly className="rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{lead.firstName} {lead.lastName}</p>
                    <p className="text-xs text-slate-500 truncate">{lead.organization}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t border-slate-100 bg-slate-50">
            <button 
              onClick={() => setIsComposing(true)}
              disabled={selectedLeads.size === 0}
              className="w-full py-2 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              Compose for {selectedLeads.size} Recipients
            </button>
          </div>
        </div>

        {/* Right: Campaign History (Takes up 2/3) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-[600px]">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="font-semibold text-slate-900">Campaign History</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wider sticky top-0">
                <tr>
                  <th className="px-6 py-4">Campaign Name</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queueLoading ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
                ) : campaigns.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No campaigns sent yet.</td></tr>
                ) : (
                  campaigns.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{c.name}</td>
                      <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate">{c.subject}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider ${
                          c.status === 'sent' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 
                          c.status === 'failed' ? 'bg-red-50 text-red-700 border border-red-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {c.status} {c.successCount ? `(${c.successCount})` : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {c.createdAt ? format(c.createdAt.toDate(), "MMM d, yyyy h:mm a") : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Fullscreen Composer Modal overlaying everything */}
      {isComposing && (
        <>
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-all" />
          <EmailComposer 
            onClose={() => setIsComposing(false)}
            selectedLeads={selectedLeads}
            leadsData={leads}
            settings={settings}
            recordCampaign={recordCampaign}
          />
        </>
      )}
    </div>
  );
}
