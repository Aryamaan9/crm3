"use client";

import { useEffect, useState, useRef } from "react";
import { collection, getDocs, addDoc, Timestamp, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Mail, Send, CheckCircle2, Eye, MousePointerClick, AlertCircle, Settings2, Plus, X, Search, Filter, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

type ViewState = 'dashboard' | 'compose';

export default function EmailModule() {
  const { user } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<ViewState>('dashboard');
  
  // Data State
  const [leads, setLeads] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ leadStages: [], investorTypes: [] });
  
  // Compose State
  const [campaignName, setCampaignName] = useState("");
  const [sender, setSender] = useState("Money Stories IR <ir@moneystories.in>");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("<p>Dear {{first_name}},</p>\n\n<p>We are pleased to share our latest fund performance update regarding <strong>{{organization}}</strong>.</p>\n\n<p>Warm regards,<br>The Team</p>");
  const [bodyMode, setBodyMode] = useState<'source' | 'rendered'>('source');
  
  // Filter State
  const [stageFilter, setStageFilter] = useState("All Stages");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const fetchCampaigns = async () => {
    try {
      const q = query(collection(db, "email_queue"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setCampaigns(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Failed to fetch campaigns", e);
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [leadsSnap, settingsSnap] = await Promise.all([
          getDocs(collection(db, "leads")),
          getDocs(collection(db, "settings"))
        ]);
        
        setLeads(leadsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        const globalSettings = settingsSnap.docs.find(d => d.id === 'global')?.data();
        if (globalSettings) {
          setSettings(globalSettings);
        }
        
        await fetchCampaigns();
      } catch (err) {
        toast.error("Failed to fetch data for email module");
      }
    }
    fetchData();
  }, []);

  // Filter Logic
  const filteredLeads = leads.filter(lead => {
    const matchesStage = stageFilter === "All Stages" || lead.leadStage === stageFilter;
    const matchesType = typeFilter === "All Types" || lead.investorType === typeFilter;
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

  const insertTag = (tag: string) => {
    if (bodyRef.current) {
      const start = bodyRef.current.selectionStart;
      const end = bodyRef.current.selectionEnd;
      const newBody = body.substring(0, start) + tag + body.substring(end);
      setBody(newBody);
      
      // Reset cursor focus after state update hack
      setTimeout(() => {
        if (bodyRef.current) {
          bodyRef.current.focus();
          bodyRef.current.setSelectionRange(start + tag.length, start + tag.length);
        }
      }, 0);
    } else {
      setBody(prev => prev + tag);
    }
  };

  const sendCampaign = async () => {
    if (selectedLeads.size === 0) return toast.error("Select at least 1 recipient.");
    if (!subject || !body || !campaignName) return toast.error("Fill in all campaign details.");
    
    try {
      await addDoc(collection(db, "email_queue"), {
        campaignName,
        sender,
        subject,
        bodyTemplate: body,
        recipientIds: Array.from(selectedLeads),
        status: "queued",
        createdAt: Timestamp.now(),
        createdBy: user?.uid
      });
      toast.success(`Campaign "${campaignName}" queued for ${selectedLeads.size} recipients!`);
      setView('dashboard');
      // Reset compose state
      setCampaignName("");
      setSubject("");
      setSelectedLeads(new Set());
      await fetchCampaigns();
    } catch (err) {
      toast.error("Failed to queue campaign");
    }
  };

  const tags = [
    { tag: "{{first_name}}", label: "First Name" },
    { tag: "{{last_name}}", label: "Last Name" },
    { tag: "{{organization}}", label: "Organization" },
    { tag: "{{email}}", label: "Email" },
    { tag: "{{investor_type}}", label: "Investor Type" },
    { tag: "{{lead_stage}}", label: "Lead Stage" },
    { tag: "{{current_country}}", label: "Country" },
  ];

  const totalCampaigns = campaigns.length;
  const queuedCampaigns = campaigns.filter(c => c.status === 'queued').length;
  const sentCampaigns = campaigns.filter(c => c.status === 'sent').length;
  const sentRecipients = campaigns.filter(c => c.status === 'sent').reduce((acc, c) => acc + (c.recipientIds?.length || 0), 0);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {view === 'dashboard' ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">Email Campaigns & Broadcasts</h1>
              <span className="px-2.5 py-0.5 rounded-md border border-slate-200 text-xs font-medium text-slate-600 bg-white">
                Brevo Engine
              </span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => router.push('/settings')} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-md font-medium text-sm hover:bg-slate-50 transition-colors shadow-sm">
                <Settings2 className="w-4 h-4" /> Brevo Config
              </button>
              <button 
                onClick={() => setView('compose')}
                className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] text-white rounded-md font-medium text-sm hover:bg-black transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> New Campaign
              </button>
            </div>
          </div>
          
          <p className="text-slate-500 text-sm -mt-6">
            Design personalized investor outreach, target specific investor groups, and track real-time delivery, open & click rates.
          </p>

          {/* Banner */}
          <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-[#166534]">
              <CheckCircle2 className="w-5 h-5" />
              <p className="text-sm">
                <strong>Brevo queue active.</strong> Up to 300 emails are sent per UTC day; remaining recipients continue automatically.
              </p>
            </div>
            <div className="text-xs font-medium text-[#166534] flex flex-col items-end">
              <span>Native</span>
              <span>Supabase</span>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard icon={<Mail className="w-5 h-5 text-slate-600"/>} title="Total Campaigns" value={totalCampaigns.toString()} sub="Broadcast updates" />
            <MetricCard icon={<Send className="w-5 h-5 text-blue-500"/>} title="Total Sent" value={sentRecipients.toString()} sub={`${sentCampaigns} sent · ${queuedCampaigns} queued`} valueColor="text-blue-600" />
            <MetricCard icon={<CheckCircle2 className="w-5 h-5 text-emerald-500"/>} title="Delivered" value={sentRecipients.toString()} sub="100% delivery rate (simulated)" valueColor="text-emerald-600" />
            <MetricCard icon={<Eye className="w-5 h-5 text-indigo-500"/>} title="Open Rate" value="0%" sub="0 opened" valueColor="text-indigo-600" />
            <MetricCard icon={<MousePointerClick className="w-5 h-5 text-purple-500"/>} title="Click Rate" value="0%" sub="0 clicked links" valueColor="text-purple-600" />
            <MetricCard icon={<AlertCircle className="w-5 h-5 text-amber-500"/>} title="Bounces / Failed" value="0" sub="Deliverability issues" valueColor="text-amber-600" />
          </div>

          {/* Campaign Queue Table */}
          <div className="mt-8 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
              <Clock className="w-4 h-4 text-slate-500" />
              <h3 className="font-semibold text-slate-900">Campaign History & Queue</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Campaign Name</th>
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Recipients</th>
                    <th className="px-6 py-4">Date Queued</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {campaigns.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No campaigns found.</td>
                    </tr>
                  ) : (
                    campaigns.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">{c.campaignName}</td>
                        <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{c.subject}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider ${c.status === 'queued' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{c.recipientIds?.length || 0} users</td>
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
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col animate-in slide-in-from-right-8 duration-300">
          {/* Compose Header */}
          <div className="border-b border-slate-100 p-6 flex justify-between items-center bg-slate-50">
            <div className="flex items-center gap-4">
              <div className="bg-white p-2 rounded-md shadow-sm border border-slate-200">
                <Mail className="w-6 h-6 text-slate-700" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Compose Investor Campaign</h2>
                <p className="text-sm text-slate-500">Targeted outreach with Brevo delivery and dynamic CRM personalization.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={sendCampaign}
                className="px-6 py-2 bg-slate-900 text-white rounded-md font-medium text-sm hover:bg-slate-800 shadow-sm transition-colors"
              >
                Compose
              </button>
              <button 
                onClick={() => setBodyMode('rendered')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-md font-medium text-sm hover:bg-slate-50 transition-colors shadow-sm"
              >
                <Eye className="w-4 h-4" /> Live Preview
              </button>
              <button onClick={() => setView('dashboard')} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row h-full max-h-[800px] overflow-hidden">
            {/* Left Column: Form & Editor */}
            <div className="flex-1 p-6 overflow-y-auto border-r border-slate-100">
              <div className="flex gap-6 mb-6">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Campaign Name (Internal)</label>
                  <input 
                    type="text" 
                    value={campaignName}
                    onChange={e => setCampaignName(e.target.value)}
                    placeholder="e.g. Q1 Fund II Performance Note" 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-semibold text-slate-700">From Sender</label>
                  <input 
                    type="text" 
                    value={sender}
                    onChange={e => setSender(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 font-mono text-slate-600 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <label className="text-sm font-semibold text-slate-700">Subject Line</label>
                <input 
                  type="text" 
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Exclusive Update: Fund II Q1 Track Record for {{organization}}" 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                />
              </div>

              <div className="mb-6 p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    ✨ Insert Personalization Tag:
                  </span>
                  <span className="text-xs text-slate-400">Click to insert at cursor</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map(t => (
                    <button 
                      key={t.tag}
                      onClick={() => insertTag(t.tag)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono text-slate-600 hover:border-slate-400 hover:text-slate-900 transition-colors flex items-center shadow-sm"
                    >
                      {t.tag} <span className="ml-1 text-[10px] text-slate-400 font-sans">({t.label})</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end mb-2">
                  <label className="text-sm font-semibold text-slate-700">HTML Message Body</label>
                  <div className="flex border border-slate-200 rounded-md overflow-hidden">
                    <button 
                      onClick={() => setBodyMode('source')}
                      className={`px-3 py-1 text-xs font-medium ${bodyMode === 'source' ? 'bg-slate-100 text-slate-900' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                    >
                      HTML Source
                    </button>
                    <button 
                      onClick={() => setBodyMode('rendered')}
                      className={`px-3 py-1 text-xs font-medium border-l border-slate-200 ${bodyMode === 'rendered' ? 'bg-slate-100 text-slate-900' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                    >
                      Rendered
                    </button>
                  </div>
                </div>
                
                {bodyMode === 'source' ? (
                  <textarea 
                    ref={bodyRef}
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    className="w-full h-64 p-4 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-slate-900 outline-none transition-all resize-none"
                  />
                ) : (
                  <div 
                    className="w-full h-64 p-4 border border-slate-200 rounded-lg prose prose-sm max-w-none overflow-y-auto bg-white"
                    dangerouslySetInnerHTML={{ __html: body }}
                  />
                )}
              </div>
            </div>

            {/* Right Column: Filters & Audience */}
            <div className="w-full lg:w-80 bg-slate-50 p-6 overflow-y-auto flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Filter className="w-4 h-4" /> Investor Group Filters
                </h3>
                <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full text-xs font-medium">
                  {selectedLeads.size} Selected
                </span>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Investor List</label>
                  <select className="w-full text-sm border-slate-200 rounded-md p-2 bg-white">
                    <option>All Lists</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Investor Type</label>
                  <select 
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full text-sm border-slate-200 rounded-md p-2 bg-white"
                  >
                    <option value="All Types">All Types</option>
                    {settings.investorTypes?.map((t: string) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Pipeline Stage</label>
                  <select 
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                    className="w-full text-sm border-slate-200 rounded-md p-2 bg-white"
                  >
                    <option value="All Stages">All Stages</option>
                    {settings.leadStages?.map((s: string) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Fund / Client Type</label>
                  <select className="w-full text-sm border-slate-200 rounded-md p-2 bg-white">
                    <option>All Funds</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-slate-500">Matches: <strong className="text-slate-700">{filteredLeads.length}</strong> leads</span>
                <div className="flex gap-2 text-xs font-medium">
                  <button onClick={handleSelectAll} className="text-slate-900 hover:underline">Select All</button>
                  <span className="text-slate-300">·</span>
                  <button onClick={() => setSelectedLeads(new Set())} className="text-slate-500 hover:underline">Clear</button>
                </div>
              </div>

              <div className="relative mb-3">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by name or email..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md outline-none focus:border-slate-400"
                />
              </div>

              <div className="flex-1 bg-white border border-slate-200 rounded-md overflow-y-auto">
                {filteredLeads.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 mt-4">
                    No investors match the chosen group filters.
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {filteredLeads.map(lead => (
                      <li key={lead.id} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 cursor-pointer" onClick={() => toggleLead(lead.id)}>
                        <input 
                          type="checkbox" 
                          checked={selectedLeads.has(lead.id)} 
                          onChange={() => {}} // handled by li click
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        />
                        <div className="overflow-hidden">
                          <p className="text-xs font-medium text-slate-900 truncate">{lead.firstName} {lead.lastName}</p>
                          <p className="text-[10px] text-slate-500 truncate">{lead.email || lead.organization}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon, title, value, sub, valueColor = "text-slate-900" }: { icon: any, title: string, value: string, sub: string, valueColor?: string }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <span className="text-sm font-medium text-slate-600">{title}</span>
      </div>
      <div>
        <h3 className={`text-3xl font-bold mb-1 ${valueColor}`}>{value}</h3>
        <p className="text-xs text-slate-500">{sub}</p>
      </div>
    </div>
  );
}
