import React, { useState } from "react";
import { ChevronRight, ChevronDown, Book, Home, ClipboardList, ShieldCheck, FileText, Download, Settings, Users, AlertTriangle, CheckCircle2, Info } from "lucide-react";

const SECTIONS = [
  {
    id: "overview",
    title: "Application Overview",
    icon: Home,
    color: "bg-blue-600",
    content: [
      {
        type: "intro",
        text: "iPeMS Field Operations is a mobile-first digital field operations platform designed to replace paper-based site logs. It centralises daily planning, safety permit management, site intelligence, and management escalation into one streamlined app."
      },
      {
        type: "heading", text: "Core Modules"
      },
      {
        type: "table",
        headers: ["Module", "Purpose", "Key Users"],
        rows: [
          ["Home / Dashboard", "Daily KPIs, quick actions, escalation shortcuts", "All roles"],
          ["Plan vs Actual", "WBS-mapped daily target vs achievement tracking", "Supervisor, Project Head"],
          ["PTW (Work Permits)", "Digital Permit-to-Work lifecycle management", "Supervisor, Safety Officer, Project Head"],
          ["DPR (Daily Progress Report)", "Manpower, observations, PH/DH issues", "All field roles"],
          ["Export", "Download master Excel workbook for reporting", "Project Head, Admin"],
          ["Admin Console", "System configuration – projects, WBS, contractors, templates", "Admin only"],
        ]
      },
      {
        type: "heading", text: "User Roles"
      },
      {
        type: "table",
        headers: ["Role", "Access Level"],
        rows: [
          ["Admin", "Full access including Admin Console"],
          ["Project Head (PH)", "All modules; view PH Issues raised to them"],
          ["Delivery Head (DH)", "All modules; view DH Issues raised to them"],
          ["Supervisor", "Plan, PTW, DPR – full data entry"],
          ["Technician / Safety Officer", "PTW checklist and DPR observations"],
          ["Viewer / Auditor", "Read-only access to all reports"],
        ]
      }
    ]
  },
  {
    id: "home",
    title: "Home Dashboard",
    icon: Home,
    color: "bg-indigo-600",
    content: [
      {
        type: "intro",
        text: "The Home screen is the first screen after login. It shows a real-time snapshot of today's field status and provides quick navigation to all major actions."
      },
      {
        type: "heading", text: "KPI Cards"
      },
      {
        type: "list",
        items: [
          "PTWs Active – Count of permits with status 'Authorized' or 'Active' today.",
          "Crit. Obs. – Count of open observations with severity 'High' or 'Critical' today.",
          "Plan% – Ratio of total actual quantity to total planned quantity for today, expressed as a percentage.",
        ]
      },
      {
        type: "heading", text: "Quick Actions"
      },
      {
        type: "list",
        items: [
          "Add WBS Line – Jump to Plan vs Actual to log today's progress.",
          "Create PTW – Jump to the Work Permit creation form.",
          "Add Observation – Jump to DPR › Observations tab.",
          "Log Manpower – Jump to DPR › Manpower tab.",
        ]
      },
      {
        type: "heading", text: "Escalation Shortcuts"
      },
      {
        type: "list",
        items: [
          "Raise PH Issue – Opens DPR › PH Issues tab pre-selected.",
          "Raise DH Issue – Opens DPR › DH Issues tab pre-selected.",
          "Today's Summary – Opens DPR › Summary tab with a consolidated view.",
        ]
      }
    ]
  },
  {
    id: "plan",
    title: "Plan vs Actual",
    icon: ClipboardList,
    color: "bg-blue-500",
    content: [
      {
        type: "intro",
        text: "This module is used to record what was planned for the day against what was actually achieved, mapped to the Work Breakdown Structure (WBS) of the project."
      },
      {
        type: "heading", text: "Selecting Project & Date"
      },
      {
        type: "list",
        items: [
          "Select the project from the dropdown at the top.",
          "Use the date picker or arrow buttons to navigate to the target date.",
          "All entries shown are specific to the selected project + date combination.",
        ]
      },
      {
        type: "heading", text: "Adding a WBS Line"
      },
      {
        type: "steps",
        items: [
          "Tap 'Add WBS Line'.",
          "Select a WBS task from the dropdown – it auto-fills the task name and unit of measure (UOM).",
          "Enter the Planned Qty and Actual Qty.",
          "If there is any deviation (Actual ≠ Planned), a Deviation Reason selector will appear. Select the applicable reason. If 'Other (requires text)' is selected, a text field will appear – fill in a description.",
          "Optionally add a comment.",
          "Tap 'Add Line' to save.",
        ]
      },
      {
        type: "heading", text: "Editing an Existing Line"
      },
      {
        type: "steps",
        items: [
          "Tap the pencil/save icon on any plan card.",
          "Adjust Planned or Actual quantities.",
          "Select a deviation reason if required.",
          "Tap 'Save' to update the record.",
        ]
      },
      {
        type: "heading", text: "Copy From Yesterday"
      },
      {
        type: "para",
        text: "The 'Copy Yesterday' button copies all WBS lines from the previous day into today's date with the same Planned quantities, resetting Actual to 0. This is useful for recurring daily activities."
      },
      {
        type: "heading", text: "Summary Bar"
      },
      {
        type: "para",
        text: "When entries exist, a summary bar at the top shows the total Planned, total Actual, and total Deviation across all WBS lines for the selected date. Green deviation = overachievement; Red = shortfall."
      },
      {
        type: "note",
        text: "Deviation reason is mandatory whenever Actual ≠ Planned. The system will block submission without it."
      }
    ]
  },
  {
    id: "ptw",
    title: "Work Permits (PTW)",
    icon: ShieldCheck,
    color: "bg-amber-600",
    content: [
      {
        type: "intro",
        text: "The PTW module manages the full digital Permit-to-Work lifecycle from creation through authorization to closure, with a full audit trail."
      },
      {
        type: "heading", text: "Permit Lifecycle"
      },
      {
        type: "table",
        headers: ["Status", "Meaning", "Next Action"],
        rows: [
          ["Draft", "Permit being prepared (not yet submitted)", "Submit → 'Submitted'"],
          ["Submitted", "Submitted, awaiting assignment", "Move to → 'Assigned'"],
          ["Assigned", "Safety officer assigned; checklist to be completed", "Move to → 'Checklist Completed'"],
          ["Checklist Completed", "All safety checks done; awaiting authorization signature", "Sign & Authorize"],
          ["Authorized", "Signed off; work approved to start", "Move to → 'Active'"],
          ["Active", "Work is in progress", "Move to → 'Closed'"],
          ["Closed", "Work completed and permit closed", "Terminal state"],
          ["Cancelled", "Permit cancelled before completion", "Terminal state"],
        ]
      },
      {
        type: "heading", text: "Creating a New Permit"
      },
      {
        type: "steps",
        items: [
          "Tap 'Create New Permit' from the PTW list view.",
          "Fill in Basic Info: project, site/area, date, start & end time.",
          "Select Hazard Category (e.g. Hot Work, Electrical). This auto-loads the relevant PPE checklist and safety checklist from the configured template.",
          "Enter the Work Order / Order Number (mandatory).",
          "Select the Contractor and assign a Supervisor and Technician/Safety Officer.",
          "Fill in Risk Notes and Method Statement Reference (if applicable).",
          "Complete the PPE Checklist and Safety Checklist by checking each item.",
          "Tap 'Submit Work Permit'.",
        ]
      },
      {
        type: "heading", text: "Authorizing a Permit (Digital Signature)"
      },
      {
        type: "steps",
        items: [
          "Open the permit and advance it to 'Checklist Completed' status.",
          "Tap 'Sign & Authorize'.",
          "Enter your full name and employee ID.",
          "Draw your signature on the signature pad using your finger or mouse.",
          "Tap 'Authorize & Sign Permit' — the permit moves to 'Authorized' and the signature image is stored.",
        ]
      },
      {
        type: "heading", text: "Cancelling a Permit"
      },
      {
        type: "para",
        text: "From the permit detail view, tap 'Cancel Permit'. A reason prompt will appear — enter the cancellation reason and confirm. Cancelled permits are retained in the audit log."
      },
      {
        type: "heading", text: "Filtering Permits"
      },
      {
        type: "para",
        text: "Use the status filter chips at the top of the PTW list (All, Draft, Submitted, Authorized, Active, Closed) to narrow the permit list."
      },
      {
        type: "note",
        text: "Every status change is recorded in the PTW Audit Log with the user name, timestamp, and reason."
      }
    ]
  },
  {
    id: "dpr",
    title: "DPR – Daily Progress Report",
    icon: FileText,
    color: "bg-purple-600",
    content: [
      {
        type: "intro",
        text: "The DPR module captures qualitative site intelligence through five tabs: Manpower, Observations, PH Issues, DH Issues, and Summary."
      },
      {
        type: "heading", text: "Manpower Tab"
      },
      {
        type: "steps",
        items: [
          "Tap 'Log Manpower'.",
          "Enter the contractor / vendor name (autocomplete from registered contractors).",
          "Enter the headcount present (mandatory) and planned headcount (optional).",
          "Add any notes if required.",
          "Tap 'Add' to save.",
        ]
      },
      {
        type: "heading", text: "Observations Tab"
      },
      {
        type: "steps",
        items: [
          "Tap 'Add Observation'.",
          "Select a Category: Safety, Quality, Productivity, or Compliance.",
          "Select a Subcategory from the filtered list.",
          "Describe the observation in the text field.",
          "Set Severity: Low, Medium, High, or Critical.",
          "Assign an Action Owner and a Due Date.",
          "Tap 'Add' to save.",
        ]
      },
      {
        type: "para",
        text: "To update an observation's status, tap the status pill (Open / In Progress / Closed) on the observation card."
      },
      {
        type: "heading", text: "PH Issues Tab"
      },
      {
        type: "para",
        text: "Raise issues that require Project Head attention. Enter a title, description, impact area (Cost / Schedule / Safety / Quality), urgency (Normal / High / Immediate), and optional owner."
      },
      {
        type: "heading", text: "DH Issues Tab"
      },
      {
        type: "para",
        text: "Same as PH Issues but escalated to Delivery Head level. Use for issues requiring senior management intervention."
      },
      {
        type: "heading", text: "Summary Tab"
      },
      {
        type: "para",
        text: "Provides a consolidated view of all sections (manpower counts, observations by severity, PH/DH issues) for the selected project and date. This is the recommended view for daily verbal or written reporting."
      },
      {
        type: "note",
        text: "You can navigate directly to a specific tab from the Home screen using the escalation shortcuts."
      }
    ]
  },
  {
    id: "export",
    title: "Export Master Sheet",
    icon: Download,
    color: "bg-teal-600",
    content: [
      {
        type: "intro",
        text: "The Export module generates a multi-tab Excel workbook consolidating all field data for a selected project and date range. This is the primary reporting artifact."
      },
      {
        type: "heading", text: "How to Export"
      },
      {
        type: "steps",
        items: [
          "Select the Project from the dropdown.",
          "Set the From Date and To Date for the reporting period.",
          "Tap 'Download Master Excel'.",
          "The app will fetch all data, build the workbook, and download an .xls file to your device.",
        ]
      },
      {
        type: "heading", text: "Workbook Sheets"
      },
      {
        type: "table",
        headers: ["Sheet Name", "Contents"],
        rows: [
          ["README", "Export metadata: project name, date range, export timestamp"],
          ["Daily_Plan_Actual", "All WBS plan vs actual entries with deviation reason and comments"],
          ["PTW_Master", "All work permits with full details, authorization status, and timestamps"],
          ["Manpower", "All manpower logs by contractor and date"],
          ["Observations", "All site observations with severity, owner, due date, and status"],
          ["PH_Issues", "All Project Head escalations with urgency, impact, and status"],
          ["DH_Issues", "All Delivery Head escalations with urgency, impact, and status"],
        ]
      },
      {
        type: "note",
        text: "The exported file is in .xls (HTML table) format which opens directly in Microsoft Excel. Each sheet is rendered as a separate section in the file."
      }
    ]
  },
  {
    id: "admin",
    title: "Admin Console",
    icon: Settings,
    color: "bg-gray-600",
    content: [
      {
        type: "intro",
        text: "The Admin Console is accessible only to users with the 'Admin' role. It is used to configure all master data that drives the application's dropdowns and templates."
      },
      {
        type: "heading", text: "Projects"
      },
      {
        type: "para",
        text: "Create and manage projects. Each project has a name, code, client, location, and status (active/inactive/completed). Only active projects appear in Plan, PTW, DPR, and Export selectors."
      },
      {
        type: "heading", text: "WBS Dictionary"
      },
      {
        type: "para",
        text: "Define the Work Breakdown Structure for each project. Each WBS item has a code (e.g. 1.1.1), task name, unit of measure (UOM), and optional planned baseline quantity. These items populate the task dropdown in Plan vs Actual."
      },
      {
        type: "heading", text: "Contractors"
      },
      {
        type: "para",
        text: "Manage the list of contractors/vendors. Contractors appear as autocomplete suggestions in DPR Manpower logging and as a dropdown in PTW creation."
      },
      {
        type: "heading", text: "Deviation Reasons"
      },
      {
        type: "para",
        text: "Configure the list of pre-defined deviation reasons shown in Plan vs Actual when Actual ≠ Planned. Reasons can optionally require a free-text description."
      },
      {
        type: "heading", text: "Observation Categories"
      },
      {
        type: "para",
        text: "Manage subcategories under each observation category (Safety, Quality, Productivity, Compliance). These appear as subcategory options when logging observations in DPR."
      },
      {
        type: "heading", text: "PTW Templates"
      },
      {
        type: "para",
        text: "Define safety checklists and PPE requirements per hazard category (Hot Work, Electrical, Working at Height, etc.). When a user selects a hazard category in PTW creation, the corresponding template's checklist is auto-loaded. Each checklist item can be marked as required."
      },
      {
        type: "note",
        text: "Deleting master data (WBS items, contractors, etc.) does not affect existing historical records. It only removes the item from future dropdowns."
      }
    ]
  },
  {
    id: "tips",
    title: "Tips & Best Practices",
    icon: Info,
    color: "bg-green-600",
    content: [
      {
        type: "heading", text: "Daily Workflow Recommendation"
      },
      {
        type: "steps",
        items: [
          "Morning: Use 'Copy Yesterday' in Plan vs Actual to pre-fill today's planned quantities, then adjust as needed.",
          "Morning: Create any required PTWs for the day's work activities before work starts.",
          "During shift: Log manpower headcount and observations as they occur.",
          "During shift: Advance PTW statuses as work progresses (Assigned → Checklist Completed → Authorized).",
          "End of day: Update all Actual quantities in Plan vs Actual.",
          "End of day: Close or cancel any active PTWs for completed work.",
          "Weekly: Use Export to download the master Excel sheet for reporting to management.",
        ]
      },
      {
        type: "heading", text: "Data Quality Tips"
      },
      {
        type: "list",
        items: [
          "Always enter actual quantities before end of shift — data entered the next day reduces accuracy.",
          "Use the Comments field in Plan vs Actual to capture context for any deviation.",
          "For Critical observations, assign a specific Action Owner and set a realistic Due Date.",
          "Close PTWs on the same day work is completed — do not leave permits in 'Active' status overnight.",
          "Set PTW templates in Admin before the project begins to ensure consistent checklist compliance.",
        ]
      },
      {
        type: "heading", text: "Escalation Guidelines"
      },
      {
        type: "table",
        headers: ["Issue Type", "When to Use", "Expected Response"],
        rows: [
          ["PH Issue", "Risks affecting project schedule, cost, or quality requiring Project Head decision", "Acknowledged within 24 hours"],
          ["DH Issue", "Strategic risks or unresolved PH issues requiring Delivery Head intervention", "Acknowledged within 4 hours for 'Immediate' urgency"],
          ["Critical Observation", "Immediate safety risk; work stoppage may be required", "Immediate action; close within 24 hours"],
        ]
      }
    ]
  }
];

