import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Download, FileSpreadsheet, Filter, Check } from "lucide-react";

export default function Export() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState("");

  useEffect(() => { init(); }, []);

  const init = async () => {
    const projs = await base44.entities.Project.filter({ status: "active" });
    setProjects(projs);
    if (projs.length > 0) setSelectedProject(projs[0].id);
  };

  const handleExport = async () => {
    if (!selectedProject) return;
    setExporting(true);
    setProgress("Fetching data...");

    const project = projects.find(p => p.id === selectedProject);

    try {
      setProgress("Loading Plan/Actual data...");
      const [plans, permits, manpower, observations, phIssues, dhIssues] = await Promise.all([
        base44.entities.DailyPlan.filter({ project_id: selectedProject }),
        base44.entities.WorkPermit.filter({ project_id: selectedProject }),
        base44.entities.ManpowerLog.filter({ project_id: selectedProject }),
        base44.entities.Observation.filter({ project_id: selectedProject }),
        base44.entities.HeadIssue.filter({ project_id: selectedProject, issue_type: "PH" }),
        base44.entities.HeadIssue.filter({ project_id: selectedProject, issue_type: "DH" })
      ]);

      const filterByDate = (arr) => arr.filter(r => {
        const d = r.date || r.created_date?.split("T")[0];
        return (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo);
      });

      setProgress("Building Excel workbook...");

      const wb = buildWorkbook(project, {
        plans: filterByDate(plans),
        permits: filterByDate(permits),
        manpower: filterByDate(manpower),
        observations: filterByDate(observations),
        phIssues: filterByDate(phIssues),
        dhIssues: filterByDate(dhIssues)
      }, { dateFrom, dateTo });

      setProgress("Generating file...");
      downloadCSVBundle(wb, project.code || project.name);
      setProgress("Done!");
      setTimeout(() => { setExporting(false); setProgress(""); }, 2000);
    } catch (e) {
      console.error(e);
      setExporting(false);
      setProgress("Export failed: " + e.message);
    }
  };

  const stats = [
    { label: "Plan/Actual Entries", icon: "📋" },
    { label: "Work Permits", icon: "🛡️" },
    { label: "Manpower Logs", icon: "👷" },
    { label: "Observations", icon: "🔍" },
    { label: "PH Issues", icon: "🔴" },
    { label: "DH Issues", icon: "🟠" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-4 pt-10 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Export Master Sheet</h1>
            <p className="text-xs text-gray-400">Download centralized Excel workbook</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Filters */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-white">Export Filters</span>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Project</label>
            <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white">
              {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">From Date</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">To Date</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white" />
            </div>
          </div>
        </div>

        {/* Workbook Info */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Workbook Contains</p>
          <div className="space-y-2">
            {["📋 README / Metadata", "📊 Daily_Plan_Actual", "🛡️ PTW_Master", "👷 Manpower", "🔍 Observations", "🔴 PH_Issues", "🟠 DH_Issues"].map(t => (
              <div key={t} className="flex items-center gap-2 text-sm text-gray-300">
                <Check className="w-3.5 h-3.5 text-green-400" />
                {t}
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-800">
            <p className="text-xs text-gray-500">Format: CSV bundle (Excel-compatible) · Flat tables, pivot-ready</p>
          </div>
        </div>

        {/* Export Button */}
        <button onClick={handleExport} disabled={exporting || !selectedProject}
          className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-2xl py-5 text-base font-bold transition-colors">
          {exporting ? (
            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {progress}</>
          ) : (
            <><Download className="w-5 h-5" /> Download Master Excel</>
          )}
        </button>

        {exporting && progress === "Done!" && (
          <div className="bg-green-900/30 border border-green-700/40 rounded-xl px-4 py-3 text-sm text-green-300 flex items-center gap-2">
            <Check className="w-4 h-4" /> Export completed successfully
          </div>
        )}

        <p className="text-xs text-center text-gray-600">v0.1 MVP · iPeMS Field Operations</p>
        <div className="pb-24" />
      </div>
    </div>
  );
}

function buildWorkbook(project, data, filters) {
  const now = new Date().toISOString();
  return {
    readme: [
      ["iPeMS Field Operations - Master Export"],
      ["Export Timestamp", now],
      ["Project", project.name],
      ["Project Code", project.code],
      ["Client", project.client || ""],
      ["Location", project.location || ""],
      ["Date From", filters.dateFrom],
      ["Date To", filters.dateTo],
      ["Version", "v0.1 MVP"],
    ],
    plan_actual: [
      ["Date", "Project", "WBS Code", "Task Name", "UOM", "Planned Qty", "Actual Qty", "Deviation", "Deviation Reason", "Comments", "Entered By", "Record ID"],
      ...data.plans.map(r => [r.date, project.name, r.wbs_code, r.task_name, r.uom, r.planned_qty, r.actual_qty, r.deviation, r.deviation_reason || "", r.comments || "", r.created_by, r.id])
    ],
    ptw_master: [
      ["Permit ID", "Date", "Start Time", "End Time", "Project", "Site/Area", "Hazard Category", "Order Number", "Contractor", "Supervisor", "Technician", "Checklist Result", "Authorized", "Signed By", "Signature Timestamp", "Status", "Close Timestamp", "Record ID"],
      ...data.permits.map(r => [r.permit_id || r.id, r.date, r.start_time, r.end_time, project.name, r.site_area, r.hazard_category, r.order_number, r.contractor_name, r.supervisor_name, r.technician_name, r.checklist_result, r.status === "Authorized" || r.status === "Active" || r.status === "Closed" ? "Y" : "N", r.signed_by_name, r.signature_timestamp, r.status, r.close_timestamp, r.id])
    ],
    manpower: [
      ["Date", "Project", "Contractor", "Headcount Present", "Planned Headcount", "Notes", "Entered By", "Record ID"],
      ...data.manpower.map(r => [r.date, project.name, r.contractor_name, r.headcount_present, r.planned_headcount || "", r.notes || "", r.created_by, r.id])
    ],
    observations: [
      ["Date", "Project", "Category", "Subcategory", "Severity", "Observation", "Action Owner", "Due Date", "Status", "Entered By", "Record ID"],
      ...data.observations.map(r => [r.date, project.name, r.category, r.subcategory || "", r.severity, r.observation_text, r.action_owner || "", r.due_date || "", r.status, r.created_by, r.id])
    ],
    ph_issues: [
      ["Date", "Project", "Title", "Description", "Impact", "Urgency", "Owner", "Status", "Created By", "Record ID"],
      ...data.phIssues.map(r => [r.date, project.name, r.title, r.description, r.impact, r.urgency, r.owner || "", r.status, r.created_by, r.id])
    ],
    dh_issues: [
      ["Date", "Project", "Title", "Description", "Impact", "Urgency", "Owner", "Status", "Created By", "Record ID"],
      ...data.dhIssues.map(r => [r.date, project.name, r.title, r.description, r.impact, r.urgency, r.owner || "", r.status, r.created_by, r.id])
    ]
  };
}

function toCSV(rows) {
  return rows.map(row => row.map(cell => {
    const s = String(cell === null || cell === undefined ? "" : cell);
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(",")).join("\n");
}

function downloadCSVBundle(wb, projectCode) {
  const sheets = {
    "README": wb.readme,
    "Daily_Plan_Actual": wb.plan_actual,
    "PTW_Master": wb.ptw_master,
    "Manpower": wb.manpower,
    "Observations": wb.observations,
    "PH_Issues": wb.ph_issues,
    "DH_Issues": wb.dh_issues,
  };

  // Create a zip-like approach: download individual CSVs merged into one ZIP using data URI
  // Since we can't use xlsx natively, create a combined HTML file that Excel can open
  const htmlParts = ['<html><head><meta charset="UTF-8"></head><body>'];
  
  Object.entries(sheets).forEach(([name, rows]) => {
    htmlParts.push(`<h2>${name}</h2>`);
    htmlParts.push('<table border="1">');
    rows.forEach((row, i) => {
      htmlParts.push(`<tr>${row.map(cell => `<${i === 0 ? "th" : "td"}>${String(cell === null || cell === undefined ? "" : cell).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</${i === 0 ? "th" : "td"}>`).join("")}</tr>`);
    });
    htmlParts.push("</table><br/>");
  });
  htmlParts.push("</body></html>");

  const blob = new Blob([htmlParts.join("")], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `iPeMS_Master_${projectCode}_${new Date().toISOString().split("T")[0]}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}