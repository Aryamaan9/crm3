"use client";

import { useEffect, useState } from "react";
import { collection, query, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Plus, UsersRound } from "lucide-react";

export default function DistributorsPage() {
  const { user } = useAuth();
  const [distributors, setDistributors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const fetchDistributors = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, "distributors"));
      const snapshot = await getDocs(q);
      setDistributors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistributors();
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await addDoc(collection(db, "distributors"), {
        name,
        contactPerson: contact,
        email,
        notes,
        createdAt: Timestamp.now()
      });
      setShowAdd(false);
      setName(""); setContact(""); setEmail(""); setNotes("");
      fetchDistributors();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Distributors</h1>
          <p className="text-sm text-slate-500 mt-1">Manage placement agents, wealth managers, and platforms.</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800"
        >
          <Plus className="w-4 h-4" /> Add Distributor
        </button>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
          <h3 className="text-lg font-semibold mb-4">New Distributor</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company/Platform Name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Primary Contact Person</label>
              <input type="text" value={contact} onChange={e => setContact(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
            </div>
            <div className="col-span-2 flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm bg-slate-100 rounded-md">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md">Save</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex-1 overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
               <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
            ) : distributors.length === 0 ? (
               <tr>
                 <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                   <UsersRound className="mx-auto h-8 w-8 text-slate-300 mb-3" />
                   No distributors yet. Add one to start tracking referrals.
                 </td>
               </tr>
            ) : (
              distributors.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{d.name}</td>
                  <td className="px-6 py-4 text-slate-600">{d.contactPerson || "-"}</td>
                  <td className="px-6 py-4 text-slate-600">{d.email || "-"}</td>
                  <td className="px-6 py-4 text-slate-500 truncate max-w-xs">{d.notes || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
