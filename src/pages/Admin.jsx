import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Edit2, Check, X, ChevronRight, Settings, Users, Building2, Tag, ShieldCheck, ListChecks } from "lucide-react";

const ADMIN_SECTIONS = [
  { id: "users", label: "User Management", icon: Users, color: "bg-indigo-600" },
  { id: "projects", label: "Projects", icon: Building2, color: "bg-blue-600" },
  { id: "wbs", label: "WBS Dictionary", icon: ListChecks, color: "bg-green-600" },
  { id: "contractors", label: "Contractors", icon: Users, color: "bg-purple-600" },
  { id: "reasons", label: "Deviation Reasons", icon: Tag, color: "bg-amber-600" },
  { id: "obs_cats", label: "Observation Categories", icon: Tag, color: "bg-red-600" },
  { id: "ptw_templates", label: "PTW Templates", icon: ShieldCheck, color: "bg-orange-600" },
];

export default function Admin() {
  const [user, setUser] = useState(null);
  const [section, setSection] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u));
  }, []);

  if (user && user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-white">Access Restricted</h2>
          <p className="text-gray-400 mt-2">Admin access required</p>
        </div>
      </div>
    );
  }

  if (section === "users") return <UsersAdmin onBack={() => setSection(null)} />;
  if (section === "projects") return <ProjectsAdmin onBack={() => setSection(null)} />;
  if (section === "wbs") return <WBSAdmin onBack={() => setSection(null)} />;
  if (section === "contractors") return <ContractorsAdmin onBack={() => setSection(null)} />;
  if (section === "reasons") return <DeviationReasonsAdmin onBack={() => setSection(null)} />;
  if (section === "obs_cats") return <ObsCategoriesAdmin onBack={() => setSection(null)} />;
  if (section === "ptw_templates") return <PTWTemplatesAdmin onBack={() => setSection(null)} />;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-4 pt-10 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-700 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-gray-300" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Admin Console</h1>
            <p className="text-xs text-gray-400">Manage system configuration</p>
          </div>
        </div>
      </div>
      <div className="px-4 py-5 space-y-2">
        {ADMIN_SECTIONS.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)}
            className="w-full flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-2xl p-4 text-left active:scale-95 transition-transform">
            <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center shrink-0`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white flex-1">{s.label}</span>
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        ))}
        <div className="pb-24" />
      </div>
    </div>
  );
}

// ── Projects Admin ──────────────────────────────
function ProjectsAdmin({ onBack }) {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", client: "", location: "", status: "active" });

  useEffect(() => { base44.entities.Project.list().then(setItems); }, []);

  const save = async () => {
    if (!form.name || !form.code) return;
    await base44.entities.Project.create(form);
    setForm({ name: "", code: "", client: "", location: "", status: "active" });
    setShowForm(false);
    base44.entities.Project.list().then(setItems);
  };

  const del = async (id) => {
    if (!confirm("Delete project?")) return;
    await base44.entities.Project.delete(id);
    base44.entities.Project.list().then(setItems);
  };

  return (
    <AdminSection title="Projects" onBack={onBack} onAdd={() => setShowForm(true)}>
      {showForm && (
        <AdminForm onSave={save} onCancel={() => setShowForm(false)}>
          <AdminInput label="Project Name *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
          <AdminInput label="Code *" value={form.code} onChange={v => setForm(f => ({ ...f, code: v }))} />
          <AdminInput label="Client" value={form.client} onChange={v => setForm(f => ({ ...f, client: v }))} />
          <AdminInput label="Location" value={form.location} onChange={v => setForm(f => ({ ...f, location: v }))} />
        </AdminForm>
      )}
      {items.map(item => (
        <AdminCard key={item.id} title={item.name} subtitle={`${item.code} · ${item.status}`} onDelete={() => del(item.id)} />
      ))}
    </AdminSection>
  );
}

// ── WBS Admin ──────────────────────────────────
function WBSAdmin({ onBack }) {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ wbs_code: "", task_name: "", uom: "", planned_baseline: "" });

  useEffect(() => {
    base44.entities.Project.filter({ status: "active" }).then(p => {
      setProjects(p);
      if (p.length > 0) setSelectedProject(p[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedProject) base44.entities.WBSItem.filter({ project_id: selectedProject }).then(setItems);
  }, [selectedProject]);

  const save = async () => {
    if (!form.wbs_code || !form.task_name || !form.uom) return;
    await base44.entities.WBSItem.create({ ...form, project_id: selectedProject, planned_baseline: parseFloat(form.planned_baseline) || 0, is_active: true });
    setForm({ wbs_code: "", task_name: "", uom: "", planned_baseline: "" });
    setShowForm(false);
    base44.entities.WBSItem.filter({ project_id: selectedProject }).then(setItems);
  };

  const del = async (id) => {
    await base44.entities.WBSItem.delete(id);
    base44.entities.WBSItem.filter({ project_id: selectedProject }).then(setItems);
  };

  return (
    <AdminSection title="WBS Dictionary" onBack={onBack} onAdd={() => setShowForm(true)}>
      <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white">
        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      {showForm && (
        <AdminForm onSave={save} onCancel={() => setShowForm(false)}>
          <AdminInput label="WBS Code *" value={form.wbs_code} onChange={v => setForm(f => ({ ...f, wbs_code: v }))} placeholder="e.g. 1.1.1" />
          <AdminInput label="Task Name *" value={form.task_name} onChange={v => setForm(f => ({ ...f, task_name: v }))} />
          <AdminInput label="UOM *" value={form.uom} onChange={v => setForm(f => ({ ...f, uom: v }))} placeholder="m, ton, nos..." />
          <AdminInput label="Planned Baseline" value={form.planned_baseline} onChange={v => setForm(f => ({ ...f, planned_baseline: v }))} type="number" />
        </AdminForm>
      )}
      {items.map(item => (
        <AdminCard key={item.id} title={`${item.wbs_code} — ${item.task_name}`} subtitle={`UOM: ${item.uom}`} onDelete={() => del(item.id)} />
      ))}
    </AdminSection>
  );
}

// ── Contractors Admin ──────────────────────────
function ContractorsAdmin({ onBack }) {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", contact: "" });

  useEffect(() => { base44.entities.Contractor.list().then(setItems); }, []);

  const save = async () => {
    if (!form.name) return;
    await base44.entities.Contractor.create({ ...form, is_active: true });
    setForm({ name: "", category: "", contact: "" });
    setShowForm(false);
    base44.entities.Contractor.list().then(setItems);
  };

  const del = async (id) => {
    await base44.entities.Contractor.delete(id);
    base44.entities.Contractor.list().then(setItems);
  };

  return (
    <AdminSection title="Contractors" onBack={onBack} onAdd={() => setShowForm(true)}>
      {showForm && (
        <AdminForm onSave={save} onCancel={() => setShowForm(false)}>
          <AdminInput label="Name *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
          <AdminInput label="Category" value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} />
          <AdminInput label="Contact" value={form.contact} onChange={v => setForm(f => ({ ...f, contact: v }))} />
        </AdminForm>
      )}
      {items.map(item => (
        <AdminCard key={item.id} title={item.name} subtitle={item.category || "No category"} onDelete={() => del(item.id)} />
      ))}
    </AdminSection>
  );
}

// ── Deviation Reasons Admin ────────────────────
function DeviationReasonsAdmin({ onBack }) {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ reason: "", requires_text: false });

  useEffect(() => { base44.entities.DeviationReason.list().then(setItems); }, []);

  const save = async () => {
    if (!form.reason) return;
    await base44.entities.DeviationReason.create({ ...form, is_active: true });
    setForm({ reason: "", requires_text: false });
    setShowForm(false);
    base44.entities.DeviationReason.list().then(setItems);
  };

  const del = async (id) => {
    await base44.entities.DeviationReason.delete(id);
    base44.entities.DeviationReason.list().then(setItems);
  };

  return (
    <AdminSection title="Deviation Reasons" onBack={onBack} onAdd={() => setShowForm(true)}>
      {showForm && (
        <AdminForm onSave={save} onCancel={() => setShowForm(false)}>
          <AdminInput label="Reason *" value={form.reason} onChange={v => setForm(f => ({ ...f, reason: v }))} />
          <label className="flex items-center gap-2 text-sm text-white">
            <input type="checkbox" checked={form.requires_text} onChange={e => setForm(f => ({ ...f, requires_text: e.target.checked }))} className="w-4 h-4" />
            Requires text input
          </label>
        </AdminForm>
      )}
      {items.map(item => (
        <AdminCard key={item.id} title={item.reason} subtitle={item.requires_text ? "Requires text" : ""} onDelete={() => del(item.id)} />
      ))}
    </AdminSection>
  );
}

// ── Observation Categories Admin ───────────────
function ObsCategoriesAdmin({ onBack }) {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: "Safety", subcategory: "" });

  useEffect(() => { base44.entities.ObservationCategory.list().then(setItems); }, []);

  const save = async () => {
    if (!form.subcategory) return;
    await base44.entities.ObservationCategory.create({ ...form, is_active: true });
    setForm({ category: "Safety", subcategory: "" });
    setShowForm(false);
    base44.entities.ObservationCategory.list().then(setItems);
  };

  const del = async (id) => {
    await base44.entities.ObservationCategory.delete(id);
    base44.entities.ObservationCategory.list().then(setItems);
  };

  return (
    <AdminSection title="Observation Categories" onBack={onBack} onAdd={() => setShowForm(true)}>
      {showForm && (
        <AdminForm onSave={save} onCancel={() => setShowForm(false)}>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white">
            {["Safety", "Quality", "Productivity", "Compliance"].map(c => <option key={c}>{c}</option>)}
          </select>
          <AdminInput label="Subcategory *" value={form.subcategory} onChange={v => setForm(f => ({ ...f, subcategory: v }))} />
        </AdminForm>
      )}
      {items.map(item => (
        <AdminCard key={item.id} title={item.subcategory} subtitle={item.category} onDelete={() => del(item.id)} />
      ))}
    </AdminSection>
  );
}

// ── PTW Templates Admin ────────────────────────
function PTWTemplatesAdmin({ onBack }) {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ hazard_category: "Hot Work", template_name: "", ppe_items: "", checklist_items: "" });

  useEffect(() => { base44.entities.PTWTemplate.list().then(setItems); }, []);

  const save = async () => {
    if (!form.template_name) return;
    const ppeArr = form.ppe_items.split("\n").map(s => s.trim()).filter(Boolean);
    const checkArr = form.checklist_items.split("\n").map(s => s.trim()).filter(Boolean).map(item => ({ item, required: true }));
    await base44.entities.PTWTemplate.create({
      hazard_category: form.hazard_category,
      template_name: form.template_name,
      ppe_items: ppeArr,
      checklist_items: checkArr,
      is_active: true
    });
    setForm({ hazard_category: "Hot Work", template_name: "", ppe_items: "", checklist_items: "" });
    setShowForm(false);
    base44.entities.PTWTemplate.list().then(setItems);
  };

  const del = async (id) => {
    await base44.entities.PTWTemplate.delete(id);
    base44.entities.PTWTemplate.list().then(setItems);
  };

  return (
    <AdminSection title="PTW Templates" onBack={onBack} onAdd={() => setShowForm(true)}>
      {showForm && (
        <AdminForm onSave={save} onCancel={() => setShowForm(false)}>
          <select value={form.hazard_category} onChange={e => setForm(f => ({ ...f, hazard_category: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white">
            {["Hot Work", "Working at Height", "Confined Space", "Electrical", "Lifting", "Excavation", "General"].map(c => <option key={c}>{c}</option>)}
          </select>
          <AdminInput label="Template Name *" value={form.template_name} onChange={v => setForm(f => ({ ...f, template_name: v }))} />
          <div>
            <label className="text-xs text-gray-400 mb-1 block">PPE Items (one per line)</label>
            <textarea value={form.ppe_items} onChange={e => setForm(f => ({ ...f, ppe_items: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white resize-none" rows={3} placeholder="Hard hat&#10;Safety harness&#10;Gloves..." />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Safety Checklist Items (one per line)</label>
            <textarea value={form.checklist_items} onChange={e => setForm(f => ({ ...f, checklist_items: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white resize-none" rows={4} placeholder="Area cordoned off&#10;Fire extinguisher in place&#10;..." />
          </div>
        </AdminForm>
      )}
      {items.map(item => (
        <AdminCard key={item.id} title={item.template_name} subtitle={`${item.hazard_category} · ${(item.checklist_items || []).length} checks`} onDelete={() => del(item.id)} />
      ))}
    </AdminSection>
  );
}

// ── Users Admin ────────────────────────────────
function UsersAdmin({ onBack }) {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", role: "user" });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { base44.entities.User.list().then(setUsers); }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const invite = async () => {
    if (!form.email) return showToast("Email is required", "error");
    setLoading(true);
    try {
      await base44.users.inviteUser(form.email, form.role);
      setForm({ email: "", role: "user" });
      setShowForm(false);
      showToast(`Invitation sent to ${form.email}`);
      base44.entities.User.list().then(setUsers);
    } catch (e) {
      showToast(e.message || "Failed to invite user", "error");
    }
    setLoading(false);
  };

  return (
    <AdminSection title="User Management" onBack={onBack} onAdd={() => setShowForm(true)}>
      {toast && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${toast.type === "success" ? "bg-green-700 text-green-100" : "bg-red-700 text-red-100"}`}>
          {toast.msg}
        </div>
      )}
      {showForm && (
        <div className="bg-gray-900 border border-indigo-700/50 rounded-2xl p-4 space-y-3">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Invite New User</p>
          <AdminInput label="Email Address *" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="user@example.com" />
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {["user", "admin"].map(r => (
                <button key={r} onClick={() => setForm(f => ({ ...f, role: r }))}
                  className={`py-2.5 rounded-xl text-xs font-semibold capitalize transition-colors ${form.role === r ? (r === "admin" ? "bg-indigo-600 text-white" : "bg-blue-600 text-white") : "bg-gray-800 text-gray-400"}`}>
                  {r === "admin" ? "🔐 Admin" : "👤 User"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={invite} disabled={loading}
              className="flex-1 bg-indigo-600 rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-1 disabled:opacity-50">
              <Check className="w-4 h-4" /> {loading ? "Sending..." : "Send Invite"}
            </button>
            <button onClick={() => setShowForm(false)} className="bg-gray-700 rounded-xl px-4 py-3 text-sm">Cancel</button>
          </div>
        </div>
      )}
      {users.map(u => (
        <div key={u.id} className="bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-900/50 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-indigo-300">{(u.full_name || u.email || "?")[0].toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{u.full_name || "—"}</p>
            <p className="text-xs text-gray-500 truncate">{u.email}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-lg font-medium ${u.role === "admin" ? "bg-indigo-900/50 text-indigo-300" : "bg-gray-800 text-gray-400"}`}>
            {u.role || "user"}
          </span>
        </div>
      ))}
    </AdminSection>
  );
}

// ── Reusable Admin Components ──────────────────
function AdminSection({ title, onBack, onAdd, children }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-4 pt-10 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
        <h1 className="text-base font-bold flex-1">{title}</h1>
        <button onClick={onAdd} className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="px-4 py-4 space-y-3">
        {children}
        <div className="pb-24" />
      </div>
    </div>
  );
}

function AdminForm({ onSave, onCancel, children }) {
  return (
    <div className="bg-gray-900 border border-blue-700/50 rounded-2xl p-4 space-y-3">
      {children}
      <div className="flex gap-2 pt-1">
        <button onClick={onSave} className="flex-1 bg-blue-600 rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-1">
          <Check className="w-4 h-4" /> Save
        </button>
        <button onClick={onCancel} className="bg-gray-700 rounded-xl px-4 py-3 text-sm">Cancel</button>
      </div>
    </div>
  );
}

function AdminInput({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="text-xs text-gray-400 mb-1 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white" />
    </div>
  );
}

function AdminCard({ title, subtitle, onDelete }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <button onClick={onDelete} className="w-8 h-8 bg-red-900/30 rounded-lg flex items-center justify-center">
        <Trash2 className="w-3.5 h-3.5 text-red-400" />
      </button>
    </div>
  );
}