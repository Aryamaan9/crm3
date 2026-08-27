"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { format, isBefore, isSameDay, startOfDay } from "date-fns";
import { Calendar } from "lucide-react";

export default function FollowUpsPage() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [overdue, setOverdue] = useState<any[]>([]);
  const [today, setToday] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);

  useEffect(() => {
    async function fetchFollowUps() {
      if (!user || !profile) return;
      try {
        let q: any = collection(db, "leads");
        if (profile.role === "junior") {
          q = query(q, where("primaryOwner", "==", user.uid));
        }
        
        const snapshot = await getDocs(q);
        const leads: any[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(lead => lead.followUpDate); // Must have a date

        const now = startOfDay(new Date());
        
        const _overdue: any[] = [];
        const _today: any[] = [];
        const _upcoming: any[] = [];

        leads.forEach(lead => {
          const date = lead.followUpDate.toDate();
          const targetDay = startOfDay(date);
          
          if (isSameDay(targetDay, now)) {
            _today.push(lead);
          } else if (isBefore(targetDay, now)) {
            _overdue.push(lead);
          } else {
            _upcoming.push(lead);
          }
        });

        setOverdue(_overdue.sort((a, b) => a.followUpDate.toMillis() - b.followUpDate.toMillis()));
        setToday(_today);
        setUpcoming(_upcoming.sort((a, b) => a.followUpDate.toMillis() - b.followUpDate.toMillis()));

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchFollowUps();
  }, [user, profile]);

  if (loading) return <div className="p-8 animate-pulse text-slate-500">Loading follow-ups...</div>;

  const renderSection = (title: string, count: number, items: any[], colorClass: string) => (
    <div className={`bg-white rounded-xl border ${colorClass} shadow-sm overflow-hidden`}>
      <div className="p-4 border-b border-slate-100 flex items-center gap-3">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-medium">{count}</span>
      </div>
      <div className="p-2">
        {items.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400">Nothing here.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map(lead => (
              <div key={lead.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                <div>
                  <p className="font-medium text-slate-900">{lead.firstName} {lead.lastName}</p>
                  <p className="text-xs text-slate-500 mt-1">{lead.organization}</p>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    <Calendar className="w-3 h-3 mr-1.5" />
                    {format(lead.followUpDate.toDate(), "MMM d, yyyy")}
                  </div>
                  <p className="text-xs text-blue-600 mt-1 cursor-pointer hover:underline">View Lead</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Follow-ups</h1>
        <p className="text-sm text-slate-500 mt-1">Auto-populated from the "Follow-up Date" field on your Leads.</p>
      </div>

      <div className="space-y-6">
        {renderSection("Overdue", overdue.length, overdue, "border-red-200")}
        {renderSection("Today", today.length, today, "border-slate-200")}
        {renderSection("Upcoming", upcoming.length, upcoming, "border-slate-200")}
      </div>
    </div>
  );
}

