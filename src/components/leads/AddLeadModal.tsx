"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { X } from "lucide-react";
import toast from "react-hot-toast";

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddLeadModal({ isOpen, onClose, onSuccess }: AddLeadModalProps) {
  const { user } = useAuth();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organization, setOrganization] = useState("");
  const [email, setEmail] = useState("");
  const [investorType, setInvestorType] = useState("");
  const [leadStage, setLeadStage] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  
  // Custom Fields state
  const [customData, setCustomData] = useState<Record<string, any>>({});
  
  const [availableStages, setAvailableStages] = useState<string[]>([]);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [customFields, setCustomFields] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      const snap = await getDoc(doc(db, "settings", "global"));
      if (snap.exists()) {
        const data = snap.data();
        setAvailableStages(data.leadStages || []);
        setAvailableTypes(data.investorTypes || []);
        setCustomFields(data.customFields || []);
        if (data.leadStages?.length > 0) setLeadStage(data.leadStages[0]);
        if (data.investorTypes?.length > 0) setInvestorType(data.investorTypes[0]);
      }
    }
    if (isOpen) fetchSettings();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);

    try {
      await addDoc(collection(db, "leads"), {
        firstName,
        lastName,
        organization,
        email,
        investorType,
        leadStage,
        followUpDate: followUpDate ? Timestamp.fromDate(new Date(followUpDate)) : null,
        lastInteraction: Timestamp.now(),
        primaryOwner: user.uid,
        createdAt: Timestamp.now(),
        ...customData // Inject custom fields directly into the document
      });
      toast.success("Lead created successfully");
      onSuccess();
      onClose();
      // Reset form
      setFirstName(""); setLastName(""); setOrganization(""); setEmail(""); setFollowUpDate(""); setCustomData({});
    } catch (err: any) {
      toast.error(err.message || "Failed to create lead");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomFieldChange = (id: string, value: any) => {
    setCustomData(prev => ({ ...prev, [id]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-semibold text-slate-900">Add New Lead</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
              <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-slate-900 focus:border-slate-900 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-slate-900 focus:border-slate-900 text-sm outline-none" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Organization</label>
            <input type="text" required value={organization} onChange={e => setOrganization(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-slate-900 focus:border-slate-900 text-sm outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-slate-900 focus:border-slate-900 text-sm outline-none" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Investor Type</label>
              <select value={investorType} onChange={e => setInvestorType(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-slate-900 focus:border-slate-900 text-sm bg-white outline-none">
                {availableTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pipeline Stage</label>
              <select value={leadStage} onChange={e => setLeadStage(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-slate-900 focus:border-slate-900 text-sm bg-white outline-none">
                {availableStages.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Follow-up Date</label>
            <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-slate-900 focus:border-slate-900 text-sm outline-none" />
          </div>

          {/* Dynamic Custom Fields Rendering */}
          {customFields.length > 0 && (
            <div className="pt-4 mt-2 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Additional Information</h3>
              <div className="space-y-4">
                {customFields.map(field => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
                    <input 
                      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'} 
                      value={customData[field.id] || ""} 
                      onChange={e => handleCustomFieldChange(field.id, e.target.value)} 
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-slate-900 focus:border-slate-900 text-sm outline-none" 
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-6 mt-4 border-t border-slate-100 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 disabled:opacity-50 transition-colors">
              {loading ? "Saving..." : "Save Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
