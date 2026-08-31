"use client";

import { useEffect, useState, useRef } from "react";
import { collection, query, where, getDocs, addDoc, Timestamp, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { AddLeadModal } from "@/components/leads/AddLeadModal";
import { Plus, Search, Filter, Download, Upload, LayoutGrid, ArrowUp, ArrowDown, EyeOff, Eye, Table, Trash2 } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { LeadSlideOver } from "@/components/leads/LeadSlideOver";
import { LeadsDataSheet } from "@/components/leads/LeadsDataSheet";
import { ImportMapperModal } from "@/components/leads/ImportMapperModal";
import { LeadFilterMenu } from "@/components/leads/LeadFilterMenu";

type ColumnDef = { id: string; label: string; visible: boolean };

export default function LeadsPage() {
  const { user, profile } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Excel Mode state
  const [isExcelMode, setIsExcelMode] = useState(false);

  // Slide over state
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  
  const [columnFilters, setColumnFilters] = useState<Record<string, Set<string>>>({});
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc'|'desc'} | null>(null);
  const [importData, setImportData] = useState<{headers: string[], data: string[][]}|null>(null);
  
  // Settings state
  const [settings, setSettings] = useState<any>(null);

  const [showColsMenu, setShowColsMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colsMenuRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);

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
      const snap = await getDoc(doc(db, "settings", "global"));
      let globalSettings = snap.exists() ? snap.data() : null;
      setSettings(globalSettings);

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (colsMenuRef.current && !colsMenuRef.current.contains(event.target as Node)) {
        setShowColsMenu(false);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setShowFilterMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getCellValue = (lead: any, colId: string) => {
    switch(colId) {
      case 'firstName': return lead.firstName || "";
      case 'lastName': return lead.lastName || "";
      case 'org': return lead.organization || "";
      case 'type': return lead.investorType || "";
      case 'stage': return lead.leadStage || "";
      case 'interaction': return lead.lastInteraction ? format(typeof lead.lastInteraction.toDate === 'function' ? lead.lastInteraction.toDate() : new Date(lead.lastInteraction), "MMM d, yyyy") : "";
      case 'followup': return lead.followUpDate ? format(typeof lead.followUpDate.toDate === 'function' ? lead.followUpDate.toDate() : new Date(lead.followUpDate), "MMM d, yyyy") : "";
      case 'owner': return lead.primaryOwner === user?.uid ? "Me" : "Other User";
      case 'country': return lead.country || "";
      default: return lead[colId] || ""; 
    }
  };

  useEffect(() => {
    let res = leads.filter(lead => {
      const matchesSearch = !searchQuery || 
        `${lead.firstName} ${lead.lastName} ${lead.organization} ${lead.email}`.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Global quick filters
      const matchesStage = stageFilter === 'All' || lead.leadStage === stageFilter;
      const matchesType = typeFilter === 'All' || lead.investorType === typeFilter;
      if (!(matchesSearch && matchesStage && matchesType)) return false;

      // Column specific filters
      for (const [colId, selectedValues] of Object.entries(columnFilters)) {
        if (selectedValues.size === 0) continue; // If empty, we could treat it as "no filter" or "all excluded". Let's assume the UI handles "All" by not filtering. Wait, if all are unselected, we should probably hide all.
        // Actually, the LeadFilterMenu handles selection state. If they filter out everything, selectedValues.size is 0.
        const val = String(getCellValue(lead, colId));
        if (!selectedValues.has(val)) return false;
      }

      return true;
    });

    if (sortConfig) {
      res.sort((a, b) => {
        const valA = String(getCellValue(a, sortConfig.key)).toLowerCase();
        const valB = String(getCellValue(b, sortConfig.key)).toLowerCase();
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredLeads(res);
  }, [leads, searchQuery, stageFilter, typeFilter, columnFilters, sortConfig]);

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
  
  const handleDeleteLead = async (leadId: string) => {
    if (!confirm("Are you sure you want to delete this row? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "leads", leadId));
      setLeads(leads.filter(l => l.id !== leadId));
      toast.success("Row deleted successfully");
    } catch (err) {
      toast.error("Failed to delete row");
    }
  };

  const handleTablePaste = async (e: React.ClipboardEvent) => {
    const activeEl = document.activeElement;
    if (!activeEl) return;
    const coord = activeEl.getAttribute("data-coord");
    if (!coord) return;

    const clipboardData = e.clipboardData;
    const text = clipboardData.getData("text/plain");
    if (!text) return;

    const cleanText = text.replace(/\r\n$/, '').replace(/\n$/, '');
    if (!cleanText.includes('\t') && !cleanText.includes('\n')) {
      return; 
    }

    e.preventDefault();

    const [startRowStr, startColStr] = coord.split('-');
    const startRow = parseInt(startRowStr, 10);
    const startCol = parseInt(startColStr, 10);

    const rows = cleanText.split(/\r?\n/).map(row => row.split('\t'));
    const visibleCols = columns.filter(c => c.visible);
    const newLeads = [...leads];
    const promises = [];

    for (let r = 0; r < rows.length; r++) {
      const rowData = rows[r];
      const targetRowIdx = startRow + r;
      
      let leadUpdates: any = {};
      let isNewLead = targetRowIdx >= newLeads.length;
      
      const targetLead = isNewLead ? { 
          firstName: "", lastName: "", organization: "", email: "", 
          investorType: settings?.investorTypes?.[0] || "",
          leadStage: settings?.leadStages?.[0] || "",
      } : { ...newLeads[targetRowIdx] };

      for (let c = 0; c < rowData.length; c++) {
        const val = rowData[c];
        const targetColIdx = startCol + c;
        if (targetColIdx >= visibleCols.length) continue; 

        const col = visibleCols[targetColIdx];
        if (col.id === 'interaction' || col.id === 'owner') continue;
        
        let finalVal: any = val;
        if (col.id === 'followup') {
           const d = new Date(val);
           if (!isNaN(d.getTime())) finalVal = Timestamp.fromDate(d);
           else continue;
        } else {
           const customFieldDef = settings?.customFields?.find((cf: any) => cf.id === col.id);
           if (customFieldDef?.type === 'number') {
              finalVal = Number(val) || 0;
           } else if (customFieldDef?.type === 'date') {
              const d = new Date(val);
              if (!isNaN(d.getTime())) finalVal = Timestamp.fromDate(d);
              else continue;
           }
        }
        
        targetLead[col.id] = finalVal;
        leadUpdates[col.id] = finalVal;
      }

      if (Object.keys(leadUpdates).length === 0 && !isNewLead) continue;

      if (isNewLead) {
        const newDocData = {
           ...targetLead,
           lastInteraction: Timestamp.now(),
           primaryOwner: user?.uid,
           createdAt: Timestamp.now()
        };
        promises.push(
          addDoc(collection(db, "leads"), newDocData).then(ref => {
            newLeads[targetRowIdx] = { id: ref.id, ...newDocData };
          })
        );
      } else {
        newLeads[targetRowIdx] = targetLead;
        promises.push(updateDoc(doc(db, "leads", targetLead.id), leadUpdates));
      }
    }

    toast.loading("Pasting data...", { id: 'paste' });
    try {
       await Promise.all(promises);
       setLeads(newLeads);
       toast.success("Paste successful!", { id: 'paste' });
    } catch (err) {
       toast.error("Error pasting some rows", { id: 'paste' });
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 1) return toast.error("Empty CSV");
        
        const headers = lines[0].split(',').map(s => s.replace(/"/g, '').trim());
        const data = lines.slice(1).map(l => l.split(',').map(s => s.replace(/"/g, '').trim()));
        setImportData({ headers, data });
      } catch (err) {
        toast.error("Failed to parse CSV.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImportConfirm = async (mapping: Record<string, string>, newFields: {id: string; label: string; type: string}[]) => {
    if (!importData) return;
    setLoading(true);
    setImportData(null);
    try {
      // 1. Create new custom fields if any
      if (newFields.length > 0) {
        const globalRef = doc(db, "settings", "global");
        const existingCustomFields = settings?.customFields || [];
        const updatedCustomFields = [...existingCustomFields, ...newFields];
        await updateDoc(globalRef, { customFields: updatedCustomFields });
        
        // Update local settings state so columns update
        setSettings({ ...settings, customFields: updatedCustomFields });
        setColumns(prev => {
          const newCols = [...prev];
          newFields.forEach(cf => newCols.push({ id: cf.id, label: cf.label, visible: true }));
          return newCols;
        });
      }

      // 2. Import rows
      const promises = importData.data.map(row => {
        const leadData: any = {
          lastInteraction: Timestamp.now(),
          primaryOwner: user?.uid,
          createdAt: Timestamp.now(),
          investorType: settings?.investorTypes?.[0] || "Unknown",
          leadStage: settings?.leadStages?.[0] || "New",
        };
        
        importData.headers.forEach((header, idx) => {
          const mappedKey = mapping[header];
          if (mappedKey && mappedKey !== '__SKIP__') {
            const val = row[idx];
            if (val) {
               // Basic type coercion
               const cfDef = newFields.find(f => f.id === mappedKey) || settings?.customFields?.find((f:any) => f.id === mappedKey);
               if (cfDef?.type === 'number') {
                  leadData[mappedKey] = Number(val) || 0;
               } else if (cfDef?.type === 'date') {
                  const d = new Date(val);
                  if (!isNaN(d.getTime())) leadData[mappedKey] = Timestamp.fromDate(d);
               } else {
                  leadData[mappedKey] = val;
               }
            }
          }
        });
        
        // Enforce required base fields if missing
        if (!leadData.firstName) leadData.firstName = "Unknown";
        if (!leadData.lastName) leadData.lastName = "";
        
        return addDoc(collection(db, "leads"), leadData);
      });
      
      await Promise.all(promises);
      toast.success(`Successfully imported ${importData.data.length} leads!`);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Error during import.");
    } finally {
      setLoading(false);
    }
  };

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

  // EXCEL MODE LOGIC
  const handleExcelUpdate = async (leadId: string, colId: string, value: any) => {
    try {
      let finalValue = value;
      if (colId === 'followup' && value) {
        finalValue = Timestamp.fromDate(new Date(value));
      } else {
        const customFieldDef = settings?.customFields?.find((cf: any) => cf.id === colId);
        if (customFieldDef?.type === 'date' && value) {
          finalValue = Timestamp.fromDate(new Date(value));
        } else if (customFieldDef?.type === 'number' && value) {
          finalValue = Number(value);
        }
      }

      await updateDoc(doc(db, "leads", leadId), { [colId]: finalValue });
      setLeads(leads.map(l => l.id === leadId ? { ...l, [colId]: finalValue } : l));
      toast.success("Updated successfully");
    } catch (e) {
      toast.error("Failed to update");
    }
  };

  const handleAddExcelRow = async () => {
    try {
      const docRef = await addDoc(collection(db, "leads"), {
        firstName: "",
        lastName: "",
        organization: "New Lead",
        email: "",
        investorType: settings?.investorTypes?.[0] || "",
        leadStage: settings?.leadStages?.[0] || "",
        lastInteraction: Timestamp.now(),
        primaryOwner: user?.uid,
        createdAt: Timestamp.now()
      });
      const newLead = { 
        id: docRef.id, 
        firstName: "",
        lastName: "",
        organization: "New Lead",
        email: "",
        investorType: settings?.investorTypes?.[0] || "",
        leadStage: settings?.leadStages?.[0] || "",
        lastInteraction: Timestamp.now(), 
        primaryOwner: user?.uid, 
        createdAt: Timestamp.now() 
      };
      setLeads([...leads, newLead]);
      
      // Auto focus the new row
      setTimeout(() => {
        const el = document.querySelector(`[data-coord="${filteredLeads.length}-0"]`) as HTMLElement;
        if (el) el.focus();
      }, 100);
      
    } catch (e) {
      toast.error("Failed to add row");
    }
  };

  const renderExcelModeCell = (lead: any, col: ColumnDef, rowIndex: number, colIndex: number) => {
    let type: 'text' | 'number' | 'date' | 'select' = 'text';
    let options: string[] = [];
    let readOnly = false;

    if (col.id === 'type') {
      type = 'select';
      options = settings?.investorTypes || [];
    } else if (col.id === 'stage') {
      type = 'select';
      options = settings?.leadStages || [];
    } else if (col.id === 'interaction' || col.id === 'owner') {
      readOnly = true;
    } else if (col.id === 'followup') {
      type = 'date';
    } else {
      const customFieldDef = settings?.customFields?.find((cf: any) => cf.id === col.id);
      if (customFieldDef) {
        if (customFieldDef.type === 'number') type = 'number';
        if (customFieldDef.type === 'date') type = 'date';
      }
    }
    
    // We pass the raw value to ExcelCell so it can handle Timestamp objects natively
    let rawValue = lead[col.id] || "";
    
    return (
      <ExcelCell
        value={rawValue}
        colId={col.id}
        rowIndex={rowIndex}
        colIndex={colIndex}
        type={type}
        options={options}
        readOnly={readOnly}
        onChange={(cId, newVal) => handleExcelUpdate(lead.id, cId, newVal)}
      />
    );
  };

  const handleRowClick = (lead: any) => {
    if (isExcelMode) return;
    setSelectedLead(lead);
    setIsSlideOverOpen(true);
  };

  const getUniqueValues = (colId: string) => {
    const vals = new Set(leads.map(l => String(getCellValue(l, colId))));
    return Array.from(vals).filter(Boolean).sort();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col h-full">
      {importData && (
        <ImportMapperModal
          csvHeaders={importData.headers}
          csvData={importData.data}
          existingFields={[
            { id: 'firstName', label: 'First Name', type: 'text' },
            { id: 'lastName', label: 'Last Name', type: 'text' },
            { id: 'organization', label: 'Organization', type: 'text' },
            { id: 'email', label: 'Email', type: 'text' },
            { id: 'investorType', label: 'Investor Type', type: 'text' },
            { id: 'leadStage', label: 'Lead Stage', type: 'text' },
            ...(settings?.customFields || [])
          ]}
          onCancel={() => setImportData(null)}
          onConfirm={handleImportConfirm}
        />
      )}

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
            onClick={() => setIsExcelMode(!isExcelMode)}
            className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md border transition-colors ${
              isExcelMode ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Table className="w-4 h-4" /> Excel Mode
          </button>

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
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-md transition-colors ${
              stageFilter !== 'All' || typeFilter !== 'All' 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" /> 
            {stageFilter !== 'All' || typeFilter !== 'All' ? 'Filters Active' : 'Filter'}
          </button>
          
          {showFilterMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-xl z-20 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800 text-sm">Advanced Filters</h3>
                {(stageFilter !== 'All' || typeFilter !== 'All') && (
                  <button 
                    onClick={() => { setStageFilter('All'); setTypeFilter('All'); }}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Pipeline Stage</label>
                  <select 
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-md p-2 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  >
                    <option value="All">All Stages</option>
                    {settings?.leadStages?.map((stage: string) => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Investor Type</label>
                  <select 
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-md p-2 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  >
                    <option value="All">All Types</option>
                    {settings?.investorTypes?.map((t: string) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className={`bg-white border border-slate-200 rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col ${isExcelMode ? 'ring-2 ring-blue-500/20' : ''}`}>
        {isExcelMode ? (
          <LeadsDataSheet 
            leads={filteredLeads} 
            setLeads={setLeads}
            columns={columns}
            settings={settings}
          />
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 w-10">
                    <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  </th>
                  {columns.filter(c => c.visible).map(c => (
                    <th key={c.id} className="px-6 py-3 font-medium text-slate-700 align-top">
                      <LeadFilterMenu
                        label={c.label}
                        uniqueValues={getUniqueValues(c.id)}
                        selectedValues={columnFilters[c.id] || new Set(getUniqueValues(c.id))}
                        onSort={(direction) => direction ? setSortConfig({ key: c.id, direction }) : setSortConfig(null)}
                        onFilterChange={(newSelected) => setColumnFilters(prev => ({ ...prev, [c.id]: newSelected }))}
                      />
                    </th>
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
                  filteredLeads.map((lead, rowIndex) => (
                    <tr 
                      key={lead.id} 
                      onClick={() => handleRowClick(lead)} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-2" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      </td>
                      {columns.filter(c => c.visible).map((c, colIndex) => (
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
        )}
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
