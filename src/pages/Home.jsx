import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { 
  ClipboardList, ShieldCheck, FileText, Users, AlertTriangle, 
  TrendingUp, Plus, CheckCircle2, Clock, ChevronRight, Activity
} from "lucide-react";

export default function Home() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ ptws: 0, observations: 0, planCompletion: 0 });
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      const today = new Date().toISOString().split("T")[0];
      const [ptws, obs, plans, projects] = await Promise.all([
        base44.entities.WorkPermit.filter({ date: today }),
        base44.entities.Observation.filter({ date: today }),
        base44.entities.DailyPlan.filter({ date: today }),
        base44.entities.Project.filter({ status: "active" })
      ]);
      const proj = projects[0] || null;
      setProject(proj);
      const authorizedPTWs = ptws.filter(p => p.status === "Authorized" || p.status === "Active").length;
      const critObs = obs.filter(o => o.status === "Open" && (o.severity === "High" || o.severity === "Critical")).length;
      const totalPlanned = plans.reduce((s, p) => s + (p.planned_qty || 0), 0);
      const totalActual = plans.reduce((s, p) => s + (p.actual_qty || 0), 0);
      const completion = totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0;
      setStats({ ptws: authorizedPTWs, observations: critObs, planCompletion: completion });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const quickActions = [
    { label: "Add WBS Line", icon: ClipboardList, page: "PlanActual", color: "bg-blue-500", desc: "Log today's plan/actual" },
    { label: "Create PTW", icon: ShieldCheck, page: "PTW", color: "bg-amber-500", desc: "New work permit" },
    { label: "Add Observation", icon: AlertTriangle, page: "DPR", color: "bg-red-500", desc: "Log site observation" },
    { label: "Log Manpower", icon: Users, page: "DPR", color: "bg-green-500", desc: "Record headcount" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 pt-10 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-blue-400 uppercase tracking-widest">iPeMS Field Ops</p>
            <h1 className="text-xl font-bold text-white mt-0.5">Good {getGreeting()}, {user?.full_name?.split(" ")[0] || "Field"}</h1>
            <p className="text-xs text-gray-400 mt-0.5">{today}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            {user?.full_name?.[0] || "U"}
          </div>
        </div>
        {project && (
          <div className="mt-3 px-3 py-2 bg-gray-800 rounded-xl flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs text-gray-300 font-medium">{project.name}</span>
            <span className="ml-auto text-xs text-gray-500">{project.code}</span>
          </div>
        )}
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-3">
          <KPICard label="PTWs Active" value={stats.ptws} icon={<ShieldCheck className="w-4 h-4" />} color="blue" />
          <KPICard label="Crit. Obs." value={stats.observations} icon={<AlertTriangle className="w-4 h-4" />} color="red" />
          <KPICard label="Plan%" value={`${stats.planCompletion}%`} icon={<TrendingUp className="w-4 h-4" />} color="green" />
        </div>

        {/* Quick Actions */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Quick Actions</p>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(a => (
              <Link key={a.label} to={createPageUrl(a.page)} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-3 active:scale-95 transition-transform">
                <div className={`w-10 h-10 ${a.color} rounded-xl flex items-center justify-center`}>
                  <a.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{a.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{a.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* PH/DH Issue Buttons */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Escalations</p>
          <Link to={createPageUrl("DPR") + "?tab=ph"} className="flex items-center justify-between bg-purple-900/30 border border-purple-800/50 rounded-2xl px-4 py-3.5 active:scale-95 transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Raise PH Issue</p>
                <p className="text-xs text-purple-300">Project Head escalation</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </Link>
          <Link to={createPageUrl("DPR") + "?tab=dh"} className="flex items-center justify-between bg-orange-900/30 border border-orange-800/50 rounded-2xl px-4 py-3.5 active:scale-95 transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Raise DH Issue</p>
                <p className="text-xs text-orange-300">Delivery Head escalation</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </Link>
        </div>

        {/* Today's Summary Link */}
        <Link to={createPageUrl("DPR") + "?tab=summary"} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-2xl px-4 py-4 active:scale-95 transition-transform">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-gray-300" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Today's Summary</p>
              <p className="text-xs text-gray-500">Plan + PTW + DPR consolidated</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </Link>

        <div className="pb-24" />
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}

function KPICard({ label, value, icon, color }) {
  const colors = {
    blue: "bg-blue-900/30 border-blue-800/40 text-blue-400",
    red: "bg-red-900/30 border-red-800/40 text-red-400",
    green: "bg-green-900/30 border-green-800/40 text-green-400"
  };
  return (
    <div className={`${colors[color]} border rounded-2xl p-3 flex flex-col gap-1.5`}>
      <div className="opacity-70">{icon}</div>
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-400 leading-tight">{label}</p>
    </div>
  );
}