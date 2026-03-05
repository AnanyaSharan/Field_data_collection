import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, ShieldCheck, Clock, CheckCircle2, XCircle, AlertTriangle, ChevronRight, Pen, X } from "lucide-react";

const STATUS_COLORS = {
  "Draft": "bg-gray-700 text-gray-300",
  "Submitted": "bg-blue-900/50 text-blue-300",
  "Assigned": "bg-purple-900/50 text-purple-300",
  "Checklist Completed": "bg-amber-900/50 text-amber-300",
  "Authorized": "bg-green-900/50 text-green-300",
  "Active": "bg-emerald-600 text-white",
  "Closed": "bg-gray-600 text-gray-200",
  "Cancelled": "bg-red-900/50 text-red-300",
};

const HAZARD_CATEGORIES = ["Hot Work", "Working at Height", "Confined Space", "Electrical", "Lifting", "Excavation", "General"];

export default function PTW() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("list"); // list | create | detail | sign
  const [permits, setPermits] = useState([]);
  const [selected, setSelected] = useState(null);
  const [projects, setProjects] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    project_id: "", site_area: "", date: new Date().toISOString().split("T")[0],
    start_time: "", end_time: "", hazard_category: "Hot Work", order_number: "",
    contractor_id: "", contractor_name: "", supervisor_name: "", technician_name: "",
    risk_notes: "", method_statement_ref: "", final_notes: ""
  });
  const [checklist, setChecklist] = useState([]);
  const [ppeList, setPpeList] = useState([]);
  const [signatureName, setSignatureName] = useState("");
  const [signatureEmpId, setSignatureEmpId] = useState("");
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSig, setHasSig] = useState(false);

  useEffect(() => { init(); }, []);

  const init = async () => {
    const u = await base44.auth.me();
    setUser(u);
    const [projs, contrs, tmpls, perms] = await Promise.all([
      base44.entities.Project.filter({ status: "active" }),
      base44.entities.Contractor.filter({ is_active: true }),
      base44.entities.PTWTemplate.filter({ is_active: true }),
      base44.entities.WorkPermit.list("-created_date", 50)
    ]);
    setProjects(projs);
    setContractors(contrs);
    setTemplates(tmpls);
    setPermits(perms);
    if (projs.length > 0) setForm(f => ({ ...f, project_id: projs[0].id }));
    setLoading(false);
  };

  const loadPermit = async (id) => {
    const p = await base44.entities.WorkPermit.filter({ id });
    if (p.length > 0) setSelected(p[0]);
  };

  const handleHazardChange = (cat) => {
    setForm(f => ({ ...f, hazard_category: cat }));
    const tmpl = templates.find(t => t.hazard_category === cat);
    if (tmpl) {
      setChecklist((tmpl.checklist_items || []).map(i => ({ ...i, checked: false, note: "" })));
      setPpeList((tmpl.ppe_items || []).map(i => ({ item: i, checked: false })));
    } else {
      setChecklist([]);
      setPpeList([]);
    }
  };

  const handleCreatePermit = async () => {
    if (!form.order_number) return alert("Order number required");
    if (!form.contractor_name && !form.contractor_id) return alert("Contractor required");
    const permitId = `PTW-${Date.now().toString().slice(-6)}`;
    const contractor = contractors.find(c => c.id === form.contractor_id);
    const created = await base44.entities.WorkPermit.create({
      ...form,
      permit_id: permitId,
      contractor_name: contractor?.name || form.contractor_name,
      supervisor_name: form.supervisor_name || user?.full_name,
      ppe_checklist: ppeList,
      safety_checklist: checklist,
      status: "Submitted",
      checklist_result: "Pending"
    });
    await base44.entities.PTWAuditLog.create({
      permit_id: created.id, from_status: "", to_status: "Submitted",
      changed_by: user?.email, changed_by_name: user?.full_name,
      timestamp: new Date().toISOString()
    });
    setView("list");
    init();
  };

  const updateStatus = async (permit, newStatus, reason = "") => {
    const old = permit.status;
    const updates = { status: newStatus };
    if (newStatus === "Closed") updates.close_timestamp = new Date().toISOString();
    await base44.entities.WorkPermit.update(permit.id, updates);
    await base44.entities.PTWAuditLog.create({
      permit_id: permit.id, from_status: old, to_status: newStatus,
      changed_by: user?.email, changed_by_name: user?.full_name,
      reason, timestamp: new Date().toISOString()
    });
    const updated = { ...permit, ...updates };
    setSelected(updated);
    setPermits(prev => prev.map(p => p.id === permit.id ? updated : p));
  };

  // Signature canvas
  const startDraw = (e) => {
    setDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches?.[0]?.clientX || e.clientX) - rect.left;
    const y = (e.touches?.[0]?.clientY || e.clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const draw = (e) => {
    if (!drawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches?.[0]?.clientX || e.clientX) - rect.left;
    const y = (e.touches?.[0]?.clientY || e.clientY) - rect.top;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#fff";
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSig(true);
  };
  const endDraw = () => setDrawing(false);
  const clearSig = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setHasSig(false);
  };

  const handleSign = async () => {
    if (!hasSig) return alert("Please sign");
    if (!signatureName) return alert("Name required");
    const sigData = canvasRef.current.toDataURL();
    await base44.entities.WorkPermit.update(selected.id, {
      signature_data: sigData,
      signed_by_name: signatureName,
      signed_by_employee_id: signatureEmpId,
      signature_timestamp: new Date().toISOString(),
      signature_device_info: navigator.userAgent,
      status: "Authorized",
      checklist_result: selected.safety_checklist?.every(i => i.checked) ? "Pass" : "Partial"
    });
    await base44.entities.PTWAuditLog.create({
      permit_id: selected.id, from_status: "Checklist Completed", to_status: "Authorized",
      changed_by: user?.email, changed_by_name: signatureName,
      reason: "Signature captured", timestamp: new Date().toISOString()
    });
    setView("detail");
    loadPermit(selected.id);
    init();
  };

  const filtered = filterStatus === "all" ? permits : permits.filter(p => p.status === filterStatus);

  if (view === "create") return <CreatePTWView form={form} setForm={setForm} projects={projects} contractors={contractors}
    checklist={checklist} setChecklist={setChecklist} ppeList={ppeList} setPpeList={setPpeList}
    onHazardChange={handleHazardChange} onCreate={handleCreatePermit} onBack={() => setView("list")} />;

  if (view === "sign") return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-4 pt-10 pb-4 flex items-center gap-3">
        <button onClick={() => setView("detail")} className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-base font-bold">Authorize PTW</h1>
          <p className="text-xs text-gray-400">{selected?.permit_id}</p>
        </div>
      </div>
      <div className="px-4 py-4 space-y-4">
        <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl px-4 py-3 text-sm text-amber-300">
          By signing, you confirm all safety checks are complete and work may proceed.
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-2 block">Full Name *</label>
          <input value={signatureName} onChange={e => setSignatureName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white" placeholder="Your full name" />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-2 block">Employee ID</label>
          <input value={signatureEmpId} onChange={e => setSignatureEmpId(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white" placeholder="EMP-XXXXX" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-gray-400">Signature *</label>
            <button onClick={clearSig} className="text-xs text-red-400">Clear</button>
          </div>
          <canvas ref={canvasRef} width={320} height={160}
            className="w-full bg-gray-800 border-2 border-dashed border-gray-600 rounded-xl touch-none"
            style={{ height: 160 }}
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
          {!hasSig && <p className="text-xs text-gray-600 text-center mt-1">Sign with your finger or mouse</p>}
        </div>
        <button onClick={handleSign} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-4 text-sm font-bold transition-colors">
          ✓ Authorize & Sign Permit
        </button>
        <div className="pb-24" />
      </div>
    </div>
  );

  if (view === "detail" && selected) return (
    <PTWDetail permit={selected} user={user}
      onBack={() => setView("list")}
      onSign={() => setView("sign")}
      onStatusChange={updateStatus} />
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-4 pt-10 pb-4">
        <h1 className="text-lg font-bold text-white">Work Permits</h1>
        <p className="text-xs text-gray-400">PTW Tracker</p>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {["all", "Draft", "Submitted", "Authorized", "Active", "Closed"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterStatus === s ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400"}`}>
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      </div>
      <div className="px-4 py-4 space-y-3">
        <button onClick={() => setView("create")}
          className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 rounded-xl py-3.5 text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Create New Permit
        </button>
        {loading ? <div className="text-center text-gray-500 py-8">Loading...</div>
          : filtered.length === 0 ? (
            <div className="text-center text-gray-600 py-12">
              <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No permits found</p>
            </div>
          ) : filtered.map(permit => (
            <button key={permit.id} onClick={() => { setSelected(permit); setView("detail"); }}
              className="w-full bg-gray-900 border border-gray-800 rounded-2xl p-4 text-left active:scale-95 transition-transform">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono text-blue-400">{permit.permit_id || permit.id?.slice(0, 8)}</span>
                  <p className="text-sm font-semibold text-white mt-1">{permit.hazard_category}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{permit.contractor_name} · {permit.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-lg ${STATUS_COLORS[permit.status] || "bg-gray-700 text-gray-300"}`}>
                    {permit.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </div>
              </div>
              {permit.order_number && <p className="text-xs text-gray-600 mt-2">Order: {permit.order_number}</p>}
            </button>
          ))}
        <div className="pb-24" />
      </div>
    </div>
  );
}

function CreatePTWView({ form, setForm, projects, contractors, checklist, setChecklist, ppeList, setPpeList, onHazardChange, onCreate, onBack }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-4 pt-10 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-base font-bold">New Work Permit</h1>
          <p className="text-xs text-gray-400">Fill all required fields</p>
        </div>
      </div>
      <div className="px-4 py-4 space-y-4">
        <Section title="Basic Info">
          <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white">
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input value={form.site_area} onChange={e => setForm(f => ({ ...f, site_area: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white" placeholder="Site / Area" />
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white" />
          <div className="grid grid-cols-2 gap-2">
            <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white" placeholder="Start" />
            <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white" placeholder="End" />
          </div>
        </Section>

        <Section title="Hazard & Assignment">
          <label className="text-xs text-gray-400">Hazard Category *</label>
          <div className="grid grid-cols-2 gap-2">
            {HAZARD_CATEGORIES.map(h => (
              <button key={h} onClick={() => onHazardChange(h)}
                className={`py-2.5 px-3 rounded-xl text-xs font-medium transition-colors ${form.hazard_category === h ? "bg-amber-600 text-white" : "bg-gray-800 text-gray-400"}`}>
                {h}
              </button>
            ))}
          </div>
          <input value={form.order_number} onChange={e => setForm(f => ({ ...f, order_number: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white" placeholder="Order / Work Order Number *" />
          <select value={form.contractor_id} onChange={e => setForm(f => ({ ...f, contractor_id: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white">
            <option value="">Select Contractor...</option>
            {contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input value={form.supervisor_name} onChange={e => setForm(f => ({ ...f, supervisor_name: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white" placeholder="Assigned Supervisor" />
          <input value={form.technician_name} onChange={e => setForm(f => ({ ...f, technician_name: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white" placeholder="Assigned Technician / Safety Officer" />
        </Section>

        <Section title="Risk & Notes">
          <textarea value={form.risk_notes} onChange={e => setForm(f => ({ ...f, risk_notes: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white resize-none" rows={3} placeholder="Risk notes..." />
          <input value={form.method_statement_ref} onChange={e => setForm(f => ({ ...f, method_statement_ref: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white" placeholder="Method Statement Reference" />
        </Section>

        {ppeList.length > 0 && (
          <Section title="PPE Checklist">
            {ppeList.map((item, i) => (
              <label key={i} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                <input type="checkbox" checked={item.checked} onChange={() => setPpeList(prev => prev.map((p, j) => j === i ? { ...p, checked: !p.checked } : p))}
                  className="w-5 h-5 rounded" />
                <span className="text-sm text-white">{item.item}</span>
              </label>
            ))}
          </Section>
        )}

        {checklist.length > 0 && (
          <Section title="Safety Checklist">
            {checklist.map((item, i) => (
              <div key={i} className="py-2 border-b border-gray-800 last:border-0">
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={item.checked} onChange={() => setChecklist(prev => prev.map((c, j) => j === i ? { ...c, checked: !c.checked } : c))}
                    className="w-5 h-5 rounded" />
                  <span className="text-sm text-white">{item.item}</span>
                  {item.required && <span className="text-xs text-red-400">*req</span>}
                </label>
              </div>
            ))}
          </Section>
        )}

        <button onClick={onCreate}
          className="w-full bg-amber-600 hover:bg-amber-500 rounded-xl py-4 text-sm font-bold transition-colors">
          Submit Work Permit
        </button>
        <div className="pb-24" />
      </div>
    </div>
  );
}

function PTWDetail({ permit, user, onBack, onSign, onStatusChange }) {
  const canSign = user?.role !== "admin" && permit.status === "Checklist Completed";
  const nextActions = {
    "Submitted": "Assigned",
    "Assigned": "Checklist Completed",
    "Authorized": "Active",
    "Active": "Closed"
  };
  const next = nextActions[permit.status];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-4 pt-10 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold">{permit.permit_id || permit.id?.slice(0, 8)}</h1>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-lg ${STATUS_COLORS[permit.status] || "bg-gray-700"}`}>{permit.status}</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{permit.hazard_category} · {permit.date}</p>
        </div>
      </div>
      <div className="px-4 py-4 space-y-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
          <DetailRow label="Project" value={permit.project_id} />
          <DetailRow label="Site/Area" value={permit.site_area} />
          <DetailRow label="Order No." value={permit.order_number} />
          <DetailRow label="Contractor" value={permit.contractor_name} />
          <DetailRow label="Supervisor" value={permit.supervisor_name} />
          <DetailRow label="Technician" value={permit.technician_name} />
          <DetailRow label="Time" value={`${permit.start_time || "—"} → ${permit.end_time || "—"}`} />
        </div>

        {permit.risk_notes && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <p className="text-xs text-gray-400 mb-1">Risk Notes</p>
            <p className="text-sm text-white">{permit.risk_notes}</p>
          </div>
        )}

        {permit.signature_data && (
          <div className="bg-green-900/20 border border-green-700/40 rounded-2xl p-4">
            <p className="text-xs text-green-400 font-medium mb-2">✓ Authorized</p>
            <img src={permit.signature_data} alt="Signature" className="w-full h-20 object-contain bg-gray-800 rounded-lg" />
            <p className="text-xs text-gray-400 mt-2">{permit.signed_by_name} · {permit.signed_by_employee_id}</p>
            <p className="text-xs text-gray-500">{permit.signature_timestamp}</p>
          </div>
        )}

        <div className="space-y-2">
          {permit.status === "Checklist Completed" && (
            <button onClick={onSign} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-3.5 text-sm font-bold flex items-center justify-center gap-2">
              <Pen className="w-4 h-4" /> Sign & Authorize
            </button>
          )}
          {next && permit.status !== "Checklist Completed" && (
            <button onClick={() => onStatusChange(permit, next)}
              className="w-full bg-blue-600 hover:bg-blue-500 rounded-xl py-3.5 text-sm font-semibold">
              Move to → {next}
            </button>
          )}
          {permit.status !== "Cancelled" && permit.status !== "Closed" && (
            <button onClick={() => { const r = prompt("Cancellation reason?"); if (r) onStatusChange(permit, "Cancelled", r); }}
              className="w-full bg-gray-800 hover:bg-gray-700 rounded-xl py-3 text-sm font-medium text-red-400">
              Cancel Permit
            </button>
          )}
        </div>
        <div className="pb-24" />
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{title}</h3>
      {children}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-gray-500 shrink-0 w-24">{label}</span>
      <span className="text-sm text-white text-right">{value || "—"}</span>
    </div>
  );
}