"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Plus, X, Save, Settings, Trash2, Layers, Briefcase, Database, Users, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
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

const TABS = [
  { id: "Stages", icon: Layers, label: "Pipeline Stages", description: "Manage the stages of your deal flow." },
  { id: "Investor Types", icon: Briefcase, label: "Investor Types", description: "Categorize your investors." },
  { id: "Custom Fields", icon: Database, label: "Custom Fields", description: "Add dynamic data fields to leads." },
  { id: "Users", icon: Users, label: "Team Management", description: "Manage user access and roles." },
  { id: "Email & Integrations", icon: Mail, label: "Email & Integrations", description: "Configure API keys and delivery." },
];

export default function SettingsPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("Stages");
  
  const [settings, setSettings] = useState<GlobalSettings>({ 
    leadStages: [], investorTypes: [], customFields: [], emailConfig: { apiKey: "", senderEmail: "" }
  });
  
  const [loading, setLoading] = useState(true);
  
  // Local inputs
  const [newStage, setNewStage] = useState("");
  const [newType, setNewType] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<FieldType>("text");
  
  // Local email config to prevent constant autosaves on every keystroke
  const [localEmailConfig, setLocalEmailConfig] = useState({ apiKey: "", senderEmail: "" });
  const [isEmailSaving, setIsEmailSaving] = useState(false);

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
          setLocalEmailConfig(data.emailConfig || { apiKey: "", senderEmail: "" });
        }
      } catch (err) {
        toast.error("Failed to load settings.");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  // Utility to handle auto-saving array mutations
  const autoSaveSettings = async (updatedSettings: GlobalSettings) => {
    setSettings(updatedSettings);
    if (!isAdmin) return;
    try {
      await setDoc(doc(db, "settings", "global"), updatedSettings);
    } catch (err: any) {
      toast.error("Failed to save changes automatically");
    }
  };

  const addStage = () => {
    if (!newStage.trim() || settings.leadStages.includes(newStage.trim())) return;
    const next = { ...settings, leadStages: [...settings.leadStages, newStage.trim()] };
    autoSaveSettings(next);
    setNewStage("");
    toast.success("Stage added");
  };

  const removeStage = (stage: string) => {
    const next = { ...settings, leadStages: settings.leadStages.filter(s => s !== stage) };
    autoSaveSettings(next);
    toast.success("Stage removed");
  };

  const addType = () => {
    if (!newType.trim() || settings.investorTypes.includes(newType.trim())) return;
    const next = { ...settings, investorTypes: [...settings.investorTypes, newType.trim()] };
    autoSaveSettings(next);
    setNewType("");
    toast.success("Investor type added");
  };

  const removeType = (type: string) => {
    const next = { ...settings, investorTypes: settings.investorTypes.filter(t => t !== type) };
    autoSaveSettings(next);
    toast.success("Investor type removed");
  };

  const addCustomField = () => {
    if (!newFieldLabel.trim()) return;
    const id = newFieldLabel.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const exists = (settings.customFields || []).some(f => f.id === id);
    if (exists) {
      toast.error("A field with this name already exists");
      return;
    }
    const next = {
      ...settings,
      customFields: [...(settings.customFields || []), { id, label: newFieldLabel.trim(), type: newFieldType }]
    };
    autoSaveSettings(next);
    setNewFieldLabel("");
    toast.success("Custom field added");
  };

  const removeCustomField = (id: string) => {
    const next = {
      ...settings,
      customFields: (settings.customFields || []).filter(f => f.id !== id)
    };
    autoSaveSettings(next);
    toast.success("Custom field removed");
  };

  const saveEmailConfig = async () => {
    if (!isAdmin) return;
    setIsEmailSaving(true);
    const next = { ...settings, emailConfig: localEmailConfig };
    try {
      await setDoc(doc(db, "settings", "global"), next);
      setSettings(next);
      toast.success("Email configuration saved");
    } catch (err: any) {
      toast.error("Failed to save email configuration");
    } finally {
      setIsEmailSaving(false);
    }
  };

  if (loading) return <div className="p-8 animate-pulse text-slate-500">Loading settings...</div>;

  const currentTabInfo = TABS.find(t => t.id === activeTab);

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-slate-500 mt-1">Configure and manage your CRM preferences.</p>
      </div>

      {!isAdmin && (
        <div className="mb-6 flex items-start gap-3 p-4 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Read-Only Mode</h4>
            <p className="text-sm mt-1">You are viewing settings as a non-administrator. You cannot make changes to global configurations.</p>
          </div>
        </div>
      )}

      {/* Main Settings Layout - Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm min-h-[600px]">
        
        {/* Sidebar */}
        <div className="w-64 bg-slate-50/50 border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Configuration</span>
          </div>
          <div className="p-3 flex-1 overflow-y-auto space-y-1">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? "bg-blue-50 text-blue-700" 
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-blue-700" : "text-slate-400"}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Content Header */}
          <div className="p-6 pb-0 mb-6">
            <h2 className="text-xl font-bold text-slate-900">{currentTabInfo?.label}</h2>
            <p className="text-sm text-slate-500 mt-1">{currentTabInfo?.description}</p>
          </div>

          <div className="px-6 pb-12">
            {/* STAGES TAB */}
            {activeTab === "Stages" && (
              <div className="max-w-2xl">
                {isAdmin && (
                  <div className="flex items-center gap-3 mb-6">
                    <input 
                      type="text" 
                      value={newStage}
                      onChange={(e) => setNewStage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addStage()}
                      placeholder="e.g., Qualified, Pitched, Closed" 
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                    />
                    <button 
                      onClick={addStage}
                      className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Add Stage
                    </button>
                  </div>
                )}

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  {settings.leadStages.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">No stages configured.</div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {settings.leadStages.map((stage) => (
                        <div key={stage} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                              <Layers className="w-4 h-4 text-slate-500" />
                            </div>
                            <span className="font-medium text-slate-700">{stage}</span>
                          </div>
                          {isAdmin && (
                            <button onClick={() => removeStage(stage)} className="text-slate-400 hover:text-red-500 p-2 rounded-md hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* INVESTOR TYPES TAB */}
            {activeTab === "Investor Types" && (
              <div className="max-w-2xl">
                {isAdmin && (
                  <div className="flex items-center gap-3 mb-6">
                    <input 
                      type="text" 
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addType()}
                      placeholder="e.g., Angel, VC, Family Office" 
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                    />
                    <button 
                      onClick={addType}
                      className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Add Type
                    </button>
                  </div>
                )}

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  {settings.investorTypes.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">No investor types configured.</div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {settings.investorTypes.map((type) => (
                        <div key={type} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                              <Briefcase className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="font-medium text-slate-700">{type}</span>
                          </div>
                          {isAdmin && (
                            <button onClick={() => removeType(type)} className="text-slate-400 hover:text-red-500 p-2 rounded-md hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CUSTOM FIELDS TAB */}
            {activeTab === "Custom Fields" && (
              <div className="max-w-3xl">
                {isAdmin && (
                  <div className="flex items-center gap-3 mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
                    <input 
                      type="text" 
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                      placeholder="Field Label (e.g., Ticket Size)" 
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    <div className="w-48 relative">
                      <select
                        value={newFieldType}
                        onChange={(e) => setNewFieldType(e.target.value as FieldType)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none bg-white"
                      >
                        <option value="text">Text Input</option>
                        <option value="number">Number</option>
                        <option value="date">Date Picker</option>
                      </select>
                    </div>
                    <button 
                      onClick={addCustomField}
                      className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Create Field
                    </button>
                  </div>
                )}

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  {(!settings.customFields || settings.customFields.length === 0) ? (
                    <div className="p-12 text-center flex flex-col items-center">
                      <Database className="w-12 h-12 text-slate-200 mb-3" />
                      <h3 className="text-sm font-medium text-slate-900">No Custom Fields</h3>
                      <p className="text-sm text-slate-500 mt-1 max-w-sm">Create fields to track data specific to your business process across all leads.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {settings.customFields.map((field) => (
                        <div key={field.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                          <div className="flex items-center gap-6">
                            <span className="font-medium text-slate-700 w-48">{field.label}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">ID: {field.id}</span>
                              <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 capitalize">{field.type}</span>
                            </div>
                          </div>
                          {isAdmin && (
                            <button onClick={() => removeCustomField(field.id)} className="text-slate-400 hover:text-red-500 p-2 rounded-md hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === "Users" && (
              <div className="max-w-4xl">
                <div className="mb-6 flex justify-between items-center bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100">
                  <div className="flex gap-3 items-center">
                    <Users className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="text-sm font-bold">Team Member Access</h4>
                      <p className="text-xs mt-0.5 opacity-90">To invite someone, have them sign up on your login page. You can approve their role here.</p>
                    </div>
                  </div>
                </div>
                {isAdmin ? <TeamManager /> : <p className="text-slate-500 text-sm p-8 text-center bg-slate-50 rounded-xl border border-slate-200">You do not have permission to view or manage users.</p>}
              </div>
            )}

            {/* EMAIL CONFIG TAB */}
            {activeTab === "Email & Integrations" && (
              <div className="max-w-2xl bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-1">Brevo API Key (v3)</label>
                    <p className="text-xs text-slate-500 mb-3">Required to send bulk campaigns directly from the Email tab.</p>
                    <input 
                      type="password" 
                      value={localEmailConfig.apiKey}
                      onChange={(e) => setLocalEmailConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder="xkeysib-..." 
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm transition-all"
                      disabled={!isAdmin}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-1">Verified Sender Email</label>
                    <p className="text-xs text-slate-500 mb-3">Must be a verified sender in your Brevo dashboard.</p>
                    <input 
                      type="email" 
                      value={localEmailConfig.senderEmail}
                      onChange={(e) => setLocalEmailConfig(prev => ({ ...prev, senderEmail: e.target.value }))}
                      placeholder="ir@yourfund.com" 
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm transition-all"
                      disabled={!isAdmin}
                    />
                  </div>
                </div>

                {isAdmin && (
                  <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                    <button 
                      onClick={saveEmailConfig}
                      disabled={isEmailSaving}
                      className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 shadow-sm"
                    >
                      {isEmailSaving ? "Saving..." : "Save Email Settings"}
                      {!isEmailSaving && <Save className="w-4 h-4 ml-1" />}
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
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

  const removeUser = async (uid: string) => {
    if (!confirm("Are you sure you want to remove this teammate? They will lose access to the CRM immediately.")) return;
    try {
      await deleteDoc(doc(db, "users", uid));
      setUsers(users.filter(u => u.uid !== uid));
      toast.success("Teammate removed successfully");
    } catch (err) {
      toast.error("Failed to remove teammate");
    }
  };

  if (loading) return (
    <div className="border border-slate-200 rounded-xl overflow-hidden p-8 flex justify-center">
      <div className="animate-pulse text-sm text-slate-500">Loading team directory...</div>
    </div>
  );

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
          <tr>
            <th className="px-6 py-4 w-1/2">User Identity</th>
            <th className="px-6 py-4">Security Role</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {users.map(u => (
            <tr key={u.uid} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                    {u.email.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-slate-900 font-medium">{u.email}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="relative w-64">
                  <select 
                    value={u.role || "junior"} 
                    onChange={(e) => changeRole(u.uid, e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm appearance-none cursor-pointer hover:border-slate-400"
                  >
                    <option value="admin">Administrator (Full Access)</option>
                    <option value="senior">Senior Partner (View All)</option>
                    <option value="junior">Junior Analyst (Assigned Only)</option>
                  </select>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <button 
                  onClick={() => removeUser(u.uid)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove Teammate"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
