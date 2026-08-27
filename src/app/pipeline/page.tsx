"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { Building2, Calendar } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import toast from "react-hot-toast";
import { LeadSlideOver } from "@/components/leads/LeadSlideOver";

export default function PipelinePage() {
  const { user, profile } = useAuth();
  const [stages, setStages] = useState<string[]>([]);
  const [leadsByStage, setLeadsByStage] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  
  // Settings & SlideOver
  const [settings, setSettings] = useState<any>(null);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);

  const fetchData = async () => {
    if (!user || !profile) return;
    
    try {
      // 1. Fetch Global Settings
      const settingsSnap = await getDoc(doc(db, "settings", "global"));
      let activeStages = ["New", "Contacted", "Closed Won"]; 
      if (settingsSnap.exists()) {
        const data = settingsSnap.data();
        setSettings(data);
        if (data.leadStages) activeStages = data.leadStages;
      }
      setStages(activeStages);

      // 2. Fetch Leads
      let q: any = collection(db, "leads");
      if (profile.role === "junior") {
        q = query(q, where("primaryOwner", "==", user.uid));
      }
      
      const querySnapshot = await getDocs(q);
      const allLeads: any[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 3. Group Leads by Stage
      const grouped: Record<string, any[]> = {};
      activeStages.forEach(s => { grouped[s] = []; }); 
      
      allLeads.forEach(lead => {
        const stage = lead.leadStage || "New";
        if (!grouped[stage]) grouped[stage] = [];
        grouped[stage].push(lead);
      });
      
      setLeadsByStage(grouped);
    } catch (err) {
      toast.error("Failed to load pipeline data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, profile]);

  const onDragEnd = async (result: any) => {
    const { source, destination, draggableId } = result;

    // Dropped outside a list
    if (!destination) return;

    // Dropped in the same place
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const sourceStage = source.droppableId;
    const destStage = destination.droppableId;

    // Deep copy current state
    const newLeadsByStage = { ...leadsByStage };
    const sourceList = [...newLeadsByStage[sourceStage]];
    const destList = sourceStage === destStage ? sourceList : [...(newLeadsByStage[destStage] || [])];

    // Remove from source
    const [movedLead] = sourceList.splice(source.index, 1);
    
    // Optimistically update lead stage
    movedLead.leadStage = destStage;

    // Insert into destination
    destList.splice(destination.index, 0, movedLead);

    // Update state optimistically
    newLeadsByStage[sourceStage] = sourceList;
    if (sourceStage !== destStage) {
      newLeadsByStage[destStage] = destList;
    }
    setLeadsByStage(newLeadsByStage);

    // Save to Firebase
    try {
      await updateDoc(doc(db, "leads", draggableId), {
        leadStage: destStage
      });
      if (sourceStage !== destStage) {
        toast.success(`Moved to ${destStage}`);
      }
    } catch (err) {
      toast.error("Failed to update lead stage");
      // Revert on failure
      fetchData();
    }
  };

  const handleCardClick = (lead: any) => {
    setSelectedLead(lead);
    setIsSlideOverOpen(true);
  };

  if (loading) return <div className="p-8 text-slate-500 animate-pulse">Loading pipeline...</div>;

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pipeline</h1>
        <p className="text-slate-500 mt-1">Drag and drop leads to update their current stage.</p>
      </div>

      <div className="flex-1 flex overflow-hidden pb-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 overflow-x-auto w-full h-full pb-2">
            {stages.map(stage => {
              const columnLeads = leadsByStage[stage] || [];
              
              return (
                <div key={stage} className="flex-shrink-0 w-80 flex flex-col bg-slate-100/50 rounded-xl max-h-full border border-slate-200 shadow-sm">
                  <div className="p-4 flex items-center justify-between border-b border-slate-200 bg-slate-50 rounded-t-xl">
                    <h3 className="font-semibold text-slate-700">{stage}</h3>
                    <span className="bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm">
                      {columnLeads.length}
                    </span>
                  </div>
                  
                  <Droppable droppableId={stage}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef} 
                        {...provided.droppableProps}
                        className={`flex-1 p-3 overflow-y-auto space-y-3 transition-colors ${snapshot.isDraggingOver ? 'bg-slate-100' : ''}`}
                      >
                        {columnLeads.map((lead, index) => (
                          <Draggable key={lead.id} draggableId={lead.id} index={index}>
                            {(provided, snapshot) => (
                              <div 
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => handleCardClick(lead)}
                                className={`bg-white p-4 rounded-lg border transition-all ${
                                  snapshot.isDragging 
                                    ? 'shadow-xl border-blue-400 rotate-2 scale-105 z-50' 
                                    : 'shadow-sm border-slate-200 hover:border-blue-300'
                                }`}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-bold text-slate-900 leading-tight">
                                    {lead.firstName} {lead.lastName}
                                  </h4>
                                  {lead.investorType && (
                                    <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                      {lead.investorType}
                                    </span>
                                  )}
                                </div>
                                
                                <div className="space-y-2 mt-3">
                                  {lead.organization && (
                                    <div className="flex items-center text-xs text-slate-500 font-medium">
                                      <Building2 className="w-3.5 h-3.5 mr-2 text-slate-400" />
                                      <span className="truncate">{lead.organization}</span>
                                    </div>
                                  )}
                                  
                                  {lead.followUpDate && (
                                    <div className="flex items-center text-xs text-slate-500 font-medium">
                                      <Calendar className="w-3.5 h-3.5 mr-2 text-amber-500" />
                                      {format(lead.followUpDate.toDate(), "MMM d, yyyy")}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        
                        {provided.placeholder}
                        
                        {columnLeads.length === 0 && !snapshot.isDraggingOver && (
                          <div className="text-center p-6 text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                            Drop leads here
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

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
