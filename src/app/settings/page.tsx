"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, collection, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Plus, X, Save, Settings, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

type FieldType = 'text' | 'number' | 'date' | 'dropdown';

interface CustomField {
  id: string;
  label: string;
  type: FieldType;
}

interface GlobalSettings {
  leadStages: string[];
  investorTypes: string[];
  customFields?: CustomField[];
  emailConfig?: {
    apiKey: string;
    senderEmail: string;
  };
}

const TABS = ["Stages", "Investor Types", "Custom Fields", "Users", "Email & Integrations"];

export default function SettingsPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("Stages");
  
  const [settings, setSettings] = useState<GlobalSettings>({ 
    leadStages: [], investorTypes: [], customFields: [], emailConfig: { apiKey: "", senderEmail: "" }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Local inputs
  const [newStage, setNewStage] = useState("");
  const [newType, setNewType] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<FieldType>("text");

  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    async function fetchSettings() {
      try {
        const docRef = doc(db, "settings", "global");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as GlobalSettings;
          setSettings({
            leadStages: data.leadStages || [],
            investorTypes: data.investorTypes || [],
            customFields: data.customFields || [],
            emailConfig: data.emailConfig || { apiKey: "", senderEmail: "" }
          });
        }
      } catch (err) {
        toast.error("Failed to load settings.");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async (silent = false) => {
    if (!isAdmin) return;
    if (!silent) setSaving(true);
    try {
      await setDoc(doc(db, "settings", "global"), settings);
      if (!silent) toast.success("Settings saved successfully");
    } catch (err: any) {
      if (!silent) toast.error("Failed to save settings");
    } finally {
      if (!silent) setSaving(false);
    }
  };

  const addStage = () => {
    if (newStage.trim() && !settings.leadStages.includes(newStage.trim())) {
      setSettings(prev => ({ ...prev, leadStages: [...prev.leadStages, newStage.trim()] }));
      setNewStage("");
    }
  };

  const removeStage = (stage: string) => {
    setSettings(prev => ({ ...prev, leadStages: prev.leadStages.filter(s => s !== stage) }));
  };

  const addType = () => {
    if (newType.trim() && !settings.investorTypes.includes(newType.trim())) {
      setSettings(prev => ({ ...prev, investorTypes: [...prev.investorTypes, newType.trim()] }));
      setNewType("");
    }
  };

  const removeType = (type: string) => {
    setSettings(prev => ({ ...prev, investorTypes: prev.investorTypes.filter(t => t !== type) }));
  };

  const addCustomField = () => {
    if (!newFieldLabel.trim()) return;
    const id = newFieldLabel.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const exists = (settings.customFields || []).some(f => f.id === id);
    if (exists) {
      toast.error("A field with this name already exists");
      return;
    }
    
    setSettings(prev => ({
      ...prev,
      customFields: [...(prev.customFields || []), { id, label: newFieldLabel.trim(), type: newFieldType }]
    }));
    setNewFieldLabel("");
  };

  const removeCustomField = (id: string) => {
    setSettings(prev => ({
      ...prev,
      customFields: (prev.customFields || []).filter(f => f.id !== id)
    }));
  };

  if (loading) return <div className="p-8 animate-pulse text-slate-500">Loading settings...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
          <p className="text-slate-500 mt-1">Configure stages, investor types, custom fields, and team permissions.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 shadow-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="mb-6 p-4 bg-amber-50 text-amber-800 rounded-md text-sm border border-amber-200">
          <strong>Read-Only Mode:</strong> Only Administrators can modify system settings.
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="bg-slate-100 p-1.5 rounded-xl mb-6 inline-flex overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
              activeTab === tab 
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 overflow-hidden">
        
        {/* STAGES TAB */}
        {activeTab === "Stages" && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Pipeline Stages</h2>
            
            {isAdmin && (
              <div className="flex items-center gap-3 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <input 
                  type="text" 
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addStage()}
                  placeholder="New pipeline stage..." 
                  className="flex-1 max-w-sm px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-slate-400"
                />
                <button 
                  onClick={addStage}
                  className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-800"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            )}

            <div className="space-y-2 max-w-2xl">
              {settings.leadStages.map((stage) => (
                <div key={stage} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-slate-200 flex-shrink-0"></div>
                    <span className="font-medium text-slate-700">{stage}</span>
                  </div>
                  {isAdmin && (
                    <button onClick={() => removeStage(stage)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INVESTOR TYPES TAB */}
        {activeTab === "Investor Types" && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Investor Types</h2>
            
            {isAdmin && (
              <div className="flex items-center gap-3 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <input 
                  type="text" 
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addType()}
                  placeholder="New investor type..." 
                  className="flex-1 max-w-sm px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-slate-400"
                />
                <button 
                  onClick={addType}
                  className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-800"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            )}

            <div className="space-y-2 max-w-2xl">
              {settings.investorTypes.map((type) => (
                <div key={type} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-blue-100 flex-shrink-0"></div>
                    <span className="font-medium text-slate-700">{type}</span>
                  </div>
                  {isAdmin && (
                    <button onClick={() => removeType(type)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CUSTOM FIELDS TAB */}
        {activeTab === "Custom Fields" && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Dynamic Custom Fields</h2>
            
            {isAdmin && (
              <div className="flex items-center gap-3 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <input 
                  type="text" 
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  placeholder="Field Label (e.g., AUM, City)" 
                  className="flex-1 max-w-xs px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-slate-400"
                />
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as FieldType)}
                  className="px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-slate-400 bg-white"
                >
                  <option value="text">Text Input</option>
                  <option value="number">Number</option>
                  <option value="date">Date Picker</option>
                </select>
                <button 
                  onClick={addCustomField}
                  className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-800"
                >
                  <Plus className="w-4 h-4" /> Create Field
                </button>
              </div>
            )}

            <div className="space-y-2 max-w-3xl">
              {(!settings.customFields || settings.customFields.length === 0) ? (
                <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-lg">
                  No custom fields defined. Create one above to extend your Lead profiles.
                </div>
              ) : (
                settings.customFields.map((field) => (
                  <div key={field.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-4">
                      <span className="font-medium text-slate-700 w-48">{field.label}</span>
                      <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">id: {field.id}</span>
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded capitalize">{field.type}</span>
                    </div>
                    {isAdmin && (
                      <button onClick={() => removeCustomField(field.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === "Users" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Team Management</h2>
              <button 
                onClick={() => toast("Ask new users to register on the Login page. They will appear here.", { icon: 'ℹ️' })}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                How to add users?
              </button>
            </div>
            {isAdmin ? <TeamManager /> : <p className="text-slate-500 text-sm">Only admins can manage users.</p>}
          </div>
        )}

        {/* EMAIL CONFIG TAB */}
        {activeTab === "Email & Integrations" && (
          <div className="p-6 max-w-2xl">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Email Delivery Engine</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Brevo API Key (v3)</label>
                <input 
                  type="password" 
                  value={settings.emailConfig?.apiKey || ""}
                  onChange={(e) => setSettings(prev => ({ ...prev, emailConfig: { ...prev.emailConfig!, apiKey: e.target.value } }))}
                  placeholder="xkeysib-..." 
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                  disabled={!isAdmin}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Verified Sender Email</label>
                <input 
                  type="email" 
                  value={settings.emailConfig?.senderEmail || ""}
                  onChange={(e) => setSettings(prev => ({ ...prev, emailConfig: { ...prev.emailConfig!, senderEmail: e.target.value } }))}
                  placeholder="ir@yourfund.com" 
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                  disabled={!isAdmin}
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Sub-component for Team Management
function TeamManager() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const snap = await getDocs(collection(db, "users"));
        setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
      } catch (err) {
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const changeRole = async (uid: string, newRole: string) => {
    try {
      await updateDoc(doc(db, "users", uid), { role: newRole });
      setUsers(users.map(u => u.uid === uid ? { ...u, role: newRole } : u));
      toast.success("User role updated");
    } catch (err) {
      toast.error("Failed to update role");
    }
  };

  if (loading) return <div className="animate-pulse text-sm text-slate-500">Loading team...</div>;

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
          <tr>
            <th className="px-6 py-4">User Email</th>
            <th className="px-6 py-4">Security Role</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {users.map(u => (
            <tr key={u.uid} className="hover:bg-slate-50">
              <td className="px-6 py-4 text-slate-900 font-medium">{u.email}</td>
              <td className="px-6 py-4">
                <select 
                  value={u.role || "junior"} 
                  onChange={(e) => changeRole(u.uid, e.target.value)}
                  className="px-3 py-1.5 text-sm border border-slate-200 rounded-md bg-white focus:ring-slate-900 focus:border-slate-900 outline-none"
                >
                  <option value="admin">Administrator</option>
                  <option value="senior">Senior Partner</option>
                  <option value="junior">Junior Analyst</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
