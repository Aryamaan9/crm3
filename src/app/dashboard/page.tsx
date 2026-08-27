"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { isBefore, isSameDay, startOfDay } from "date-fns";
import { Users, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import toast from "react-hot-toast";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b', '#14b8a6'];

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    total: 0,
    conversionRate: 0,
    dueToday: 0,
    overdue: 0
  });

  const [pipelineData, setPipelineData] = useState<any[]>([]);
  const [investorData, setInvestorData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user || !profile) return;

      try {
        let q: any = collection(db, "leads");
        if (profile.role === "junior") {
          q = query(q, where("primaryOwner", "==", user.uid));
        }

        const snapshot = await getDocs(q);
        const leads = snapshot.docs.map(doc => doc.data());

        const now = startOfDay(new Date());
        let dueToday = 0;
        let overdue = 0;
        let closedWon = 0;
        
        const pData: Record<string, number> = {};
        const iData: Record<string, number> = {};

        leads.forEach(lead => {
          // Calculate Follow-ups
          if (lead.followUpDate) {
            const date = lead.followUpDate.toDate();
            const targetDay = startOfDay(date);
            if (isSameDay(targetDay, now)) dueToday++;
            else if (isBefore(targetDay, now)) overdue++;
          }

          // Calculate Conversion
          if (lead.leadStage === "Closed Won") closedWon++;

          // Aggregate Pipeline
          const stage = lead.leadStage || "Unknown";
          pData[stage] = (pData[stage] || 0) + 1;

          // Aggregate Investors
          const type = lead.investorType || "Unknown";
          iData[type] = (iData[type] || 0) + 1;
        });

        const conversionRate = leads.length > 0 ? Math.round((closedWon / leads.length) * 100) : 0;

        setStats({ total: leads.length, conversionRate, dueToday, overdue });
        
        // Format for recharts
        setPipelineData(Object.entries(pData).map(([name, count]) => ({ name, count })));
        setInvestorData(Object.entries(iData).map(([name, count]) => ({ name, value: count })));

      } catch (err) {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user, profile]);

  if (loading) return <div className="p-8 text-slate-500 animate-pulse">Loading dashboard...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col h-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back. Here is what's happening with your pipeline.</p>
      </div>
      
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total Leads</p>
            <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
            <p className="text-sm text-slate-400 mt-1">Active in pipeline</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg"><Users className="w-5 h-5 text-blue-600" /></div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Conversion Rate</p>
            <p className="text-3xl font-bold text-slate-900">{stats.conversionRate}%</p>
            <p className="text-sm text-slate-400 mt-1">Closed Won vs Total</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg"><TrendingUp className="w-5 h-5 text-green-600" /></div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Due Today</p>
            <p className="text-3xl font-bold text-amber-500">{stats.dueToday}</p>
            <p className="text-sm text-slate-400 mt-1">Tasks scheduled for today</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg"><Calendar className="w-5 h-5 text-amber-500" /></div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Overdue Follow-ups</p>
            <p className="text-3xl font-bold text-red-500">{stats.overdue}</p>
            <p className="text-sm text-slate-400 mt-1">Requires immediate attention</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg"><AlertCircle className="w-5 h-5 text-red-500" /></div>
        </div>
      </div>

      {/* Bottom Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <h3 className="font-semibold text-slate-900 mb-4">Pipeline Distribution</h3>
          {pipelineData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-400">No data available</div>
          ) : (
            <div className="flex-1 w-full h-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}} 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <h3 className="font-semibold text-slate-900 mb-4">Investor Types</h3>
          {investorData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-400">No data available</div>
          ) : (
            <div className="flex-1 w-full h-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={investorData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {investorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {investorData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                    {entry.name} ({entry.value})
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
