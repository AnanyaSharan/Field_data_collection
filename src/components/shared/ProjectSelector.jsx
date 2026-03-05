import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronDown, Building2 } from "lucide-react";

export default function ProjectSelector({ selectedId, onSelect }) {
  const [projects, setProjects] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    base44.entities.Project.filter({ status: "active" }).then(setProjects).catch(() => {});
  }, []);

  const selected = projects.find(p => p.id === selectedId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm"
      >
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-blue-500" />
          <span className={selected ? "text-gray-900 font-medium" : "text-gray-400"}>
            {selected ? selected.name : "Select Project"}
          </span>
        </div>
        <ChevronDown size={16} className="text-gray-400" />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 overflow-hidden">
          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => { onSelect(p.id); setOpen(false); }}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center justify-between ${selectedId === p.id ? "text-blue-600 font-medium" : "text-gray-700"}`}
            >
              <span>{p.name}</span>
              <span className="text-xs text-gray-400">{p.code}</span>
            </button>
          ))}
          {projects.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-400">No active projects</p>
          )}
        </div>
      )}
    </div>
  );
}