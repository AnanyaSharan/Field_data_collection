import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

const NAV = [
  { id: "Home", label: "Home", icon: HomeIcon },
  { id: "PlanActual", label: "Plan", icon: PlanIcon },
  { id: "PTW", label: "PTW", icon: PTWIcon },
  { id: "DPR", label: "DPR", icon: DPRIcon },
  { id: "Export", label: "Export", icon: ExportIcon },
  { id: "Manual", label: "Manual", icon: ManualIcon },
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-gray-950 relative">
      <style>{`
        * { -webkit-tap-highlight-color: transparent; }
        body { background: #030712; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1) opacity(0.5); }
        input[type="time"]::-webkit-calendar-picker-indicator { filter: invert(1) opacity(0.5); }
      `}</style>

      <div className="pb-20">
        {children}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-800 safe-area-pb">
        <div className={`grid ${isAdmin ? "grid-cols-7" : "grid-cols-6"} px-2 py-1`}>
          {NAV.map(({ id, label, icon: Icon }) => {
            const active = currentPageName === id;
            return (
              <Link key={id} to={createPageUrl(id)}
                className={`flex flex-col items-center py-2 px-1 rounded-xl transition-colors ${active ? "text-blue-400" : "text-gray-500"}`}>
                <Icon active={active} />
                <span className={`text-[10px] font-medium mt-0.5 ${active ? "text-blue-400" : "text-gray-500"}`}>{label}</span>
              </Link>
            );
          })}
          {isAdmin && (
            <Link to={createPageUrl("Admin")}
              className={`flex flex-col items-center py-2 px-1 rounded-xl transition-colors ${currentPageName === "Admin" ? "text-blue-400" : "text-gray-500"}`}>
              <AdminIcon active={currentPageName === "Admin"} />
              <span className={`text-[10px] font-medium mt-0.5 ${currentPageName === "Admin" ? "text-blue-400" : "text-gray-500"}`}>Admin</span>
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}

function HomeIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12L12 3l9 9" /><path d="M9 21V12h6v9" /><path d="M5 10v11h14V10" />
    </svg>
  );
}
function PlanIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="3" y1="9" x2="21" y2="9" />
      {active && <circle cx="15" cy="15" r="1.5" fill="currentColor" />}
    </svg>
  );
}
function PTWIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill={active ? "currentColor" : "none"} fillOpacity="0.2" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
function DPRIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill={active ? "currentColor" : "none"} fillOpacity="0.15" />
      <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}
function ExportIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
function ManualIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" fill={active ? "currentColor" : "none"} fillOpacity="0.15" />
      <line x1="9" y1="7" x2="15" y2="7" /><line x1="9" y1="11" x2="15" y2="11" /><line x1="9" y1="15" x2="12" y2="15" />
    </svg>
  );
}
function AdminIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" fill={active ? "currentColor" : "none"} fillOpacity="0.3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}