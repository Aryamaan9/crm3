"use client";

import { useState, useEffect } from "react";
import { doc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { X, Trash2, Save, Mail, Calendar, Building2, User } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

interface LeadSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
  onSuccess: () => void;
  settings: any;
}

export function LeadSlideOver({ isOpen, onClose, lead, onSuccess, settings }: LeadSlideOverProps) {
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (lead) {
      setFormData({
        ...lead,
        followUpDate: lead.followUpDate ? format(lead.followUpDate.toDate(), 'yyyy-MM-dd') : ""
      });
      setIsEditing(false); // Reset to view mode on open
    }
  }, [lead, isOpen]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!lead?.id) return;
    setLoading(true);
    try {
      const updatePayload = {
        ...formData,
        followUpDate: formData.followUpDate ? Timestamp.fromDate(new Date(formData.followUpDate)) : null,
      };
      
      await updateDoc(doc(db, "leads", lead.id), updatePayload);
      toast.success("Lead updated successfully");
      setIsEditing(false);
      onSuccess();
    } catch (err: any) {
      toast.error("Failed to update lead");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!lead?.id) return;
    if (!confirm("Are you sure you want to delete this lead? This action cannot be undone.")) return;
    
    setLoading(true);
    try {
      await deleteDoc(doc(db, "leads", lead.id));
      toast.success("Lead deleted");
      onClose();
      onSuccess();
    } catch (err: any) {
      toast.error("Failed to delete lead");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !lead) return null;

  const customFields = settings?.customFields || [];
  const availableStages = settings?.leadStages || [];
  const availableTypes = settings?.investorTypes || [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300" onMouseDown={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg">
              {formData.firstName?.[0]}{formData.lastName?.[0]}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{formData.firstName} {formData.lastName}</h2>
              <p className="text-sm text-slate-500">{formData.organization}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="text-sm font-medium text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-md hover:bg-slate-50">
                Edit
              </button>
            ) : (
              <button onClick={handleSave} disabled={loading} className="text-sm font-medium text-white bg-slate-900 px-3 py-1.5 rounded-md hover:bg-slate-800 disabled:opacity-50">
                {loading ? "Saving..." : "Save"}
              </button>
            )}
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Core Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Info</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">First Name</label>
                {isEditing ? (
                  <input type="text" value={formData.firstName || ''} onChange={e => handleChange('firstName', e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm outline-none focus:border-slate-900" />
                ) : (
                  <p className="text-sm font-medium text-slate-900 flex items-center gap-2"><User className="w-4 h-4 text-slate-400"/> {formData.firstName || "-"}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Last Name</label>
                {isEditing ? (
                  <input type="text" value={formData.lastName || ''} onChange={e => handleChange('lastName', e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm outline-none focus:border-slate-900" />
                ) : (
                  <p className="text-sm font-medium text-slate-900">{formData.lastName || "-"}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Organization</label>
              {isEditing ? (
                <input type="text" value={formData.organization || ''} onChange={e => handleChange('organization', e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm outline-none focus:border-slate-900" />
              ) : (
                <p className="text-sm font-medium text-slate-900 flex items-center gap-2"><Building2 className="w-4 h-4 text-slate-400"/> {formData.organization || "-"}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
              {isEditing ? (
                <input type="email" value={formData.email || ''} onChange={e => handleChange('email', e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm outline-none focus:border-slate-900" />
              ) : (
                <p className="text-sm font-medium text-slate-900 flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400"/> {formData.email || "-"}</p>
              )}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Pipeline Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pipeline Status</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Investor Type</label>
                {isEditing ? (
                  <select value={formData.investorType || ''} onChange={e => handleChange('investorType', e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm bg-white outline-none focus:border-slate-900">
                    {availableTypes.map((t: string) => <option key={t} value={t}>{t}</option>)}
                  </select>
                ) : (
                  <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700">{formData.investorType || "-"}</span>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Pipeline Stage</label>
                {isEditing ? (
                  <select value={formData.leadStage || ''} onChange={e => handleChange('leadStage', e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm bg-white outline-none focus:border-slate-900">
                    {availableStages.map((s: string) => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700">{formData.leadStage || "-"}</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Follow-up Date</label>
              {isEditing ? (
                <input type="date" value={formData.followUpDate || ''} onChange={e => handleChange('followUpDate', e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm outline-none focus:border-slate-900" />
              ) : (
                <p className="text-sm font-medium text-slate-900 flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400"/> {formData.followUpDate || "-"}</p>
              )}
            </div>
          </div>

          {/* Dynamic Custom Fields */}
          {customFields.length > 0 && (
            <>
              <hr className="border-slate-100" />
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Additional Data</h3>
                {customFields.map((field: any) => (
                  <div key={field.id}>
                    <label className="block text-xs font-medium text-slate-500 mb-1">{field.label}</label>
                    {isEditing ? (
                      <input 
                        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'} 
                        value={formData[field.id] || ''} 
                        onChange={e => handleChange(field.id, e.target.value)} 
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm outline-none focus:border-slate-900" 
                      />
                    ) : (
                      <p className="text-sm font-medium text-slate-900">{formData[field.id] || "-"}</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        {isEditing && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
            <button onClick={handleDelete} className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Delete Lead
            </button>
            <div className="flex gap-2">
              <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-md transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={loading} className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 disabled:opacity-50 transition-colors">
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
