import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, ChevronLeft, ChevronRight, Calendar, Copy, Trash2, Save, AlertCircle, Check } from "lucide-react";

export default function PlanActual() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [plans, setPlans] = useState([]);
  const [wbsItems, setWbsItems] = useState([]);
  const [deviationReasons, setDeviationReasons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddLine, setShowAddLine] = useState(false);
  const [newLine, setNewLine] = useState({ wbs_id: "", wbs_code: "", task_name: "", uom: "", planned_qty: "", actual_qty: "", deviation_reason: "", deviation_reason_text: "", comments: "" });
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { init(); }, []);
  useEffect(() => { if (selectedProject) loadPlans(); }, [selectedProject, date]);

  const init = async () => {
    const u = await base44.auth.me();
    setUser(u);
    const [projs, reasons] = await Promise.all([
      base44.entities.Project.filter({ status: "active" }),
      base44.entities.DeviationReason.filter({ is_active: true })
    ]);
    setProjects(projs);
    setDeviationReasons(reasons);
    if (projs.length > 0) {
      setSelectedProject(projs[0].id);
      const wbs = await base44.entities.WBSItem.filter({ project_id: projs[0].id, is_active: true });
      setWbsItems(wbs);
    }
  };

  const loadPlans = async () => {
    setLoading(true);
    const data = await base44.entities.DailyPlan.filter({ project_id: selectedProject, date });
    setPlans(data);
    setLoading(false);
  };

  const handleProjectChange = async (pid) => {
    setSelectedProject(pid);
    const wbs = await base44.entities.WBSItem.filter({ project_id: pid, is_active: true });
    setWbsItems(wbs);
  };

  const handleWBSSelect = (wbsId) => {
    const item = wbsItems.find(w => w.id === wbsId);
    if (item) setNewLine(prev => ({ ...prev, wbs_id: item.id, wbs_code: item.wbs_code, task_name: item.task_name, uom: item.uom }));
  };

  const calcDeviation = (planned, actual) => {
    const p = parseFloat(planned) || 0;
    const a = parseFloat(actual) || 0;
    return a - p;
  };

  const handleAddLine = async () => {
    if (!newLine.wbs_code || !newLine.task_name) return showToast("WBS code and task name required", "error");
    const deviation = calcDeviation(newLine.planned_qty, newLine.actual_qty);
    if (deviation !== 0 && !newLine.deviation_reason) return showToast("Deviation reason required", "error");
    if (newLine.deviation_reason === "Other (requires text)" && !newLine.deviation_reason_text) return showToast("Please describe the reason", "error");
    setSaving(true);
    await base44.entities.DailyPlan.create({
      project_id: selectedProject, date,
      wbs_id: newLine.wbs_id, wbs_code: newLine.wbs_code, task_name: newLine.task_name, uom: newLine.uom,
      planned_qty: parseFloat(newLine.planned_qty) || 0,
      actual_qty: parseFloat(newLine.actual_qty) || 0,
      deviation,
      deviation_reason: newLine.deviation_reason,
      deviation_reason_text: newLine.deviation_reason_text,
      comments: newLine.comments,
      status: "draft"
    });
    setNewLine({ wbs_id: "", wbs_code: "", task_name: "", uom: "", planned_qty: "", actual_qty: "", deviation_reason: "", deviation_reason_text: "", comments: "" });
    setShowAddLine(false);
    setSaving(false);
    showToast("Line added", "success");
    loadPlans();
  };

  const handleUpdateLine = async (plan) => {
    const deviation = calcDeviation(plan.planned_qty, plan.actual_qty);
    if (deviation !== 0 && !plan.deviation_reason) return showToast("Deviation reason required", "error");
    setSaving(true);
    await base44.entities.DailyPlan.update(plan.id, { ...plan, deviation });
    setSaving(false);
    showToast("Saved", "success");
    setEditingId(null);
    loadPlans();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this line?")) return;
    await base44.entities.DailyPlan.delete(id);
    loadPlans();
  };

  const copyFromYesterday = async () => {
    const prev = new Date(date);
    prev.setDate(prev.getDate() - 1);
    const prevDate = prev.toISOString().split("T")[0];
    const yesterday = await base44.entities.DailyPlan.filter({ project_id: selectedProject, date: prevDate });
    if (yesterday.length === 0) return showToast("No data from yesterday", "error");
    for (const p of yesterday) {
      await base44.entities.DailyPlan.create({
        project_id: selectedProject, date,
        wbs_id: p.wbs_id, wbs_code: p.wbs_code, task_name: p.task_name, uom: p.uom,
        planned_qty: p.planned_qty, actual_qty: 0, deviation: 0, deviation_reason: "", comments: "", status: "draft"
      });
    }
    showToast(`Copied ${yesterday.length} lines from yesterday`, "success");
    loadPlans();
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const totalPlanned = plans.reduce((s, p) => s + (p.planned_qty || 0), 0);
  const totalActual = plans.reduce((s, p) => s + (p.actual_qty || 0), 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {toast && (
        <div className={`fixed top-4 left-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {toast.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 pt-10 pb-4">
        <h1 className="text-lg font-bold text-white">Plan vs Actual</h1>
        <p className="text-xs text-gray-400 mt-0.5">WBS-mapped daily targets</p>

        {/* Project selector */}
        <select value={selectedProject} onChange={e => handleProjectChange(e.target.value)}
          className="mt-3 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white">
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        {/* Date picker */}
        <div className="flex items-center gap-2 mt-2">
          <button onClick={() => { const d = new Date(date); d.setDate(d.getDate() - 1); setDate(d.toISOString().split("T")[0]); }}
            className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white text-center" />
          <button onClick={() => { const d = new Date(date); d.setDate(d.getDate() + 1); setDate(d.toISOString().split("T")[0]); }}
            className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Summary Bar */}
        {plans.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-blue-900/30 border border-blue-800/40 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-white">{totalPlanned.toFixed(1)}</p>
              <p className="text-xs text-blue-300">Planned</p>
            </div>
            <div className="bg-green-900/30 border border-green-800/40 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-white">{totalActual.toFixed(1)}</p>
              <p className="text-xs text-green-300">Actual</p>
            </div>
            <div className={`border rounded-xl p-3 text-center ${(totalActual - totalPlanned) >= 0 ? "bg-green-900/20 border-green-800/40" : "bg-red-900/20 border-red-800/40"}`}>
              <p className="text-lg font-bold text-white">{(totalActual - totalPlanned).toFixed(1)}</p>
              <p className="text-xs text-gray-400">Deviation</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button onClick={() => setShowAddLine(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 rounded-xl py-3 text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" /> Add WBS Line
          </button>
          <button onClick={copyFromYesterday}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 rounded-xl px-4 py-3 text-sm font-medium transition-colors">
            <Copy className="w-4 h-4" /> Copy Yesterday
          </button>
        </div>

        {/* Add Line Form */}
        {showAddLine && (
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-white">New WBS Line</h3>
            <select value={newLine.wbs_id} onChange={e => handleWBSSelect(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white">
              <option value="">Select WBS Task...</option>
              {wbsItems.map(w => <option key={w.id} value={w.id}>{w.wbs_code} — {w.task_name}</option>)}
            </select>
            {newLine.wbs_code && (
              <div className="text-xs text-gray-400 px-1">UOM: <span className="text-white">{newLine.uom}</span></div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Planned Qty</label>
                <input type="number" min="0" value={newLine.planned_qty} onChange={e => setNewLine(p => ({ ...p, planned_qty: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Actual Qty</label>
                <input type="number" min="0" value={newLine.actual_qty} onChange={e => setNewLine(p => ({ ...p, actual_qty: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white" placeholder="0" />
              </div>
            </div>
            {calcDeviation(newLine.planned_qty, newLine.actual_qty) !== 0 && (
              <>
                <div className="text-xs text-amber-400 px-1">
                  Deviation: {calcDeviation(newLine.planned_qty, newLine.actual_qty).toFixed(2)} — reason required
                </div>
                <select value={newLine.deviation_reason} onChange={e => setNewLine(p => ({ ...p, deviation_reason: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white">
                  <option value="">Select Reason...</option>
                  {deviationReasons.map(r => <option key={r.id} value={r.reason}>{r.reason}</option>)}
                </select>
                {newLine.deviation_reason === "Other (requires text)" && (
                  <textarea value={newLine.deviation_reason_text} onChange={e => setNewLine(p => ({ ...p, deviation_reason_text: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white resize-none" rows={2} placeholder="Describe reason..." />
                )}
              </>
            )}
            <textarea value={newLine.comments} onChange={e => setNewLine(p => ({ ...p, comments: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white resize-none" rows={2} placeholder="Comments (optional)..." />
            <div className="flex gap-2">
              <button onClick={handleAddLine} disabled={saving}
                className="flex-1 bg-blue-600 rounded-xl py-3 text-sm font-semibold disabled:opacity-50">
                {saving ? "Saving..." : "Add Line"}
              </button>
              <button onClick={() => setShowAddLine(false)} className="bg-gray-700 rounded-xl px-4 py-3 text-sm">Cancel</button>
            </div>
          </div>
        )}

        {/* Plans List */}
        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading...</div>
        ) : plans.length === 0 ? (
          <div className="text-center text-gray-600 py-12">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No entries for this date</p>
          </div>
        ) : (
          <div className="space-y-3">
            {plans.map(plan => (
              <PlanCard key={plan.id} plan={plan} editing={editingId === plan.id}
                deviationReasons={deviationReasons}
                onEdit={() => setEditingId(plan.id)}
                onSave={handleUpdateLine}
                onDelete={handleDelete}
                onCancel={() => setEditingId(null)} />
            ))}
          </div>
        )}
        <div className="pb-24" />
      </div>
    </div>
  );
}

function ClipboardList({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}

function PlanCard({ plan, editing, deviationReasons, onEdit, onSave, onDelete, onCancel }) {
  const [data, setData] = useState(plan);
  const deviation = (data.actual_qty || 0) - (data.planned_qty || 0);
  const deviationColor = deviation > 0 ? "text-green-400" : deviation < 0 ? "text-red-400" : "text-gray-400";

  if (editing) return (
    <div className="bg-gray-900 border border-blue-700 rounded-2xl p-4 space-y-3">
      <div className="text-xs text-blue-400 font-medium">{data.wbs_code} — {data.task_name}</div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Planned</label>
          <input type="number" min="0" value={data.planned_qty} onChange={e => setData(p => ({ ...p, planned_qty: parseFloat(e.target.value) || 0 }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white" />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Actual</label>
          <input type="number" min="0" value={data.actual_qty} onChange={e => setData(p => ({ ...p, actual_qty: parseFloat(e.target.value) || 0 }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white" />
        </div>
      </div>
      {((data.actual_qty || 0) - (data.planned_qty || 0)) !== 0 && (
        <select value={data.deviation_reason} onChange={e => setData(p => ({ ...p, deviation_reason: e.target.value }))}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white">
          <option value="">Select Reason...</option>
          {deviationReasons.map(r => <option key={r.id} value={r.reason}>{r.reason}</option>)}
        </select>
      )}
      <div className="flex gap-2">
        <button onClick={() => onSave(data)} className="flex-1 bg-blue-600 rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1">
          <Save className="w-3.5 h-3.5" /> Save
        </button>
        <button onClick={onCancel} className="bg-gray-700 rounded-xl px-4 py-2.5 text-sm">Cancel</button>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded-lg">{plan.wbs_code}</span>
            <span className="text-xs text-gray-500">{plan.uom}</span>
          </div>
          <p className="text-sm font-medium text-white">{plan.task_name}</p>
        </div>
        <div className="flex gap-2 ml-2">
          <button onClick={onEdit} className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
            <Save className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <button onClick={() => onDelete(plan.id)} className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="text-center">
          <p className="text-sm font-bold text-white">{plan.planned_qty || 0}</p>
          <p className="text-xs text-gray-500">Planned</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-white">{plan.actual_qty || 0}</p>
          <p className="text-xs text-gray-500">Actual</p>
        </div>
        <div className="text-center">
          <p className={`text-sm font-bold ${deviationColor}`}>{deviation > 0 ? "+" : ""}{deviation.toFixed(1)}</p>
          <p className="text-xs text-gray-500">Dev.</p>
        </div>
      </div>
      {plan.deviation_reason && (
        <div className="mt-2 text-xs text-amber-400 bg-amber-900/20 rounded-lg px-2 py-1">{plan.deviation_reason}</div>
      )}
      {plan.comments && <p className="mt-2 text-xs text-gray-500">{plan.comments}</p>}
    </div>
  );
}