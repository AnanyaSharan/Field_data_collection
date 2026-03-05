import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import * as XLSX from 'npm:xlsx@0.18.5';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { project_id, start_date, end_date, site_area } = body;

    // Build filters
    const dateFilter = {};
    if (start_date) dateFilter['$gte'] = start_date;
    if (end_date) dateFilter['$lte'] = end_date;

    const buildFilter = (extra = {}) => {
      const f = { ...extra };
      if (project_id) f.project_id = project_id;
      if (start_date || end_date) f.date = dateFilter;
      if (site_area) f.site_area = site_area;
      return f;
    };

    // Fetch all data
    const [plans, permits, manpower, observations, phIssues, dhIssues, projects] = await Promise.all([
      base44.asServiceRole.entities.DailyPlan.filter(buildFilter()),
      base44.asServiceRole.entities.WorkPermit.filter(buildFilter()),
      base44.asServiceRole.entities.ManpowerLog.filter(buildFilter()),
      base44.asServiceRole.entities.Observation.filter(buildFilter()),
      base44.asServiceRole.entities.HeadLevelIssue.filter(buildFilter({ issue_type: 'PH' })),
      base44.asServiceRole.entities.HeadLevelIssue.filter(buildFilter({ issue_type: 'DH' })),
      base44.asServiceRole.entities.Project.list(),
    ]);

    const project = projects.find(p => p.id === project_id) || {};

    const wb = XLSX.utils.book_new();

    // Helper
    const addSheet = (name, data, headers) => {
      const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
      ws['!freeze'] = { xSplit: 0, ySplit: 1 };
      const colWidths = headers.map(h => ({ wch: Math.max(h.length + 4, 14) }));
      ws['!cols'] = colWidths;
      XLSX.utils.book_append_sheet(wb, ws, name);
    };

    // README
    const readmeData = [
      ['iPeMS Field Operations - Master Export'],
      ['Export Timestamp', new Date().toISOString()],
      ['Project', project.name || 'All Projects'],
      ['Project Code', project.code || '-'],
      ['Client', project.client || '-'],
      ['Date Range', `${start_date || 'All'} to ${end_date || 'All'}`],
      ['Site/Area Filter', site_area || 'All'],
      ['Version', 'v0.1 MVP'],
      [],
      ['Tabs in this workbook:'],
      ['Daily_Plan_Actual', 'Morning targets and evening achievements mapped to WBS'],
      ['PTW_Master', 'Work permit tracker with authorization trail'],
      ['Manpower', 'Daily headcount by contractor'],
      ['Observations', 'Site observations by category and severity'],
      ['PH_Issues', 'Project Head level issues'],
      ['DH_Issues', 'Delivery Head level issues'],
    ];
    const wsReadme = XLSX.utils.aoa_to_sheet(readmeData);
    wsReadme['!cols'] = [{ wch: 28 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, wsReadme, 'README');

    // Daily Plan Actual
    const planHeaders = ['Date','Project','Site/Area','WBS Code','Task Name','UOM','Planned Qty','Actual Qty','Deviation','Deviation Reason','Comments','Entered By','Last Updated','Record ID'];
    const planRows = plans.map(p => [
      p.date, project.name || p.project_id, p.site_area || '', p.wbs_code, p.task_description, p.uom,
      p.planned_qty || 0, p.actual_qty || 0, (p.actual_qty || 0) - (p.planned_qty || 0),
      p.deviation_reason_text ? `${p.deviation_reason}: ${p.deviation_reason_text}` : (p.deviation_reason || ''),
      p.comments || '', p.created_by || '', p.updated_date || '', p.id
    ]);
    addSheet('Daily_Plan_Actual', planRows, planHeaders);

    // PTW Master
    const ptwHeaders = ['Permit ID','Date','Start Time','End Time','Project','Site/Area','Hazard Category','Order Number','Contractor','Supervisor','Technician','Checklist Result','Authorized?','Signed By','Signature Timestamp','Status','Close Timestamp','Record ID'];
    const ptwRows = permits.map(p => [
      p.permit_id || p.id.slice(0,8).toUpperCase(), p.date, p.start_time || '', p.end_time || '',
      project.name || p.project_id, p.site_area || '', p.hazard_category, p.order_number,
      p.contractor_name || '', p.supervisor_name || '', p.technician_name || '',
      p.checklist_result || 'Pending', p.status === 'Authorized' || p.status === 'Active' || p.status === 'Closed' ? 'Y' : 'N',
      p.signed_by_name || '', p.signature_timestamp || '', p.status, p.close_timestamp || '', p.id
    ]);
    addSheet('PTW_Master', ptwRows, ptwHeaders);

    // Manpower
    const mpHeaders = ['Date','Project','Contractor','Headcount Present','Planned Headcount','Notes','Entered By','Record ID'];
    const mpRows = manpower.map(m => [
      m.date, project.name || m.project_id, m.contractor_name, m.headcount_present,
      m.planned_headcount || '', m.notes || '', m.created_by || '', m.id
    ]);
    addSheet('Manpower', mpRows, mpHeaders);

    // Observations
    const obsHeaders = ['Date','Project','Category','Subcategory','Severity','Observation','Action Owner','Due Date','Status','Photos Count','Entered By','Record ID'];
    const obsRows = observations.map(o => [
      o.date, project.name || o.project_id, o.category, o.subcategory || '',
      o.severity, o.observation_text, o.action_owner || '', o.due_date || '',
      o.status, (o.photos || []).length, o.created_by || '', o.id
    ]);
    addSheet('Observations', obsRows, obsHeaders);

    // PH Issues
    const issueHeaders = ['Date','Project','Title','Description','Impact','Urgency','Owner','Status','Created By','Record ID'];
    const phRows = phIssues.map(i => [
      i.date, project.name || i.project_id, i.title, i.description, i.impact, i.urgency, i.owner || '', i.status, i.created_by || '', i.id
    ]);
    addSheet('PH_Issues', phRows, issueHeaders);

    // DH Issues
    const dhRows = dhIssues.map(i => [
      i.date, project.name || i.project_id, i.title, i.description, i.impact, i.urgency, i.owner || '', i.status, i.created_by || '', i.id
    ]);
    addSheet('DH_Issues', dhRows, issueHeaders);

    const xlsxBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    return new Response(xlsxBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=iPeMS_Master_${new Date().toISOString().slice(0,10)}.xlsx`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});