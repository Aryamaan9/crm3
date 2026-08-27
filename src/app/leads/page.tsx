"use client";

import { useEffect, useState, useRef } from "react";
import { collection, query, where, getDocs, addDoc, Timestamp, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { AddLeadModal } from "@/components/leads/AddLeadModal";
import { Plus, Search, Filter, Download, Upload, LayoutGrid, ArrowUp, ArrowDown, EyeOff, Eye } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

type ColumnDef = { id: string; label: string; visible: boolean };

import { LeadSlideOver } from "@/components/leads/LeadSlideOver";

export default function LeadsPage() {
  const { user, profile } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Slide over state
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState<any>(null);

  const [showColsMenu, setShowColsMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [columns, setColumns] = useState<ColumnDef[]>([
    { id: 'firstName', label: 'First Name', visible: true },
    { id: 'org', label: 'Organization', visible: true },
    { id: 'type', label: 'Investor Type', visible: true },
    { id: 'stage', label: 'Lead Stage', visible: true },
    { id: 'interaction', label: 'Last Interaction', visible: true },
    { id: 'followup', label: 'Follow-up Date', visible: true },
    { id: 'owner', label: 'Primary Owner', visible: true },
    { id: 'lastName', label: 'Last Name', visible: false },
    { id: 'country', label: 'Current Country', visible: false },
  ]);

  const fetchData = async () => {
    if (!user || !profile) return;
    setLoading(true);
    try {
      // Fetch settings
      const snap = await getDoc(doc(db, "settings", "global"));
      let globalSettings = snap.exists() ? snap.data() : null;
      setSettings(globalSettings);

      // Inject custom fields into columns if not present
      if (globalSettings?.customFields) {
        setColumns(prev => {
          const newCols = [...prev];
          globalSettings.customFields.forEach((cf: any) => {
            if (!newCols.find(c => c.id === cf.id)) {
              newCols.push({ id: cf.id, label: cf.label, visible: true });
            }
          });
          return newCols;
        });
      }

      // Fetch leads
      let q: any = collection(db, "leads");
      if (profile.role === "junior") {
        q = query(q, where("primaryOwner", "==", user.uid));
      }
      const querySnapshot = await getDocs(q);
      const leadsData: any[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeads(leadsData);
    } catch (err: any) {
      toast.error("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, profile]);

  // Export Logic
  const handleExport = () => {
    const visibleCols = columns.filter(c => c.visible);
    const headers = visibleCols.map(c => c.label);
    const csvContent = [
      headers.join(","),
      ...leads.map(l => visibleCols.map(c => `"${getCellValue(l, c.id) || ''}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  // Import Logic
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const [firstName, lastName, organization, email, investorType, leadStage] = lines[i].split(',').map(s => s.replace(/"/g, '').trim());
          await addDoc(collection(db, "leads"), {
            firstName: firstName || "",
            lastName: lastName || "",
            organization: organization || "Imported Org",
            email: email || "",
            investorType: investorType || "Unknown",
            leadStage: leadStage || "New",
            lastInteraction: Timestamp.now(),
            primaryOwner: user?.uid,
            createdAt: Timestamp.now(),
          });
        }
        await fetchData();
        toast.success("Import successful!");
      } catch (err) {
        toast.error("Failed to parse or import CSV.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Column Reordering Logic
  const moveColumn = (index: number, direction: 'up' | 'down') => {
    const newCols = [...columns];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newCols.length && newCols[targetIndex].visible === newCols[index].visible) {
      [newCols[index], newCols[targetIndex]] = [newCols[targetIndex], newCols[index]];
      setColumns(newCols);
    }
  };

  const toggleColumn = (id: string) => {
    setColumns(columns.map(c => c.id === id ? { ...c, visible: !c.visible } : c));
  };

  const getCellValue = (lead: any, colId: string) => {
    switch(colId) {
      case 'firstName': return lead.firstName;
      case 'lastName': return lead.lastName;
      case 'org': return lead.organization;
      case 'type': return lead.investorType;
      case 'stage': return lead.leadStage;
      case 'interaction': return lead.lastInteraction ? format(lead.lastInteraction.toDate(), "MMM d, yyyy") : "-";
      case 'followup': return lead.followUpDate ? format(lead.followUpDate.toDate(), "MMM d, yyyy") : "-";
      case 'owner': return lead.primaryOwner === user?.uid ? "Me" : "Other User";
      case 'country': return lead.country || "-";
      default: return lead[colId] || ""; // Handle dynamic custom fields
    }
  };

  const renderCell = (lead: any, colId: string) => {
    const val = getCellValue(lead, colId);
    if (colId === 'type') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">{val}</span>;
    }
    if (colId === 'stage') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">{val}</span>;
    }
    return <span className="text-slate-600">{val}</span>;
  };

  const handleRowClick = (lead: any) => {
    setSelectedLead(lead);
    setIsSlideOverOpen(true);
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchQuery || 
      `${lead.firstName} ${lead.lastName} ${lead.organization} ${lead.email}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = stageFilter === 'All' || lead.leadStage === stageFilter;
    return matchesSearch && matchesStage;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col h-full">
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="text-sm text-slate-500 mt-1">{filteredLeads.length} of {leads.length} leads</p>
        </div>
        <div className="flex items-center gap-3 relative">
          
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">
            <Download className="w-4 h-4" /> Export
          </button>
          
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleImport} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">
            <Upload className="w-4 h-4" /> Import
          </button>
          
          <div className="relative" ref={colsMenuRef}>
            <button 
              onClick={() => setShowColsMenu(!showColsMenu)}
              className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
            >
              <LayoutGrid className="w-4 h-4" /> Columns
            </button>
            
            {showColsMenu && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-xl z-20 py-2">
                <div className="px-4 py-2">
                  <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Visible Columns (Drag to reorder)</h4>
                  <div className="space-y-1">
                    {columns.map((c, i) => c.visible && (
                      <div key={c.id} className="flex items-center justify-between group hover:bg-slate-50 px-2 py-1.5 rounded-md">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col text-slate-300 group-hover:text-slate-500">
                            <button onClick={() => moveColumn(i, 'up')} className="hover:text-slate-900"><ArrowUp className="w-3 h-3" /></button>
                            <button onClick={() => moveColumn(i, 'down')} className="hover:text-slate-900"><ArrowDown className="w-3 h-3" /></button>
                          </div>
                          <span className="text-sm font-medium text-slate-700">{c.label}</span>
                        </div>
                        <button onClick={() => toggleColumn(c.id)} className="text-slate-400 hover:text-slate-600">
                          <EyeOff className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="border-t border-slate-100 mt-2 pt-2 px-4 pb-2">
                  <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Hidden Columns</h4>
                  <div className="space-y-1">
                    {columns.map(c => !c.visible && (
                      <div key={c.id} className="flex items-center gap-2 hover:bg-slate-50 px-2 py-1.5 rounded-md text-slate-500">
                        <button onClick={() => toggleColumn(c.id)} className="text-slate-400 hover:text-blue-600">
                          <Eye className="w-4 h-4" />
                        </button>
                        <span className="text-sm">{c.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800"
          >
            <Plus className="w-4 h-4" /> New Lead
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, organization, email..." 
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="relative" ref={filterMenuRef}>
          <button 
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50"
          >
            <Filter className="w-4 h-4" /> {stageFilter === 'All' ? 'Filter' : stageFilter}
          </button>
          
          {showFilterMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-20 py-2">
              <div className="px-4 py-2">
                <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Filter by Stage</h4>
                <div className="space-y-1">
                  <button 
                    onClick={() => { setStageFilter('All'); setShowFilterMenu(false); }}
                    className={`w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-slate-50 ${stageFilter === 'All' ? 'font-bold text-blue-600' : 'text-slate-600'}`}
                  >
                    All Stages
                  </button>
                  {settings?.leadStages?.map((stage: string) => (
                    <button 
                      key={stage}
                      onClick={() => { setStageFilter(stage); setShowFilterMenu(false); }}
                      className={`w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-slate-50 ${stageFilter === stage ? 'font-bold text-blue-600' : 'text-slate-600'}`}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold">
              <tr>
                <th className="px-6 py-4 w-10">
                  <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                </th>
                {columns.filter(c => c.visible).map(c => (
                  <th key={c.id} className="px-6 py-4">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={columns.filter(c => c.visible).length + 1} className="px-6 py-8 text-center text-slate-500">Loading leads...</td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={columns.filter(c => c.visible).length + 1} className="px-6 py-12 text-center text-slate-500">
                    No leads found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} onClick={() => handleRowClick(lead)} className="hover:bg-slate-50 transition-colors cursor-pointer">
                    <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    </td>
                    {columns.filter(c => c.visible).map(c => (
                      <td key={c.id} className="px-6 py-4">
                        {renderCell(lead, c.id)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddLeadModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchData} 
      />

      <LeadSlideOver
        isOpen={isSlideOverOpen}
        onClose={() => setIsSlideOverOpen(false)}
        lead={selectedLead}
        onSuccess={fetchData}
        settings={settings}
      />
    </div>
  );
}
