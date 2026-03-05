import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useLocation } from "react-router-dom";
import { Plus, Users, AlertTriangle, X, ChevronDown, ChevronUp, Check, AlertCircle } from "lucide-react";

const CATEGORIES = ["Safety", "Quality", "Productivity", "Compliance"];
const SEVERITIES = ["Low", "Medium", "High", "Critical"];
const IMPACTS = ["Cost", "Schedule", "Safety", "Quality"];
const URGENCIES = ["Normal", "High", "Immediate"];

export default function DPR() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initTab = params.get("tab") || "manpower";

  const [tab, setTab] = useState(initTab);
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [manpower, setManpower] = useState([]);
  const [observations, setObservations] = useState([]);
  const [phIssues, setPhIssues] = useState([]);
  const [dhIssues, setDhIssues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  // Forms
  const [mpForm, setMpForm] = useState({ contractor_name: "", headcount_present: "", planned_headcount: "", notes: "" });
  const [obsForm, setObsForm] = useState({ category: "Safety", subcategory: "", observation_text: "", severity: "Low", action_owner: "", due_date: "", status: "Open" });
  const [issueForm, setIssueForm] = useState({ title: "", description: "", impact: "Safety", urgency: "Normal", owner: "", status: "Open" });

  useEffect(() => { init(); }, []);
  useEffect(() => { if (selectedProject) loadData(); }, [selectedProject, date, tab]);

  const init = async () => {
    const u = await base44.auth.me();
    setUser(u);
    const [projs, contrs, cats] = await Promise.all([
      base44.entities.Project.filter({ status: "active" }),
      base44.entities.Contractor.filter({ is_active: true }),
      base44.entities.ObservationCategory.filter({ is_active: true })
    ]);
    setProjects(projs);
    setContractors(contrs);
    setCategories(cats);
    if (projs.length > 0) setSelectedProject(projs[0].id);
    setLoading(false);
  };

  const loadData = async () => {
    const [mp, obs, ph, dh] = await Promise.all([
      base44.entities.ManpowerLog.filter({ project_id: selectedProject, date }),
      base44.entities.Observation.filter({ project_id: selectedProject, date }),
      base44.entities.HeadIssue.filter({ project_id: selectedProject, date, issue_type: "PH" }),
      base44.entities.HeadIssue.filter({ project_id: selectedProject, date, issue_type: "DH" })
    ]);
    setManpower(mp);
    setObservations(obs);
    setPhIssues(ph);
    setDhIssues(dh);
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddManpower = async () => {
    if (!mpForm.contractor_name || !mpForm.headcount_present) return showToast("Contractor and headcount required", "error");
    await base44.entities.ManpowerLog.create({ project_id: selectedProject, date, ...mpForm, headcount_present: parseInt(mpForm.headcount_present), planned_headcount: mpForm.planned_headcount ? parseInt(mpForm.planned_headcount) : undefined });
    setMpForm({ contractor_name: "", headcount_present: "", planned_headcount: "", notes: "" });
    setShowForm(false);
    showToast("Manpower logged");
    loadData();
  };

  const handleAddObs = async () => {
    if (!obsForm.observation_text) return showToast("Observation text required", "error");
    await base44.entities.Observation.create({ project_id: selectedProject, date, ...obsForm });
    setObsForm({ category: "Safety", subcategory: "", observation_text: "", severity: "Low", action_owner: "", due_date: "", status: "Open" });
    setShowForm(false);
    showToast("Observation logged");
    loadData();
  };

  const handleAddIssue = async (type) => {
    if (!issueForm.title || !issueForm.description) return showToast("Title and description required", "error");
    await base44.entities.HeadIssue.create({ project_id: selectedProject, date, issue_type: type, ...issueForm });
    setIssueForm({ title: "", description: "", impact: "Safety", urgency: "Normal", owner: "", status: "Open" });
    setShowForm(false);
    showToast("Issue raised");
    loadData();
  };

  const updateObsStatus = async (id, status) => {
    await base44.entities.Observation.update(id, { status });
    loadData();
  };

  const updateIssueStatus = async (id, status) => {
    await base44.entities.HeadIssue.update(id, { status });
    loadData();
  };

  const subcats = categories.filter(c => c.category === obsForm.category).map(c => c.subcategory);
  const contractorNames = contractors.map(c => c.name);

  const tabs = [
    { id: "manpower", label: "Manpower", icon: "👷" },
    { id: "obs", label: "Observations", icon: "🔍" },
    { id: "ph", label: "PH Issues", icon: "🔴" },
    { id: "dh", label: "DH Issues", icon: "🟠" },
    { id: "summary", label: "Summary", icon: "📋" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {toast && (
        <div className={`fixed top-4 left-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {toast.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="bg-gray-900 border-b border-gray-800 px-4 pt-10 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-white">DPR</h1>
            <p className="text-xs text-gray-400">Site Intelligence</p>
          </div>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white" />
        </div>
        <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white mb-3">
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div className="flex gap-1 overflow-x-auto pb-0.5">
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setShowForm(false); }}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t.id ? "border-blue-500 text-blue-400" : "border-transparent text-gray-500"}`}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {/* MANPOWER TAB */}
        {tab === "manpower" && (
          <div className="space-y-3">
            <button onClick={() => setShowForm(!showForm)}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 rounded-xl py-3 text-sm font-semibold">
              <Plus className="w-4 h-4" /> Log Manpower
            </button>
            {showForm && (
              <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 space-y-3">
                <input list="contractor-list" value={mpForm.contractor_name} onChange={e => setMpForm(f => ({ ...f, contractor_name: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white" placeholder="Contractor / Vendor *" />
                <datalist id="contractor-list">{contractorNames.map(c => <option key={c} value={c} />)}</datalist>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Present *</label>
                    <input type="number" min="0" value={mpForm.headcount_present} onChange={e => setMpForm(f => ({ ...f, headcount_present: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white" placeholder="0" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Planned</label>
                    <input type="number" min="0" value={mpForm.planned_headcount} onChange={e => setMpForm(f => ({ ...f, planned_headcount: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white" placeholder="0" />
                  </div>
                </div>
                <textarea value={mpForm.notes} onChange={e => setMpForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white resize-none" rows={2} placeholder="Notes..." />
                <div className="flex gap-2">
                  <button onClick={handleAddManpower} className="flex-1 bg-green-600 rounded-xl py-3 text-sm font-semibold">Add</button>
                  <button onClick={() => setShowForm(false)} className="bg-gray-700 rounded-xl px-4 py-3 text-sm">Cancel</button>
                </div>
              </div>
            )}
            {manpower.map(m => (
              <div key={m.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{m.contractor_name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-green-400">{m.headcount_present}</span>
                    {m.planned_headcount && <span className="text-sm text-gray-500">/ {m.planned_headcount}</span>}
                  </div>
                </div>
                {m.notes && <p className="text-xs text-gray-500 mt-1">{m.notes}</p>}
              </div>
            ))}
            {manpower.length === 0 && !showForm && (
              <div className="text-center text-gray-600 py-8 text-sm">No manpower logged today</div>
            )}
          </div>
        )}

        {/* OBSERVATIONS TAB */}
        {tab === "obs" && (
          <div className="space-y-3">
            <button onClick={() => setShowForm(!showForm)}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 rounded-xl py-3 text-sm font-semibold">
              <Plus className="w-4 h-4" /> Add Observation
            </button>
            {showForm && (
              <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => setObsForm(f => ({ ...f, category: c }))}
                      className={`py-2.5 rounded-xl text-xs font-medium ${obsForm.category === c ? "bg-red-600 text-white" : "bg-gray-800 text-gray-400"}`}>
                      {c}
                    </button>
                  ))}
                </div>
                {subcats.length > 0 && (
                  <select value={obsForm.subcategory} onChange={e => setObsForm(f => ({ ...f, subcategory: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white">
                    <option value="">Subcategory (optional)</option>
                    {subcats.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
                <textarea value={obsForm.observation_text} onChange={e => setObsForm(f => ({ ...f, observation_text: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white resize-none" rows={3} placeholder="Describe observation *" />
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Severity</label>
                  <div className="grid grid-cols-4 gap-1">
                    {SEVERITIES.map(s => (
                      <button key={s} onClick={() => setObsForm(f => ({ ...f, severity: s }))}
                        className={`py-2 rounded-xl text-xs font-medium ${obsForm.severity === s ? severityColor(s) : "bg-gray-800 text-gray-400"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <input value={obsForm.action_owner} onChange={e => setObsForm(f => ({ ...f, action_owner: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white" placeholder="Action Owner" />
                <input type="date" value={obsForm.due_date} onChange={e => setObsForm(f => ({ ...f, due_date: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white" />
                <div className="flex gap-2">
                  <button onClick={handleAddObs} className="flex-1 bg-red-600 rounded-xl py-3 text-sm font-semibold">Add</button>
                  <button onClick={() => setShowForm(false)} className="bg-gray-700 rounded-xl px-4 py-3 text-sm">Cancel</button>
                </div>
              </div>
            )}
            {observations.map(o => (
              <ObsCard key={o.id} obs={o} onUpdateStatus={updateObsStatus} />
            ))}
            {observations.length === 0 && !showForm && (
              <div className="text-center text-gray-600 py-8 text-sm">No observations today</div>
            )}
          </div>
        )}

        {/* PH ISSUES */}
        {tab === "ph" && (
          <IssueTab issues={phIssues} type="PH" showForm={showForm} setShowForm={setShowForm}
            form={issueForm} setForm={setIssueForm} onAdd={() => handleAddIssue("PH")} onUpdateStatus={updateIssueStatus}
            color="purple" label="PH Issue" />
        )}

        {/* DH ISSUES */}
        {tab === "dh" && (
          <IssueTab issues={dhIssues} type="DH" showForm={showForm} setShowForm={setShowForm}
            form={issueForm} setForm={setIssueForm} onAdd={() => handleAddIssue("DH")} onUpdateStatus={updateIssueStatus}
            color="orange" label="DH Issue" />
        )}

        {/* SUMMARY TAB */}
        {tab === "summary" && (
          <div className="space-y-4">
            <SummarySection title="Manpower" count={manpower.length} color="green">
              {manpower.map(m => <p key={m.id} className="text-sm text-white">{m.contractor_name}: <span className="text-green-400 font-bold">{m.headcount_present}</span> present</p>)}
            </SummarySection>
            <SummarySection title="Observations" count={observations.length} color="red">
              {observations.map(o => (
                <div key={o.id} className="flex items-center gap-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${severityColor(o.severity)}`}>{o.severity}</span>
                  <p className="text-sm text-white truncate">{o.observation_text}</p>
                </div>
              ))}
            </SummarySection>
            <SummarySection title="PH Issues" count={phIssues.length} color="purple">
              {phIssues.map(i => <p key={i.id} className="text-sm text-white">{i.title} — <span className="text-gray-400">{i.status}</span></p>)}
            </SummarySection>
            <SummarySection title="DH Issues" count={dhIssues.length} color="orange">
              {dhIssues.map(i => <p key={i.id} className="text-sm text-white">{i.title} — <span className="text-gray-400">{i.status}</span></p>)}
            </SummarySection>
          </div>
        )}

        <div className="pb-24" />
      </div>
    </div>
  );
}

function severityColor(s) {
  return { Low: "bg-green-700 text-green-200", Medium: "bg-yellow-700 text-yellow-200", High: "bg-orange-700 text-orange-200", Critical: "bg-red-700 text-red-200" }[s] || "bg-gray-700";
}

function ObsCard({ obs, onUpdateStatus }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
      <div className="flex items-start gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${severityColor(obs.severity)}`}>{obs.severity}</span>
        <span className="text-xs text-gray-500">{obs.category}</span>
        {obs.subcategory && <span className="text-xs text-gray-600">· {obs.subcategory}</span>}
      </div>
      <p className="text-sm text-white mt-2">{obs.observation_text}</p>
      {obs.action_owner && <p className="text-xs text-gray-500 mt-1">Owner: {obs.action_owner}</p>}
      <div className="flex items-center gap-2 mt-3">
        {["Open", "In Progress", "Closed"].map(s => (
          <button key={s} onClick={() => onUpdateStatus(obs.id, s)}
            className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${obs.status === s ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400"}`}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function IssueTab({ issues, type, showForm, setShowForm, form, setForm, onAdd, onUpdateStatus, color, label }) {
  const colorMap = {
    purple: { bg: "bg-purple-600", light: "bg-purple-900/20 border-purple-700/40", text: "text-purple-300" },
    orange: { bg: "bg-orange-600", light: "bg-orange-900/20 border-orange-700/40", text: "text-orange-300" }
  };
  const c = colorMap[color];
  return (
    <div className="space-y-3">
      <button onClick={() => setShowForm(!showForm)} className={`w-full flex items-center justify-center gap-2 ${c.bg} hover:opacity-90 rounded-xl py-3 text-sm font-semibold`}>
        <Plus className="w-4 h-4" /> Raise {label}
      </button>
      {showForm && (
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 space-y-3">
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white" placeholder="Issue Title *" />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white resize-none" rows={3} placeholder="Description *" />
          <div className="grid grid-cols-2 gap-2">
            <select value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white">
              {IMPACTS.map(i => <option key={i}>{i}</option>)}
            </select>
            <select value={form.urgency} onChange={e => setForm(f => ({ ...f, urgency: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white">
              {URGENCIES.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <input value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white" placeholder="Owner (optional)" />
          <div className="flex gap-2">
            <button onClick={onAdd} className={`flex-1 ${c.bg} rounded-xl py-3 text-sm font-semibold`}>Submit</button>
            <button onClick={() => setShowForm(false)} className="bg-gray-700 rounded-xl px-4 py-3 text-sm">Cancel</button>
          </div>
        </div>
      )}
      {issues.map(issue => (
        <div key={issue.id} className={`border rounded-2xl p-4 ${c.light}`}>
          <div className="flex items-start justify-between">
            <p className="text-sm font-semibold text-white">{issue.title}</p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-lg ${issue.urgency === "Immediate" ? "bg-red-600 text-white" : issue.urgency === "High" ? "bg-amber-700 text-amber-200" : "bg-gray-700 text-gray-300"}`}>
              {issue.urgency}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">{issue.description}</p>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-gray-500">Impact: {issue.impact}</span>
            <div className="flex gap-1 ml-auto">
              {["Open", "Acknowledged", "Resolved"].map(s => (
                <button key={s} onClick={() => onUpdateStatus(issue.id, s)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium ${issue.status === s ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400"}`}>
                  {s === "Acknowledged" ? "Ack." : s}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}
      {issues.length === 0 && !showForm && (
        <div className="text-center text-gray-600 py-8 text-sm">No {type} issues today</div>
      )}
    </div>
  );
}

function SummarySection({ title, count, color, children }) {
  const colors = { green: "text-green-400", red: "text-red-400", purple: "text-purple-400", orange: "text-orange-400" };
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <span className={`text-sm font-bold ${colors[color]}`}>{count}</span>
      </div>
      <div className="space-y-2">{count === 0 ? <p className="text-xs text-gray-600">None logged today</p> : children}</div>
    </div>
  );
}