export default function Manual() {
  const [openSection, setOpenSection] = useState(null);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 pt-10 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Book className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-medium text-blue-400 uppercase tracking-widest">iPeMS Field Ops</p>
            <h1 className="text-lg font-bold text-white">Operations Manual</h1>
            <p className="text-xs text-gray-400 mt-0.5">Version 1.0 · Field Reference Guide</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-2">
        {SECTIONS.map(section => (
          <SectionAccordion
            key={section.id}
            section={section}
            isOpen={openSection === section.id}
            onToggle={() => setOpenSection(openSection === section.id ? null : section.id)}
          />
        ))}
        <div className="pb-24" />
      </div>
    </div>
  );
}

function SectionAccordion({ section, isOpen, onToggle }) {
  const Icon = section.icon;
  return (
    <div className={`bg-gray-900 border rounded-2xl overflow-hidden transition-all ${isOpen ? "border-blue-700/60" : "border-gray-800"}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left active:bg-gray-800 transition-colors"
      >
        <div className={`w-9 h-9 ${section.color} rounded-xl flex items-center justify-center shrink-0`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-white flex-1">{section.title}</span>
        {isOpen ? <ChevronDown className="w-4 h-4 text-blue-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />}
      </button>
      {isOpen && (
        <div className="px-4 pb-5 space-y-4 border-t border-gray-800 pt-4">
          {section.content.map((block, i) => (
            <ContentBlock key={i} block={block} />
          ))}
        </div>
      )}
    </div>
  );
}

function ContentBlock({ block }) {
  switch (block.type) {
    case "intro":
      return <p className="text-sm text-gray-300 leading-relaxed">{block.text}</p>;

    case "para":
      return <p className="text-sm text-gray-300 leading-relaxed">{block.text}</p>;

    case "heading":
      return <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mt-2">{block.text}</h3>;

    case "note":
      return (
        <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl px-3 py-2.5 flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200 leading-relaxed">{block.text}</p>
        </div>
      );

    case "list":
      return (
        <ul className="space-y-2">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
              <span className="text-sm text-gray-300 leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      );

    case "steps":
      return (
        <ol className="space-y-2">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
              <span className="text-sm text-gray-300 leading-relaxed">{item}</span>
            </li>
          ))}
        </ol>
      );

    case "table":
      return (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                {block.headers.map((h, i) => (
                  <th key={i} className="text-left text-gray-400 font-semibold px-2 py-2 border-b border-gray-800 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? "" : "bg-gray-800/30"}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="text-gray-300 px-2 py-2 border-b border-gray-800/50 align-top leading-relaxed">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    default:
      return null;
  }
}