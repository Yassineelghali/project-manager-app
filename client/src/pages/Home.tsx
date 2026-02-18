import { useState, useEffect, useRef, useCallback } from "react";

// ─── MOCK DATA ──────────────────────────────────────────────────────────────

const INITIAL_PROJECTS = [
  {
    id: "p1", name: "Powertrain ECU", code: "ECU-24", color: "#00A8CC",
    date_from: "2024-01-01", date_to: "2025-12-31",
    subprojects: [
      { id: "sp1", name: "Torque Management", projectId: "p1" },
      { id: "sp2", name: "Fuel Control", projectId: "p1" },
    ]
  },
  {
    id: "p2", name: "ADAS Integration", code: "ADAS-25", color: "#2E5EAA",
    date_from: "2025-01-01", date_to: "2026-06-30",
    subprojects: [
      { id: "sp3", name: "Sensor Fusion", projectId: "p2" },
      { id: "sp4", name: "Path Planning", projectId: "p2" },
    ]
  }
];

const INITIAL_COLLABORATORS = [
  { id: "c1", name: "Yassine Mansouri", initials: "YM", subprojectId: "sp1", date_from: "2024-01-01", date_to: "2025-12-31" },
  { id: "c2", name: "Inès Boudali", initials: "IB", subprojectId: "sp2", date_from: "2024-03-01", date_to: "2025-12-31" },
  { id: "c3", name: "Karim Sefrioui", initials: "KS", subprojectId: "sp3", date_from: "2025-01-01", date_to: "2026-06-30" },
  { id: "c4", name: "Lina Ouhabi", initials: "LO", subprojectId: "sp4", date_from: "2025-01-01", date_to: "2026-06-30" },
];

const INITIAL_MEETINGS = [
  {
    id: "m1", projectId: "p1", date: "2025-02-10", title: "Weekly Sync #8",
    sections: {
      c1: {
        current: [
          { id: "t1", title: "DGO torque arbitration", description: "Calibration of torque demand priority between driver and safety layers", status: "Ongoing", deadline: "2025-02-14" },
          { id: "t2", title: "CAN signal mapping", description: "Map new ECU signals to torque management module", status: "Open", deadline: "2025-02-17" },
        ],
        upcoming: [
          { id: "t3", title: "Validation test plan", description: "Prepare HIL test cases for torque limiter", status: "Open", deadline: "2025-02-28" },
        ],
        openPoints: [
          { id: "op1", title: "Arbitration strategy alignment", description: "Waiting for System team decision on priority logic – impacts DGO delivery", status: "Open", deadline: null },
        ],
        closed: [
          { id: "t4", title: "Spec review v1.2", description: "Reviewed and approved", status: "Closed", deadline: "2025-02-05" },
        ],
        outside: []
      },
      c2: {
        current: [
          { id: "t5", title: "Lambda correction model", description: "Update enrichment model based on bench tests", status: "Ongoing", deadline: "2025-02-20" },
        ],
        upcoming: [],
        openPoints: [],
        closed: [],
        outside: [
          { id: "t6", title: "TSB documentation", description: "Supporting warranty team — outside fuel control scope", status: "Open", deadline: null },
        ]
      }
    }
  }
];

const SECTION_KEYS = ["current", "upcoming", "openPoints", "closed", "outside"];
const SECTION_LABELS = {
  current: "Current Tasks",
  upcoming: "Upcoming Tasks",
  openPoints: "Open Points",
  closed: "Closed Tasks",
  outside: "Tasks Outside Project"
};
const SECTION_ICONS = {
  current: "◈", upcoming: "◷", openPoints: "◉", closed: "✓", outside: "◌"
};

const STATUS_META = {
  Open:    { color: "#4A9EFF", bg: "rgba(74,158,255,0.12)", label: "Open" },
  Ongoing: { color: "#FF9B3D", bg: "rgba(255,155,61,0.12)", label: "Ongoing" },
  Standby: { color: "#B8A0FF", bg: "rgba(184,160,255,0.12)", label: "Standby" },
  Closed:  { color: "#4EC99A", bg: "rgba(78,201,154,0.12)", label: "Closed" },
};

// ─── DEPARTMENTS & TEAMS ────────────────────────────────────────────────────

const DEPARTMENTS_TEAMS = {
  ESW: { name: "ESW", teams: ["EE", "DAI", "SW Coding", "SMBD"] },
  VSP: { name: "VSP", teams: ["CT1", "CT2", "CT3", "SD1", "SD2", "VAH"] },
  MDS: { name: "MDS", teams: ["SD", "MS", "CD&I"] }
};

const AVL_LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310419663030990083/MraiIlghFkQrjJjT.png";

function genId() { return Math.random().toString(36).slice(2, 9); }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—"; }
function today() { return new Date().toISOString().slice(0, 10); }

// ─── STYLES ─────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;600;700;800&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --mono: 'DM Mono', monospace;
    --sans: 'IBM Plex Sans', sans-serif;
    --display: 'Syne', sans-serif;
  }

  /* DARK THEME */
  [data-theme="dark"] {
    --bg: #0A1628;
    --bg2: #0F1E35;
    --bg3: #162945;
    --bg4: #1D3557;
    --border: rgba(100,180,220,0.15);
    --border2: rgba(100,180,220,0.25);
    --text: #E8F4F8;
    --text2: #A8CDE0;
    --text3: #6B92AC;
    --accent: #00A8CC;
    --accent2: #00C9F2;
    --accent-hover: #0096B8;
    --green: #1DD3B0;
    --blue: #64B4DC;
    --turquoise: #1DD3B0;
    --cobalt: #2E5EAA;
    --card-shadow: rgba(0,0,0,0.3);
  }

  /* LIGHT THEME */
  [data-theme="light"] {
    --bg: #FFFFFF;
    --bg2: #F6FBFD;
    --bg3: #EDF6FA;
    --bg4: #E0EFF7;
    --border: rgba(0,168,204,0.12);
    --border2: rgba(0,168,204,0.2);
    --text: #0D1F2D;
    --text2: #3D5A6C;
    --text3: #7896A8;
    --accent: #00A8CC;
    --accent2: #00C9F2;
    --accent-hover: #0096B8;
    --green: #1DD3B0;
    --blue: #64B4DC;
    --turquoise: #1DD3B0;
    --cobalt: #2E5EAA;
    --card-shadow: rgba(0,168,204,0.08);
  }

  html, body, #root { height: 100%; background: var(--bg); color: var(--text); font-family: var(--sans); font-size: 14px; }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

  .app { display: flex; height: 100vh; overflow: hidden; }

  /* ── SIDEBAR ── */
  .sidebar {
    width: 220px; min-width: 220px; background: var(--bg2);
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column;
    padding: 0; overflow: hidden;
  }
  .sidebar-logo {
    padding: 20px 18px 16px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 10px;
  }
  .logo-mark {
    width: 28px; height: 28px; background: var(--accent);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--display); font-weight: 800; font-size: 13px;
    color: white; letter-spacing: -0.5px; flex-shrink: 0;
  }
  .logo-text { font-family: var(--display); font-weight: 700; font-size: 14px; letter-spacing: -0.3px; }
  .logo-sub { font-size: 10px; color: var(--text3); font-family: var(--mono); margin-top: 1px; }
  .sidebar-nav { flex: 1; padding: 12px 0; overflow-y: auto; }
  .nav-section-title {
    padding: 8px 18px 4px;
    font-size: 9px; font-family: var(--mono);
    color: var(--text3); letter-spacing: 1.5px; text-transform: uppercase;
  }
  .nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 18px; cursor: pointer;
    font-size: 13px; color: var(--text2);
    border-left: 2px solid transparent;
    transition: all 0.15s;
  }
  .nav-item:hover { color: var(--text); background: rgba(255,255,255,0.03); }
  .nav-item.active { color: var(--text); background: rgba(0,168,204,0.12); border-left-color: var(--accent); }
  .nav-icon { font-size: 14px; opacity: 0.7; width: 16px; text-align: center; }
  .sidebar-user {
    padding: 14px 18px; border-top: 1px solid var(--border);
    display: flex; align-items: center; gap: 10px;
  }
  .avatar {
    width: 28px; height: 28px; border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--mono); font-size: 10px; font-weight: 500;
    flex-shrink: 0;
  }
  .user-name { font-size: 12px; font-weight: 500; }
  .user-role { font-size: 10px; color: var(--text3); font-family: var(--mono); }

  /* ── MAIN ── */
  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

  .topbar {
    height: 52px; background: var(--bg2); border-bottom: 1px solid var(--border);
    display: flex; align-items: center; padding: 0 24px; gap: 16px; flex-shrink: 0;
  }
  .topbar-title { font-family: var(--display); font-weight: 700; font-size: 16px; }
  .topbar-sep { width: 1px; height: 18px; background: var(--border2); }
  .topbar-meta { font-size: 12px; color: var(--text3); font-family: var(--mono); }
  .topbar-actions { margin-left: auto; display: flex; align-items: center; gap: 8px; }

  .btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 14px; border-radius: 4px; border: none; cursor: pointer;
    font-family: var(--sans); font-size: 12px; font-weight: 500;
    transition: all 0.15s; white-space: nowrap;
  }
  .btn-primary { background: var(--accent); color: white; }
  .btn-primary:hover { background: var(--accent2); }
  .btn-ghost { background: transparent; color: var(--text2); border: 1px solid var(--border2); }
  .btn-ghost:hover { color: var(--text); border-color: rgba(255,255,255,0.25); background: rgba(255,255,255,0.04); }
  .btn-danger { background: transparent; color: #FF5555; border: 1px solid rgba(255,85,85,0.25); }
  .btn-danger:hover { background: rgba(255,85,85,0.08); }
  .btn-sm { padding: 4px 10px; font-size: 11px; }
  .btn-xs { padding: 2px 8px; font-size: 10px; }

  .notif-bell {
    position: relative; width: 32px; height: 32px; display: flex;
    align-items: center; justify-content: center; cursor: pointer;
    border-radius: 4px; transition: background 0.15s;
    background: transparent; border: 1px solid var(--border2); color: var(--text2);
    font-size: 15px;
  }
  .notif-bell:hover { background: rgba(255,255,255,0.05); color: var(--text); }
  .notif-badge {
    position: absolute; top: 4px; right: 4px; width: 8px; height: 8px;
    background: var(--accent); border-radius: 50%; border: 1.5px solid var(--bg2);
  }

  /* ── CONTENT ── */
  .content { flex: 1; overflow-y: auto; padding: 24px; }

  /* ── DASHBOARD ── */
  .dash-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px; background: var(--border); border: 1px solid var(--border); margin-bottom: 24px; }
  .stat-card { background: var(--bg2); padding: 20px 24px; }
  .stat-label { font-size: 10px; font-family: var(--mono); color: var(--text3); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }
  .stat-value { font-family: var(--display); font-size: 32px; font-weight: 800; color: var(--text); line-height: 1; }
  .stat-sub { font-size: 11px; color: var(--text3); margin-top: 6px; }

  .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .section-title { font-family: var(--display); font-weight: 700; font-size: 15px; }
  
  .project-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; margin-bottom: 24px; }
  .project-card {
    background: var(--bg2); border: 1px solid var(--border);
    padding: 16px 18px; cursor: pointer; transition: border-color 0.15s;
    position: relative; overflow: hidden;
  }
  .project-card::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
    background: var(--card-color, var(--accent));
  }
  .project-card:hover { border-color: var(--border2); }
  .project-card-code { font-family: var(--mono); font-size: 10px; color: var(--text3); margin-bottom: 4px; }
  .project-card-name { font-family: var(--display); font-weight: 700; font-size: 15px; margin-bottom: 8px; }
  .project-card-meta { font-size: 11px; color: var(--text2); display: flex; gap: 12px; }

  .notif-list { display: flex; flex-direction: column; gap: 1px; background: var(--border); border: 1px solid var(--border); }
  .notif-item {
    background: var(--bg2); padding: 12px 16px;
    display: flex; align-items: flex-start; gap: 12px;
  }
  .notif-item.unread { background: rgba(0,168,204,0.08); }
  .notif-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); margin-top: 5px; flex-shrink: 0; }
  .notif-dot.read { background: var(--bg4); }
  .notif-text { flex: 1; font-size: 12px; color: var(--text2); line-height: 1.5; }
  .notif-text strong { color: var(--text); font-weight: 500; }
  .notif-time { font-size: 10px; color: var(--text3); font-family: var(--mono); white-space: nowrap; }

  /* ── PROJECTS TAB ── */
  .scope-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .panel { background: var(--bg2); border: 1px solid var(--border); }
  .panel-head { padding: 12px 16px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
  .panel-title { font-family: var(--mono); font-size: 11px; font-weight: 500; color: var(--text2); letter-spacing: 0.5px; text-transform: uppercase; }
  .panel-body { padding: 12px; }

  .tree-item { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 3px; cursor: pointer; transition: background 0.1s; }
  .tree-item:hover { background: rgba(255,255,255,0.04); }
  .tree-item.selected { background: rgba(0,168,204,0.15); }
  .tree-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .tree-name { font-size: 13px; flex: 1; }
  .tree-badge { font-family: var(--mono); font-size: 10px; color: var(--text3); }
  .tree-sub { padding-left: 18px; }
  .tree-sub .tree-item { padding: 4px 8px; }
  .tree-sub .tree-name { font-size: 12px; color: var(--text2); }

  .collab-row {
    display: flex; align-items: center; gap: 10px; padding: 8px 10px;
    border: 1px solid var(--border); margin-bottom: 6px; background: var(--bg3);
    transition: border-color 0.15s;
  }
  .collab-row:hover { border-color: var(--border2); }
  .collab-info { flex: 1; }
  .collab-name { font-size: 13px; font-weight: 500; }
  .collab-sub { font-size: 10px; font-family: var(--mono); color: var(--text3); margin-top: 1px; }
  .collab-dates { font-size: 10px; font-family: var(--mono); color: var(--text3); text-align: right; }

  /* ── MEETING PAGE ── */
  .meeting-header {
    background: var(--bg2); border: 1px solid var(--border);
    padding: 20px 24px; margin-bottom: 16px;
    display: flex; align-items: flex-start; justify-content: space-between;
  }
  .meeting-title { font-family: var(--display); font-size: 22px; font-weight: 800; margin-bottom: 4px; }
  .meeting-meta { font-family: var(--mono); font-size: 11px; color: var(--text3); display: flex; gap: 16px; }
  .meeting-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 10px; background: rgba(0,168,204,0.15);
    border: 1px solid rgba(0,168,204,0.35); font-size: 11px; font-family: var(--mono);
  }
  .meeting-badge-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); }

  .collab-section {
    border: 1px solid var(--border); margin-bottom: 12px; background: var(--bg2);
  }
  .collab-section-head {
    padding: 12px 16px; display: flex; align-items: center; gap: 12px;
    border-bottom: 1px solid var(--border); cursor: pointer;
    transition: background 0.15s; user-select: none;
  }
  .collab-section-head:hover { background: rgba(255,255,255,0.02); }
  .collab-avatar { width: 32px; height: 32px; border-radius: 4px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-family: var(--mono); font-size: 11px; font-weight: 500; }
  .collab-section-name { font-family: var(--display); font-weight: 700; font-size: 14px; flex: 1; }
  .collab-section-counts { display: flex; gap: 8px; }
  .count-chip {
    font-family: var(--mono); font-size: 10px; padding: 2px 7px;
    background: var(--bg4); color: var(--text3); border-radius: 2px;
  }
  .count-chip.active { color: var(--accent); background: rgba(0,168,204,0.15); }
  .expand-arrow { font-size: 12px; color: var(--text3); transition: transform 0.2s; }
  .expand-arrow.open { transform: rotate(90deg); }

  .subsections { padding: 12px; display: flex; flex-direction: column; gap: 8px; }

  .subsection { border: 1px solid var(--border); }
  .subsection-head {
    padding: 8px 12px; display: flex; align-items: center; gap: 8px;
    background: var(--bg3); cursor: pointer; user-select: none;
  }
  .subsection-icon { font-size: 13px; color: var(--text3); width: 16px; text-align: center; }
  .subsection-label { font-size: 12px; font-weight: 600; font-family: var(--mono); text-transform: uppercase; letter-spacing: 0.5px; flex: 1; }
  .subsection-count { font-family: var(--mono); font-size: 10px; color: var(--text3); }
  .add-task-btn {
    opacity: 0; margin-left: auto; transition: opacity 0.15s;
    font-size: 11px; padding: 2px 8px;
    background: transparent; border: 1px solid var(--border2); color: var(--text3);
    cursor: pointer; border-radius: 2px;
  }
  .subsection-head:hover .add-task-btn { opacity: 1; }
  .add-task-btn:hover { color: var(--text); border-color: var(--accent); }

  .tasks-list { padding: 6px; display: flex; flex-direction: column; gap: 4px; background: var(--bg2); }

  .task-card {
    background: var(--bg3); border: 1px solid var(--border);
    padding: 10px 12px; display: flex; align-items: flex-start; gap: 10px;
    transition: border-color 0.15s, transform 0.1s;
    cursor: pointer;
  }
  .task-card:hover { border-color: var(--border2); transform: translateX(1px); }
  .task-card.dragging { opacity: 0.5; }
  .task-main { flex: 1; min-width: 0; }
  .task-title { font-size: 13px; font-weight: 500; margin-bottom: 3px; }
  .task-desc { font-size: 11px; color: var(--text2); line-height: 1.4; margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .task-footer { display: flex; align-items: center; gap: 8px; }
  .status-pill {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 8px; border-radius: 2px; font-size: 10px; font-family: var(--mono);
    font-weight: 500;
  }
  .status-dot { width: 4px; height: 4px; border-radius: 50%; }
  .deadline-tag { font-size: 10px; font-family: var(--mono); color: var(--text3); }
  .deadline-tag.overdue { color: #FF5555; }
  .drag-handle { color: var(--text3); cursor: grab; font-size: 13px; padding: 2px; opacity: 0.4; transition: opacity 0.15s; }
  .task-card:hover .drag-handle { opacity: 0.8; }

  /* empty state */
  .empty-subsection { padding: 12px; text-align: center; font-size: 11px; color: var(--text3); font-family: var(--mono); background: var(--bg2); }

  /* ── MODAL ── */
  .overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100;
    display: flex; align-items: center; justify-content: center; padding: 20px;
    backdrop-filter: blur(2px);
  }
  .modal {
    background: var(--bg2); border: 1px solid var(--border2);
    width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto;
    box-shadow: 0 24px 80px rgba(0,0,0,0.5);
  }
  .modal-head {
    padding: 18px 20px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .modal-title { font-family: var(--display); font-weight: 700; font-size: 16px; }
  .modal-close { background: none; border: none; color: var(--text3); cursor: pointer; font-size: 18px; line-height: 1; transition: color 0.15s; }
  .modal-close:hover { color: var(--text); }
  .modal-body { padding: 20px; }
  .modal-footer { padding: 16px 20px; border-top: 1px solid var(--border); display: flex; gap: 8px; justify-content: flex-end; }

  .form-group { margin-bottom: 16px; }
  .form-label { display: block; font-size: 11px; font-family: var(--mono); color: var(--text3); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
  .form-input, .form-select, .form-textarea {
    width: 100%; background: var(--bg3); border: 1px solid var(--border2);
    color: var(--text); font-family: var(--sans); font-size: 13px;
    padding: 8px 10px; outline: none; transition: border-color 0.15s;
    border-radius: 0;
  }
  .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--accent); }
  .form-textarea { resize: vertical; min-height: 80px; }
  .form-select option { background: var(--bg3); }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  /* ── TASK DETAIL ── */
  .task-detail-field { margin-bottom: 14px; }
  .detail-label { font-size: 10px; font-family: var(--mono); color: var(--text3); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 5px; }
  .detail-value { font-size: 13px; }
  .detail-divider { height: 1px; background: var(--border); margin: 16px 0; }

  .history-entry { display: flex; gap: 10px; margin-bottom: 10px; }
  .history-line { display: flex; flex-direction: column; align-items: center; }
  .history-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--border2); flex-shrink: 0; margin-top: 3px; }
  .history-connector { width: 1px; flex: 1; background: var(--border); margin: 3px 0; }
  .history-text { font-size: 11px; color: var(--text2); line-height: 1.5; }
  .history-time { font-size: 10px; font-family: var(--mono); color: var(--text3); margin-top: 2px; }

  /* ── NOTIFICATIONS TAB ── */
  .notif-tab-item {
    padding: 14px 16px; border-bottom: 1px solid var(--border);
    display: flex; gap: 14px; align-items: flex-start;
    transition: background 0.15s; cursor: pointer;
  }
  .notif-tab-item:hover { background: rgba(255,255,255,0.02); }
  .notif-tab-item.unread { background: rgba(0,168,204,0.06); }
  .notif-tab-icon { width: 32px; height: 32px; border-radius: 4px; background: var(--bg4); display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
  .notif-tab-body { flex: 1; }
  .notif-tab-text { font-size: 12px; color: var(--text2); line-height: 1.5; }
  .notif-tab-text strong { color: var(--text); }
  .notif-tab-meta { font-size: 10px; font-family: var(--mono); color: var(--text3); margin-top: 4px; display: flex; gap: 12px; }

  /* ── MEETINGS LIST ── */
  .meeting-list-item {
    background: var(--bg2); border: 1px solid var(--border);
    padding: 14px 18px; margin-bottom: 8px; display: flex; align-items: center; gap: 16px;
    cursor: pointer; transition: border-color 0.15s;
  }
  .meeting-list-item:hover { border-color: var(--border2); }
  .meeting-list-date { font-family: var(--mono); font-size: 11px; color: var(--text3); width: 80px; }
  .meeting-list-title { font-family: var(--display); font-weight: 700; font-size: 14px; flex: 1; }
  .meeting-list-project { font-size: 11px; color: var(--text2); }
  .meeting-list-stats { display: flex; gap: 8px; }

  /* ── VIEW SWITCHER ── */
  .view-switcher { display: flex; border: 1px solid var(--border2); }
  .view-btn { padding: 5px 12px; font-size: 11px; font-family: var(--mono); background: transparent; color: var(--text3); border: none; cursor: pointer; transition: all 0.15s; border-right: 1px solid var(--border2); }
  .view-btn:last-child { border-right: none; }
  .view-btn.active { background: var(--accent); color: white; }
  .view-btn:hover:not(.active) { background: rgba(255,255,255,0.04); color: var(--text); }

  /* ── TAGS ── */
  .tag { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; background: var(--bg4); border: 1px solid var(--border); font-size: 10px; font-family: var(--mono); color: var(--text3); border-radius: 2px; }

  /* ── MISC ── */
  .empty-state { text-align: center; padding: 40px 20px; color: var(--text3); }
  .empty-state-icon { font-size: 32px; margin-bottom: 12px; opacity: 0.4; }
  .empty-state-text { font-size: 13px; }
  .inline-edit { background: transparent; border: none; border-bottom: 1px solid transparent; color: inherit; font: inherit; outline: none; width: 100%; transition: border-color 0.15s; padding: 1px 0; }
  .inline-edit:focus { border-bottom-color: var(--accent); }
  
  .scope-collab-list { padding: 12px; max-height: 400px; overflow-y: auto; }
  .chip { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border: 1px solid var(--border2); font-size: 10px; font-family: var(--mono); color: var(--text2); background: var(--bg3); border-radius: 2px; }

  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  
  /* drop zone */
  .drop-zone { border: 1px dashed var(--accent) !important; background: rgba(0,168,204,0.08) !important; }

  /* ── LOGIN SCREEN ── */
  .login-screen {
    min-height: 100vh; display: flex; background: var(--bg);
    position: relative; overflow: hidden;
  }
  .login-left {
    width: 420px; min-width: 420px; background: var(--bg2);
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column; justify-content: center;
    padding: 60px 48px; position: relative; z-index: 2;
  }
  .login-right {
    flex: 1; display: flex; align-items: center; justify-content: center;
    position: relative; overflow: hidden;
  }
  .login-bg-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(0,168,204,0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,168,204,0.08) 1px, transparent 1px);
    background-size: 40px 40px;
  }
  .login-bg-glow {
    position: absolute; width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(0,168,204,0.12) 0%, transparent 70%);
    top: 50%; left: 50%; transform: translate(-50%,-50%);
    pointer-events: none;
  }
  .login-right-content {
    position: relative; z-index: 2; text-align: center; padding: 40px;
  }
  .login-right-label {
    font-family: var(--mono); font-size: 10px; color: var(--text3);
    letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px;
  }
  .login-right-title {
    font-family: var(--display); font-size: 48px; font-weight: 800;
    line-height: 1.1; color: var(--text); margin-bottom: 16px;
  }
  .login-right-title span { color: var(--accent); }
  .login-right-desc { font-size: 14px; color: var(--text3); max-width: 340px; line-height: 1.6; }
  .login-features { margin-top: 40px; display: flex; flex-direction: column; gap: 12px; text-align: left; max-width: 300px; }
  .login-feature {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 16px; background: rgba(255,255,255,0.03);
    border: 1px solid var(--border);
  }
  .login-feature-icon { font-size: 16px; width: 20px; text-align: center; }
  .login-feature-text { font-size: 12px; color: var(--text2); }

  .login-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 40px; }
  .login-logo-mark {
    width: 36px; height: 36px; background: var(--accent);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--display); font-weight: 800; font-size: 16px; color: white;
  }
  .login-logo-name { font-family: var(--display); font-weight: 800; font-size: 20px; }
  .login-logo-sub { font-size: 10px; color: var(--text3); font-family: var(--mono); margin-top: 2px; }

  .login-title { font-family: var(--display); font-weight: 800; font-size: 24px; margin-bottom: 6px; }
  .login-subtitle { font-size: 13px; color: var(--text3); margin-bottom: 36px; }

  .login-divider {
    display: flex; align-items: center; gap: 12px; margin: 20px 0;
    font-size: 11px; color: var(--text3); font-family: var(--mono);
  }
  .login-divider::before, .login-divider::after {
    content: ''; flex: 1; height: 1px; background: var(--border);
  }

  .demo-accounts { margin-top: 24px; }
  .demo-label { font-size: 10px; font-family: var(--mono); color: var(--text3); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px; }
  .demo-card {
    padding: 10px 12px; border: 1px solid var(--border); background: var(--bg3);
    cursor: pointer; transition: border-color 0.15s; margin-bottom: 6px;
    display: flex; align-items: center; gap: 10px;
  }
  .demo-card:hover { border-color: var(--accent); background: rgba(0,168,204,0.08); }
  .demo-card-info { flex: 1; }
  .demo-card-name { font-size: 12px; font-weight: 500; }
  .demo-card-role { font-size: 10px; font-family: var(--mono); color: var(--text3); margin-top: 2px; }
  .demo-card-creds { font-size: 10px; font-family: var(--mono); color: var(--text3); text-align: right; }
  .demo-arrow { color: var(--text3); font-size: 12px; }

  .login-error {
    padding: 10px 12px; background: rgba(255,85,85,0.08);
    border: 1px solid rgba(255,85,85,0.25); color: #FF7A7A;
    font-size: 12px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;
  }

  /* ── USER MENU ── */
  .user-menu-wrap { position: relative; }
  .sidebar-user-btn {
    padding: 12px 16px; border-top: 1px solid var(--border);
    display: flex; align-items: center; gap: 10px;
    cursor: pointer; transition: background 0.15s; width: 100%;
    background: transparent; border-left: none; border-right: none; border-bottom: none;
    color: var(--text);
  }
  .sidebar-user-btn:hover { background: rgba(255,255,255,0.03); }
  .user-chevron { margin-left: auto; font-size: 10px; color: var(--text3); transition: transform 0.2s; }
  .user-chevron.open { transform: rotate(180deg); }

  .user-dropdown {
    position: absolute; bottom: calc(100% + 4px); left: 8px; right: 8px;
    background: var(--bg3); border: 1px solid var(--border2);
    box-shadow: 0 -16px 40px rgba(0,0,0,0.4); z-index: 200; overflow: hidden;
    animation: slideUp 0.15s ease;
  }
  @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .user-dropdown-header {
    padding: 14px 14px 12px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 10px;
  }
  .user-dropdown-name { font-size: 13px; font-weight: 600; }
  .user-dropdown-email { font-size: 10px; font-family: var(--mono); color: var(--text3); margin-top: 1px; }
  .user-dropdown-role-badge {
    margin-left: auto; font-size: 9px; font-family: var(--mono); padding: 2px 7px;
    border: 1px solid; border-radius: 2px;
  }
  .dropdown-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 14px; cursor: pointer; transition: background 0.12s;
    font-size: 12px; color: var(--text2); border: none; background: none;
    width: 100%; text-align: left;
  }
  .dropdown-item:hover { background: rgba(255,255,255,0.04); color: var(--text); }
  .dropdown-item.danger { color: #FF7070; }
  .dropdown-item.danger:hover { background: rgba(255,85,85,0.07); color: #FF5555; }
  .dropdown-item-icon { width: 16px; text-align: center; font-size: 13px; opacity: 0.7; }
  .dropdown-divider { height: 1px; background: var(--border); margin: 4px 0; }

  /* ── THEME TOGGLE ── */
  .theme-toggle {
    display: flex; align-items: center; gap: 8px; padding: 9px 14px;
    font-size: 12px; color: var(--text2); justify-content: space-between;
  }
  .theme-toggle-label { display: flex; align-items: center; gap: 10px; }
  .theme-switch {
    position: relative; width: 42px; height: 22px; background: var(--bg4);
    border-radius: 11px; cursor: pointer; transition: background 0.2s;
    border: 1px solid var(--border2);
  }
  .theme-switch-slider {
    position: absolute; left: 2px; top: 2px; width: 16px; height: 16px;
    background: var(--text); border-radius: 50%; transition: transform 0.2s;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  .theme-switch.active { background: var(--accent); border-color: var(--accent); }
  .theme-switch.active .theme-switch-slider { transform: translateX(20px); background: white; }

  /* ── ACCOUNT MODAL ── */
  .account-section { margin-bottom: 24px; }
  .account-section-title {
    font-size: 10px; font-family: var(--mono); color: var(--text3);
    text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;
    padding-bottom: 8px; border-bottom: 1px solid var(--border);
  }
  .account-avatar-row {
    display: flex; align-items: center; gap: 16px; margin-bottom: 20px;
  }
  .account-avatar-big {
    width: 56px; height: 56px; border-radius: 6px; display: flex;
    align-items: center; justify-content: center;
    font-family: var(--mono); font-size: 18px; font-weight: 600;
    flex-shrink: 0;
  }
  .account-avatar-info { flex: 1; }
  .account-name-big { font-family: var(--display); font-weight: 700; font-size: 18px; }
  .account-role-badge {
    display: inline-flex; align-items: center; gap: 6px;
    margin-top: 4px; font-size: 11px; font-family: var(--mono);
    padding: 2px 9px; border: 1px solid; border-radius: 2px;
  }
  .account-field {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 0; border-bottom: 1px solid var(--border);
  }
  .account-field:last-child { border-bottom: none; }
  .account-field-label { font-size: 11px; color: var(--text3); font-family: var(--mono); }
  .account-field-value { font-size: 13px; color: var(--text); }
  .account-stat-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); }
  .account-stat { background: var(--bg3); padding: 14px; }
  .account-stat-val { font-family: var(--display); font-weight: 800; font-size: 22px; }
  .account-stat-lbl { font-size: 10px; font-family: var(--mono); color: var(--text3); margin-top: 3px; }
  .account-activity { display: flex; flex-direction: column; gap: 6px; }
  .account-activity-item {
    display: flex; align-items: center; gap: 10px; padding: 8px 10px;
    background: var(--bg3); border: 1px solid var(--border); font-size: 12px; color: var(--text2);
  }
  .activity-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
  .activity-time { margin-left: auto; font-size: 10px; font-family: var(--mono); color: var(--text3); }
`;

// ─── USERS DATABASE (mock) ───────────────────────────────────────────────────

const USERS_DB = [
  { id: "tl1", name: "Marie Leclerc", initials: "ML", email: "m.leclerc@weektrack.io", role: "TL", password: "tl1234", color: "#00A8CC", department: "Engineering", team: "Powertrain Team", joinDate: "2023-06-01", collabId: null },
  { id: "tl2", name: "Thomas Bernard", initials: "TB", email: "t.bernard@weektrack.io", role: "TL", password: "tl5678", color: "#2E5EAA", department: "Engineering", team: "ADAS Team", joinDate: "2022-11-15", collabId: null },
  { id: "c1",  name: "Yassine Mansouri", initials: "YM", email: "y.mansouri@weektrack.io", role: "Collaborator", password: "collab1", color: "#64B4DC", department: "Powertrain ECU", team: "Powertrain Team", joinDate: "2024-01-15", collabId: "c1" },
  { id: "c2",  name: "Inès Boudali", initials: "IB", email: "i.boudali@weektrack.io", role: "Collaborator", password: "collab2", color: "#1DD3B0", department: "Powertrain ECU", team: "Powertrain Team", joinDate: "2024-03-05", collabId: "c2" },
  { id: "c3",  name: "Karim Sefrioui", initials: "KS", email: "k.sefrioui@weektrack.io", role: "Collaborator", password: "collab3", color: "#2E5EAA", department: "ADAS Integration", team: "ADAS Team", joinDate: "2025-01-10", collabId: "c3" },
  { id: "c4",  name: "Lina Ouhabi", initials: "LO", email: "l.ouhabi@weektrack.io", role: "Collaborator", password: "collab4", color: "#64B4DC", department: "ADAS Integration", team: "ADAS Team", joinDate: "2025-01-20", collabId: "c4" },
];

// ─── LOGIN SCREEN ────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState("login"); // "login" or "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Signup fields
  const [signupForm, setSignupForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    role: "Collaborator", department: "", team: "", color: "#64B4DC"
  });

  function handleLogin(e) {
    e && e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      const user = USERS_DB.find(u => u.email === email && u.password === password);
      if (user) { onLogin(user); }
      else { setError("Identifiants incorrects. Vérifiez votre email et mot de passe."); }
      setLoading(false);
    }, 600);
  }

  function handleSignup(e) {
    e && e.preventDefault();
    setError("");
    
    // Validation
    if (!signupForm.name || !signupForm.email || !signupForm.password || !signupForm.team) {
      setError("Tous les champs obligatoires doivent être remplis");
      return;
    }
    if (signupForm.password !== signupForm.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (signupForm.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    if (USERS_DB.find(u => u.email === signupForm.email)) {
      setError("Cet email est déjà utilisé");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const initials = signupForm.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
      const newUser = {
        id: genId(),
        name: signupForm.name,
        initials,
        email: signupForm.email,
        password: signupForm.password,
        role: signupForm.role,
        color: signupForm.color,
        department: signupForm.department || "General",
        team: signupForm.team,
        joinDate: today(),
        collabId: signupForm.role === "Collaborator" ? genId() : null
      };
      USERS_DB.push(newUser);
      onLogin(newUser);
      setLoading(false);
    }, 600);
  }

  function quickLogin(user) {
    setEmail(user.email);
    setPassword(user.password);
    setError("");
    setLoading(true);
    setTimeout(() => { onLogin(user); setLoading(false); }, 400);
  }

  return (
    <div className="login-screen">
      {/* LEFT PANEL */}
      <div className="login-left">
        <div className="login-logo">
          <div style={{ 
            width: 140, 
            height: 66, 
            background: 'linear-gradient(135deg, #00578A 0%, #0073B3 100%)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            borderRadius: 6,
            boxShadow: '0 4px 16px rgba(0,87,138,0.4)'
          }}>
            <svg viewBox="0 0 200 80" width="125" height="60">
              <defs>
                <filter id="glow-login">
                  <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <text x="10" y="55" fontFamily="'Arial Black', sans-serif" fontSize="48" fontWeight="900" fill="white" filter="url(#glow-login)">AVL</text>
              <circle cx="140" cy="22" r="7" fill="white" opacity="0.9" />
              <circle cx="160" cy="28" r="6" fill="white" opacity="0.85" />
              <circle cx="180" cy="20" r="5.5" fill="white" opacity="0.8" />
              <circle cx="155" cy="42" r="6.5" fill="white" opacity="0.9" />
              <circle cx="172" cy="38" r="5.8" fill="white" opacity="0.85" />
            </svg>
          </div>
          <div>
            <div className="login-logo-name">AVL Team Meeting</div>
            <div className="login-logo-sub">Weekly Meeting Tracker v1.0</div>
          </div>
        </div>

        <div className="login-title">{mode === "login" ? "Connexion" : "Créer un compte"}</div>
        <div className="login-subtitle">{mode === "login" ? "Accédez à votre espace de suivi hebdomadaire" : "Rejoignez votre équipe AVL"}</div>

        {error && (
          <div className="login-error">
            <span>⚠</span> {error}
          </div>
        )}

        {mode === "login" ? (
          <>
            <div className="form-group">
              <label className="form-label">Adresse email</label>
              <input
                className="form-input"
                type="email"
                placeholder="prenom.nom@avl.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                autoFocus
              />
            </div>
            <div className="form-group" style={{ position: "relative" }}>
              <label className="form-label">Mot de passe</label>
              <div style={{ position: "relative" }}>
                <input
                  className="form-input"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  style={{ paddingRight: 40 }}
                />
                <button
                  onClick={() => setShowPass(s => !s)}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 14 }}
                >{showPass ? "🙈" : "👁"}</button>
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "10px", fontSize: 13, marginTop: 4 }}
              onClick={handleLogin}
              disabled={loading || !email || !password}
            >
              {loading ? "Connexion…" : "Se connecter →"}
            </button>

            <div style={{ textAlign: "center", margin: "16px 0", fontSize: 12, color: "var(--text3)" }}>
              Pas encore de compte ? <button onClick={() => setMode("signup")} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", textDecoration: "underline", fontSize: 12 }}>Créer un compte</button>
            </div>

            <div className="login-divider">comptes demo</div>

            <div className="demo-label">Cliquez pour vous connecter rapidement</div>
            <div className="demo-accounts">
              {USERS_DB.slice(0, 6).map(u => (
                <div key={u.id} className="demo-card" onClick={() => quickLogin(u)}>
                  <div className="avatar" style={{ width: 30, height: 30, background: u.color + "22", color: u.color, border: `1.5px solid ${u.color}44`, fontSize: 10, fontFamily: "var(--mono)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {u.initials}
                  </div>
                  <div className="demo-card-info">
                    <div className="demo-card-name">{u.name}</div>
                    <div className="demo-card-role">{u.role} · {u.team}</div>
                  </div>
                  <div className="demo-card-creds">
                    <div style={{ fontSize: 10 }}>{u.email}</div>
                    <div style={{ color: "var(--text3)" }}>••• {u.password.slice(-2)}</div>
                  </div>
                  <div className="demo-arrow">→</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="form-group">
              <label className="form-label">Nom complet *</label>
              <input className="form-input" value={signupForm.name} onChange={e => setSignupForm(f => ({ ...f, name: e.target.value }))} placeholder="Jean Dupont" />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-input" type="email" value={signupForm.email} onChange={e => setSignupForm(f => ({ ...f, email: e.target.value }))} placeholder="jean.dupont@avl.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Département *</label>
              <select className="form-select" value={signupForm.department} onChange={e => setSignupForm(f => ({ ...f, department: e.target.value, team: "" }))}>
                <option value="">Sélectionner un département</option>
                {Object.entries(DEPARTMENTS_TEAMS).map(([key, dept]) => (
                  <option key={key} value={key}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Équipe *</label>
              <select className="form-select" value={signupForm.team} onChange={e => setSignupForm(f => ({ ...f, team: e.target.value }))} disabled={!signupForm.department}>
                <option value="">Sélectionner une équipe</option>
                {signupForm.department && DEPARTMENTS_TEAMS[signupForm.department as keyof typeof DEPARTMENTS_TEAMS]?.teams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Rôle</label>
              <select className="form-select" value={signupForm.role} onChange={e => setSignupForm(f => ({ ...f, role: e.target.value }))}>
                <option value="Collaborator">Collaborateur</option>
                <option value="TL">Team Leader</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe *</label>
              <input className="form-input" type="password" value={signupForm.password} onChange={e => setSignupForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmer mot de passe *</label>
              <input className="form-input" type="password" value={signupForm.confirmPassword} onChange={e => setSignupForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="••••••••" />
            </div>

            <button
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "10px", fontSize: 13, marginTop: 4 }}
              onClick={handleSignup}
              disabled={loading}
            >
              {loading ? "Création…" : "Créer mon compte →"}
            </button>

            <div style={{ textAlign: "center", margin: "16px 0", fontSize: 12, color: "var(--text3)" }}>
              Déjà un compte ? <button onClick={() => setMode("login")} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", textDecoration: "underline", fontSize: 12 }}>Se connecter</button>
            </div>
          </>
        )}
      </div>

      {/* RIGHT PANEL */}
      <div className="login-right">
        <div className="login-bg-grid" />
        <div className="login-bg-glow" />
        <div className="login-right-content">
          <div className="login-right-label">Plateforme de suivi</div>
          <div className="login-right-title">
            Meetings<br /><span>hebdomadaires</span><br />structurés
          </div>
          <div className="login-right-desc">
            Gérez vos tâches, Open Points et collaborateurs depuis une interface unifiée pour TL et équipes.
          </div>
          <div className="login-features">
            {[
              { icon: "◈", text: "Current, Upcoming, Closed Tasks par collaborateur" },
              { icon: "◉", text: "Open Points et suivi des dépendances" },
              { icon: "↔", text: "Notifications temps réel pour le TL" },
              { icon: "◱", text: "Périmètre projet par date d'affectation" },
            ].map((f, i) => (
              <div key={i} className="login-feature">
                <div className="login-feature-icon">{f.icon}</div>
                <div className="login-feature-text">{f.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ACCOUNT MODAL ────────────────────────────────────────────────────────────

function AccountModal({ user, notifications, meetings, collaborators, onClose, onLogout, onSave }) {
  const [tab, setTab] = useState("profile");
  const [form, setForm] = useState({ name: user.name, email: user.email, department: user.department, team: user.team });
  const [editMode, setEditMode] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setPw = (k, v) => setPwForm(f => ({ ...f, [k]: v }));

  const userActivity = notifications.filter(n => n.text?.includes(user.name.split(" ")[0])).slice(0, 5);
  const totalTasks = meetings.reduce((acc, m) => {
    const collabData = m.sections?.[user.collabId];
    if (!collabData) return acc;
    return acc + Object.values(collabData).reduce((a, arr) => a + (arr?.length || 0), 0);
  }, 0);
  const openTasks = meetings.reduce((acc, m) => {
    const cd = m.sections?.[user.collabId];
    if (!cd) return acc;
    return acc + ((cd.current?.filter(t=>t.status!=="Closed")?.length||0) + (cd.upcoming?.length||0));
  }, 0);

  function handlePwChange() {
    if (!pwForm.current || !pwForm.next) { setPwError("Champs requis"); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError("Les mots de passe ne correspondent pas"); return; }
    if (pwForm.current !== user.password) { setPwError("Mot de passe actuel incorrect"); return; }
    if (pwForm.next.length < 6) { setPwError("Minimum 6 caractères"); return; }
    setPwError(""); setPwSuccess(true);
    setPwForm({ current: "", next: "", confirm: "" });
    setTimeout(() => setPwSuccess(false), 3000);
  }

  const tabs = [
    { key: "profile", label: "Profil" },
    { key: "stats", label: "Activité" },
    { key: "security", label: "Sécurité" },
  ];

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-head">
          <span className="modal-title">Mon Compte</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* TAB BAR */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", padding: "0 20px" }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              background: "none", border: "none", cursor: "pointer", padding: "10px 14px",
              fontSize: 12, fontFamily: "var(--mono)", color: tab === t.key ? "var(--text)" : "var(--text3)",
              borderBottom: tab === t.key ? "2px solid var(--accent)" : "2px solid transparent",
              marginBottom: -1, transition: "color 0.15s"
            }}>{t.label}</button>
          ))}
        </div>

        <div className="modal-body">
          {/* PROFILE TAB */}
          {tab === "profile" && (
            <div>
              <div className="account-avatar-row">
                <div className="account-avatar-big" style={{ background: user.color + "22", color: user.color, border: `2px solid ${user.color}44` }}>
                  {user.initials}
                </div>
                <div className="account-avatar-info">
                  <div className="account-name-big">{user.name}</div>
                  <div className="account-role-badge" style={{
                    color: user.role === "TL" ? "var(--accent)" : "var(--blue)",
                    borderColor: user.role === "TL" ? "rgba(0,168,204,0.4)" : "rgba(100,180,220,0.4)",
                    background: user.role === "TL" ? "rgba(0,168,204,0.12)" : "rgba(100,180,220,0.12)",
                  }}>
                    <span>{user.role === "TL" ? "⬡" : "◯"}</span>
                    {user.role === "TL" ? "Team Leader" : "Collaborateur"}
                  </div>
                </div>
              </div>

              {editMode ? (
                <div>
                  <div className="form-group">
                    <label className="form-label">Nom complet</label>
                    <input className="form-input" value={form.name} onChange={e => set("name", e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" value={form.email} onChange={e => set("email", e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Département</label>
                    <input className="form-input" value={form.department} onChange={e => set("department", e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Équipe</label>
                    <input className="form-input" value={form.team} onChange={e => set("team", e.target.value)} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => { onSave(form); setEditMode(false); }}>Enregistrer</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditMode(false)}>Annuler</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="account-section-title">Informations personnelles</div>
                  {[
                    { label: "Email", value: user.email },
                    { label: "Département", value: user.department },
                    { label: "Équipe", value: user.team },
                    { label: "Rôle", value: user.role === "TL" ? "Team Leader" : "Collaborateur" },
                    { label: "Membre depuis", value: new Date(user.joinDate).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) },
                  ].map(f => (
                    <div key={f.label} className="account-field">
                      <span className="account-field-label">{f.label}</span>
                      <span className="account-field-value">{f.value}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 16 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditMode(true)}>✏ Modifier le profil</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STATS TAB */}
          {tab === "stats" && (
            <div>
              <div className="account-stat-grid" style={{ marginBottom: 20 }}>
                <div className="account-stat">
                  <div className="account-stat-val">{meetings.length}</div>
                  <div className="account-stat-lbl">Meetings</div>
                </div>
                <div className="account-stat">
                  <div className="account-stat-val">{user.role === "TL" ? totalTasks || "—" : openTasks}</div>
                  <div className="account-stat-lbl">{user.role === "TL" ? "Total tasks" : "Tâches actives"}</div>
                </div>
                <div className="account-stat">
                  <div className="account-stat-val">{notifications.filter(n=>!n.read).length}</div>
                  <div className="account-stat-lbl">Non lues</div>
                </div>
              </div>
              <div className="account-section-title">Activité récente</div>
              {userActivity.length > 0 ? (
                <div className="account-activity">
                  {userActivity.map((n, i) => (
                    <div key={i} className="account-activity-item">
                      <div className="activity-dot" />
                      <span dangerouslySetInnerHTML={{ __html: n.text }} />
                      <span className="activity-time">{n.time}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: "var(--text3)", fontSize: 12, fontFamily: "var(--mono)", textAlign: "center", padding: 20 }}>
                  Aucune activité récente
                </div>
              )}
            </div>
          )}

          {/* SECURITY TAB */}
          {tab === "security" && (
            <div>
              <div className="account-section-title">Changer le mot de passe</div>
              {pwError && <div className="login-error" style={{ marginBottom: 12 }}><span>⚠</span> {pwError}</div>}
              {pwSuccess && <div style={{ padding: "10px 12px", background: "rgba(78,201,154,0.1)", border: "1px solid rgba(78,201,154,0.3)", color: "var(--green)", fontSize: 12, marginBottom: 12 }}>✓ Mot de passe mis à jour</div>}
              <div className="form-group">
                <label className="form-label">Mot de passe actuel</label>
                <input className="form-input" type="password" value={pwForm.current} onChange={e => setPw("current", e.target.value)} placeholder="••••••••" />
              </div>
              <div className="form-group">
                <label className="form-label">Nouveau mot de passe</label>
                <input className="form-input" type="password" value={pwForm.next} onChange={e => setPw("next", e.target.value)} placeholder="••••••••" />
              </div>
              <div className="form-group">
                <label className="form-label">Confirmer le nouveau</label>
                <input className="form-input" type="password" value={pwForm.confirm} onChange={e => setPw("confirm", e.target.value)} placeholder="••••••••" />
              </div>
              <button className="btn btn-primary btn-sm" onClick={handlePwChange}>Mettre à jour</button>
              <div className="detail-divider" />
              <div className="account-section-title">Session</div>
              <div className="account-field">
                <span className="account-field-label">Connexion active</span>
                <span className="account-field-value" style={{ color: "var(--green)", fontSize: 12, fontFamily: "var(--mono)" }}>● En ligne</span>
              </div>
              <div className="account-field">
                <span className="account-field-label">Rôle actif</span>
                <span className="account-field-value">{user.role === "TL" ? "Team Leader" : "Collaborateur"}</span>
              </div>
              <div style={{ marginTop: 20 }}>
                <button className="btn btn-danger btn-sm" onClick={onLogout} style={{ width: "100%", justifyContent: "center" }}>
                  → Se déconnecter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── COMPONENTS ─────────────────────────────────────────────────────────────

function StatusPill({ status }) {
  const m = STATUS_META[status] || STATUS_META.Open;
  return (
    <span className="status-pill" style={{ background: m.bg, color: m.color }}>
      <span className="status-dot" style={{ background: m.color }} />
      {m.label}
    </span>
  );
}

function Avatar({ initials, color = "#00A8CC", size = 32 }) {
  return (
    <div className="avatar" style={{ width: size, height: size, background: color + "22", color, border: `1.5px solid ${color}44`, fontSize: size < 28 ? 9 : 11 }}>
      {initials}
    </div>
  );
}

// ── TASK CARD ──
function TaskCard({ task, onOpen, onDragStart, onDragEnd, isTL, collaborator }) {
  const isOverdue = task.deadline && task.deadline < today() && task.status !== "Closed";
  return (
    <div
      className="task-card"
      draggable={!!isTL}
      onClick={() => onOpen(task)}
      onDragStart={(e) => onDragStart && onDragStart(e, task)}
      onDragEnd={onDragEnd}
    >
      {isTL && <div className="drag-handle" title="Drag to move">⋮⋮</div>}
      <div className="task-main">
        <div className="task-title">{task.title}</div>
        {task.description && <div className="task-desc">{task.description}</div>}
        <div className="task-footer">
          <StatusPill status={task.status} />
          {task.deadline && (
            <span className={`deadline-tag ${isOverdue ? "overdue" : ""}`}>
              {isOverdue ? "⚠ " : ""}
              {fmtDate(task.deadline)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── SUBSECTION ──
function Subsection({ sectionKey, tasks, onOpenTask, onAddTask, onDropTask, isTL, collaborator }) {
  const [open, setOpen] = useState(sectionKey !== "closed" && sectionKey !== "outside");
  const [dragOver, setDragOver] = useState(false);
  const [dragging, setDragging] = useState(null);

  return (
    <div className={`subsection ${dragOver ? "drop-zone" : ""}`}
      onDragOver={isTL ? (e) => { e.preventDefault(); setDragOver(true); } : undefined}
      onDragLeave={isTL ? () => setDragOver(false) : undefined}
      onDrop={isTL ? (e) => { e.preventDefault(); setDragOver(false); onDropTask(e, sectionKey); } : undefined}
    >
      <div className="subsection-head" onClick={() => setOpen(o => !o)}>
        <span className="subsection-icon">{SECTION_ICONS[sectionKey]}</span>
        <span className="subsection-label">{SECTION_LABELS[sectionKey]}</span>
        <span className="subsection-count">{tasks.length}</span>
        {(isTL || !["closed","outside"].includes(sectionKey)) && (
          <button className="add-task-btn" onClick={e => { e.stopPropagation(); onAddTask(sectionKey); }}>+ Add</button>
        )}
        <span className="expand-arrow" style={{ marginLeft: 8 }}>{open ? "▼" : "▶"}</span>
      </div>
      {open && (
        tasks.length === 0
          ? <div className="empty-subsection">— No items —</div>
          : <div className="tasks-list">
              {tasks.map(t => (
                <TaskCard
                  key={t.id} task={t}
                  onOpen={onOpenTask}
                  onDragStart={(e, task) => { e.dataTransfer.setData("taskId", task.id); e.dataTransfer.setData("fromSection", sectionKey); }}
                  onDragEnd={() => {}}
                  isTL={isTL}
                  collaborator={collaborator}
                />
              ))}
            </div>
      )}
    </div>
  );
}

// ── COLLABORATOR SECTION ──
function CollabSection({ collab, data, project, onOpenTask, onAddTask, onDropTask, isTL, projectColor }) {
  const [expanded, setExpanded] = useState(true);
  const activeCount = (data.current?.length || 0) + (data.upcoming?.length || 0);
  const openPts = data.openPoints?.length || 0;

  return (
    <div className="collab-section">
      <div className="collab-section-head" onClick={() => setExpanded(e => !e)}>
        <Avatar initials={collab.initials} color={projectColor} />
        <span className="collab-section-name">{collab.name}</span>
        <div className="collab-section-counts">
          {activeCount > 0 && <span className="count-chip active">{activeCount} active</span>}
          {openPts > 0 && <span className="count-chip" style={{ color: "#FF9B3D", background: "rgba(255,155,61,0.1)" }}>{openPts} open pts</span>}
          {SECTION_KEYS.map(k => data[k]?.length > 0 && k !== "current" && k !== "upcoming" && k !== "openPoints" ? (
            <span key={k} className="count-chip">{data[k].length} {k === "closed" ? "closed" : "outside"}</span>
          ) : null)}
        </div>
        <span className="expand-arrow" style={{ fontSize: 11 }}>{expanded ? "▼" : "▶"}</span>
      </div>
      {expanded && (
        <div className="subsections">
          {SECTION_KEYS.map(k => (
            <Subsection
              key={k}
              sectionKey={k}
              tasks={data[k] || []}
              onOpenTask={onOpenTask}
              onAddTask={(sKey) => onAddTask(collab.id, sKey)}
              onDropTask={(e, toSection) => onDropTask(e, collab.id, toSection)}
              isTL={isTL}
              collaborator={collab}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── TASK MODAL ──
function TaskModal({ task, collaborators, isTL, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({ ...task });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <span className="modal-title">{task.id ? "Edit Task" : "New Task"}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" value={form.title || ""} onChange={e => set("title", e.target.value)} placeholder="Task title…" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description || ""} onChange={e => set("description", e.target.value)} placeholder="Details…" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status || "Open"} onChange={e => set("status", e.target.value)}>
                {Object.keys(STATUS_META).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Deadline</label>
              <input className="form-input" type="date" value={form.deadline || ""} onChange={e => set("deadline", e.target.value)} />
            </div>
          </div>
          {task.history && task.history.length > 0 && (
            <>
              <div className="detail-divider" />
              <div className="detail-label">History</div>
              {task.history.map((h, i) => (
                <div key={i} className="history-entry">
                  <div className="history-line">
                    <div className="history-dot" />
                    {i < task.history.length - 1 && <div className="history-connector" />}
                  </div>
                  <div>
                    <div className="history-text" dangerouslySetInnerHTML={{ __html: h.text }} />
                    <div className="history-time">{h.time}</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
        <div className="modal-footer">
          {task.id && isTL && <button className="btn btn-danger btn-sm" onClick={() => onDelete(task.id)}>Delete</button>}
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={() => { if (form.title?.trim()) onSave(form); }}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ── MEETING FORM MODAL ──
function MeetingFormModal({ projects, existingMeeting, onSave, onClose }) {
  const [form, setForm] = useState(existingMeeting || { projectId: projects[0]?.id || "", date: today(), title: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <span className="modal-title">{existingMeeting ? "Edit Meeting" : "New Meeting Page"}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Project *</label>
            <select className="form-select" value={form.projectId} onChange={e => set("projectId", e.target.value)}>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Weekly Sync #9" />
          </div>
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input className="form-input" type="date" value={form.date} onChange={e => set("date", e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={() => { if (form.projectId && form.title && form.date) onSave(form); }}>
            {existingMeeting ? "Update" : "Create Meeting"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PROJECT FORM MODAL ──
function ProjectFormModal({ project, onSave, onClose }) {
  const [form, setForm] = useState(project || { name: "", code: "", color: "#E8531D", date_from: today(), date_to: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <span className="modal-title">{project ? "Edit Project" : "New Project"}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input className="form-input" value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Powertrain ECU" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Code</label>
              <input className="form-input" value={form.code} onChange={e => set("code", e.target.value)} placeholder="ECU-24" />
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <input className="form-input" type="color" value={form.color} onChange={e => set("color", e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date From</label>
              <input className="form-input" type="date" value={form.date_from} onChange={e => set("date_from", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Date To</label>
              <input className="form-input" type="date" value={form.date_to} onChange={e => set("date_to", e.target.value)} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={() => { if (form.name.trim()) onSave(form); }}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ── COLLABORATOR FORM MODAL ──
function CollabFormModal({ collab, subprojects, projects, onSave, onClose }) {
  const [form, setForm] = useState(collab || { name: "", initials: "", subprojectId: subprojects[0]?.id || "", date_from: today(), date_to: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <span className="modal-title">{collab ? "Edit Collaborator" : "Add Collaborator"}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" value={form.name} onChange={e => { set("name", e.target.value); if (!collab) set("initials", e.target.value.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)); }} placeholder="Jean Dupont" />
            </div>
            <div className="form-group">
              <label className="form-label">Initials</label>
              <input className="form-input" value={form.initials} onChange={e => set("initials", e.target.value)} maxLength={2} placeholder="JD" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Sub-project *</label>
            <select className="form-select" value={form.subprojectId} onChange={e => set("subprojectId", e.target.value)}>
              {projects.map(p => (
                <optgroup key={p.id} label={p.name}>
                  {subprojects.filter(s => s.projectId === p.id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date From</label>
              <input className="form-input" type="date" value={form.date_from} onChange={e => set("date_from", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Date To</label>
              <input className="form-input" type="date" value={form.date_to} onChange={e => set("date_to", e.target.value)} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={() => { if (form.name.trim()) onSave(form); }}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ───────────────────────────────────────────────────────────────

export default function App() {
  // ── AUTH STATE ──
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // ── THEME STATE ──
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('weektrack-theme');
    return saved || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('weektrack-theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }

  // ── APP STATE (all hooks must be declared before any conditional return) ──
  const [view, setView] = useState("dashboard");
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [collaborators, setCollaborators] = useState(INITIAL_COLLABORATORS);
  const [meetings, setMeetings] = useState(INITIAL_MEETINGS);
  const [notifications, setNotifications] = useState([
    { id: "n1", text: "<strong>Yassine Mansouri</strong> changed status of <em>DGO torque arbitration</em> from <strong>Open → Ongoing</strong>", time: "5m ago", read: false, icon: "↔" },
    { id: "n2", text: "<strong>Inès Boudali</strong> updated description of <em>Lambda correction model</em>", time: "1h ago", read: false, icon: "✏" },
    { id: "n3", text: "<strong>Karim Sefrioui</strong> moved <em>Sensor calibration</em> to <em>Upcoming Tasks</em>", time: "2h ago", read: true, icon: "↕" },
  ]);
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);
  const [meetingViewProject, setMeetingViewProject] = useState(null);
  const [modal, setModal] = useState(null);
  const [taskModal, setTaskModal] = useState(null);

  // ── Derived from auth ──
  const role = loggedInUser?.role || "TL";
  const currentUser = loggedInUser || {};
  const collabUserId = loggedInUser?.collabId || "c1";
  const isTL = role === "TL";
  const unreadCount = notifications.filter(n => !n.read).length;
  const userColor = loggedInUser?.color || "#00A8CC";

  function handleLogin(user) { setLoggedInUser(user); setView("dashboard"); }
  function handleLogout() { setLoggedInUser(null); setView("dashboard"); setUserMenuOpen(false); setShowAccountModal(false); }
  function handleSaveAccount(form) {
    setLoggedInUser(u => ({ ...u, name: form.name, email: form.email, department: form.department, team: form.team }));
  }

  // ── Show login screen if not authenticated ──
  if (!loggedInUser) return (<><style>{css}</style><LoginScreen onLogin={handleLogin} /></>);

  // ── Helpers ──
  const allSubprojects = projects.flatMap(p => p.subprojects || []);

  const getProjectColor = (projectId) => {
    const p = projects.find(x => x.id === projectId);
    return p?.color || "#00A8CC";
  };

  const getCollabsForProject = (projectId) => {
    const sps = allSubprojects.filter(s => s.projectId === projectId).map(s => s.id);
    return collaborators.filter(c => sps.includes(c.subprojectId));
  };

  function addNotification(text, icon = "●") {
    const n = { id: genId(), text, time: "now", read: false, icon };
    setNotifications(prev => [n, ...prev]);
  }

  // ── Meeting operations ──
  function getMeeting(id) { return meetings.find(m => m.id === id); }

  function updateMeetingSection(meetingId, collabId, sectionKey, updater) {
    setMeetings(prev => prev.map(m => {
      if (m.id !== meetingId) return m;
      const sections = { ...m.sections };
      const collabSec = { ...(sections[collabId] || {}) };
      collabSec[sectionKey] = updater(collabSec[sectionKey] || []);
      sections[collabId] = collabSec;
      return { ...m, sections };
    }));
  }

  function handleSaveTask(formData) {
    if (!taskModal) return;
    const { collabId, sectionKey, meetingId, task: originalTask } = taskModal;
    const collab = collaborators.find(c => c.id === collabId);
    const now = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

    if (originalTask.id) {
      // Edit existing
      const changes = [];
      if (formData.status !== originalTask.status) changes.push(`<strong>${originalTask.status} → ${formData.status}</strong>`);
      if (formData.title !== originalTask.title) changes.push(`title updated`);
      if (formData.description !== originalTask.description) changes.push(`description updated`);
      if (formData.deadline !== originalTask.deadline) changes.push(`deadline → ${fmtDate(formData.deadline)}`);

      const histEntry = changes.length > 0 ? { text: `${!isTL ? (collab?.name || "Collaborator") : "TL"} — ${changes.join(", ")}`, time: `Today ${now}` } : null;
      const updatedTask = { ...originalTask, ...formData, history: [...(originalTask.history || []), ...(histEntry ? [histEntry] : [])] };

      updateMeetingSection(meetingId, collabId, sectionKey, tasks =>
        tasks.map(t => t.id === updatedTask.id ? updatedTask : t)
      );
      if (!isTL && changes.length > 0) {
        addNotification(`<strong>${collab?.name}</strong> ${changes.join(", ")} on <em>${formData.title}</em>`, "✏");
      }
    } else {
      // New task
      const newTask = { ...formData, id: genId(), history: [{ text: `Created by ${isTL ? "TL" : collab?.name}`, time: `Today ${now}` }] };
      updateMeetingSection(meetingId, collabId, sectionKey, tasks => [...tasks, newTask]);
    }
    setTaskModal(null);
  }

  function handleDeleteTask(taskId) {
    if (!taskModal) return;
    const { collabId, sectionKey, meetingId } = taskModal;
    updateMeetingSection(meetingId, collabId, sectionKey, tasks => tasks.filter(t => t.id !== taskId));
    setTaskModal(null);
  }

  function handleDropTask(e, meetingId, toCollabId, toSection) {
    const taskId = e.dataTransfer.getData("taskId");
    const fromSection = e.dataTransfer.getData("fromSection");
    if (!taskId || !fromSection) return;

    let droppedTask = null;
    const meeting = getMeeting(meetingId);
    if (!meeting) return;

    // Find the task across all collabs
    let fromCollabId = null;
    for (const [cid, sections] of Object.entries(meeting.sections)) {
      for (const [sk, tasks] of Object.entries(sections)) {
        const found = tasks?.find(t => t.id === taskId);
        if (found) { droppedTask = found; fromCollabId = cid; break; }
      }
      if (droppedTask) break;
    }
    if (!droppedTask || (fromCollabId === toCollabId && fromSection === toSection)) return;

    // Remove from source
    updateMeetingSection(meetingId, fromCollabId, fromSection, tasks => tasks.filter(t => t.id !== taskId));
    // Add to target
    const collab = collaborators.find(c => c.id === fromCollabId);
    const histEntry = { text: `Moved from <em>${SECTION_LABELS[fromSection]}</em> → <em>${SECTION_LABELS[toSection]}</em>`, time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) };
    const updTask = { ...droppedTask, history: [...(droppedTask.history || []), histEntry] };
    updateMeetingSection(meetingId, toCollabId, toSection, tasks => [...tasks, updTask]);
    if (!isTL) addNotification(`<strong>${collab?.name}</strong> moved <em>${droppedTask.title}</em> to <em>${SECTION_LABELS[toSection]}</em>`, "↕");
  }

  // ─── TABS ────────────────────────────────────────────────────────────────

  // ── DASHBOARD ──
  function DashboardTab() {
    // Calculate stats based on role
    let totalTasks, activeMeetings, activeProjects;
    
    if (isTL) {
      // TL sees all tasks, all meetings, all projects under their team
      totalTasks = meetings.reduce((acc, m) => {
        return acc + Object.values(m.sections).reduce((a2, sec) => a2 + SECTION_KEYS.reduce((a3, k) => a3 + (sec[k]?.length || 0), 0), 0);
      }, 0);
      activeMeetings = meetings.length;
      activeProjects = projects.length;
    } else {
      // Collaborator sees only their own tasks
      totalTasks = meetings.reduce((acc, m) => {
        const mySection = m.sections[collabUserId];
        if (!mySection) return acc;
        return acc + SECTION_KEYS.reduce((a, k) => a + (mySection[k]?.length || 0), 0);
      }, 0);
      
      // Count meetings where collaborator is present
      activeMeetings = meetings.filter(m => m.sections[collabUserId]).length;
      
      // Count projects where collaborator is assigned
      const myCollab = collaborators.find(c => c.id === collabUserId);
      const mySubproject = allSubprojects.find(s => s.id === myCollab?.subprojectId);
      activeProjects = mySubproject ? 1 : 0;
    }

    return (
      <div>
        <div className="dash-grid">
          <div className="stat-card">
            <div className="stat-label">Active Projects</div>
            <div className="stat-value">{activeProjects}</div>
            <div className="stat-sub">{isTL ? `${projects.flatMap(p=>p.subprojects||[]).length} sub-projects` : 'mon projet assigné'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Meeting Pages</div>
            <div className="stat-value">{activeMeetings}</div>
            <div className="stat-sub">{isTL ? 'across all projects' : 'mes meetings'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{isTL ? 'Total Tasks' : 'Mes Tâches'}</div>
            <div className="stat-value">{totalTasks}</div>
            <div className="stat-sub">{notifications.filter(n=>!n.read).length} unread notifications</div>
          </div>
        </div>

        <div className="section-header" style={{ marginBottom: 12 }}>
          <span className="section-title">Active Projects</span>
          {isTL && <button className="btn btn-ghost btn-sm" onClick={() => setView("projects")}>Manage →</button>}
        </div>
        <div className="project-cards" style={{ marginBottom: 24 }}>
          {(isTL ? projects : (() => {
            // Collaborator: only show projects where they are assigned
            const myCollab = collaborators.find(c => c.id === collabUserId);
            const mySubproject = allSubprojects.find(s => s.id === myCollab?.subprojectId);
            const myProject = projects.find(p => p.id === mySubproject?.projectId);
            return myProject ? [myProject] : [];
          })()).map(p => {
            const collabs = getCollabsForProject(p.id);
            const projectMeetings = meetings.filter(m => m.projectId === p.id);
            return (
              <div key={p.id} className="project-card" style={{ "--card-color": p.color }}
                onClick={() => { setMeetingViewProject(p.id); setView("meetings"); }}>
                <div className="project-card-code">{p.code}</div>
                <div className="project-card-name">{p.name}</div>
                <div className="project-card-meta">
                  <span>{collabs.length} collaborators</span>
                  <span>{projectMeetings.length} meetings</span>
                  <span>{fmtDate(p.date_from)} → {p.date_to ? fmtDate(p.date_to) : "ongoing"}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="section-header" style={{ marginBottom: 12 }}>
          <span className="section-title">Recent Activity</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setView("notifications")}>See all →</button>
        </div>
        <div className="notif-list">
          {(isTL 
            ? notifications.slice(0, 5)
            : notifications.filter(n => {
                // Collaborator sees only notifications about their own actions
                const myName = currentUser.name?.split(" ")[0]; // First name
                return n.text?.includes(`<strong>${myName}`) || n.text?.includes(`<strong>${currentUser.name}`);
              }).slice(0, 5)
          ).map(n => (
            <div key={n.id} className={`notif-item ${n.read ? "" : "unread"}`}>
              <div className={`notif-dot ${n.read ? "read" : ""}`} />
              <div className="notif-text" dangerouslySetInnerHTML={{ __html: n.text }} />
              <div className="notif-time">{n.time}</div>
            </div>
          ))}
          {!isTL && notifications.filter(n => {
            const myName = currentUser.name?.split(" ")[0];
            return n.text?.includes(`<strong>${myName}`) || n.text?.includes(`<strong>${currentUser.name}`);
          }).length === 0 && (
            <div style={{ padding: 20, textAlign: "center", color: "var(--text3)", fontSize: 12 }}>
              Aucune activité récente
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── PROJECTS & SCOPE ──
  function ProjectsTab() {
    const [selectedProject, setSelectedProject] = useState(projects[0]);
    const [projectModal, setProjectModal] = useState(null);
    const [subprojectInput, setSubprojectInput] = useState("");
    const [collabModal, setCollabModal] = useState(null);

    function saveProject(form) {
      if (form.id) {
        setProjects(prev => prev.map(p => p.id === form.id ? { ...p, ...form } : p));
      } else {
        const newP = { ...form, id: genId(), subprojects: [] };
        setProjects(prev => [...prev, newP]);
        setSelectedProject(newP);
      }
      setProjectModal(null);
    }

    function deleteProject(id) {
      setProjects(prev => prev.filter(p => p.id !== id));
      setSelectedProject(projects.find(p => p.id !== id) || null);
    }

    function addSubproject() {
      if (!subprojectInput.trim() || !selectedProject) return;
      const sp = { id: genId(), name: subprojectInput.trim(), projectId: selectedProject.id };
      setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, subprojects: [...(p.subprojects || []), sp] } : p));
      setSelectedProject(prev => ({ ...prev, subprojects: [...(prev.subprojects || []), sp] }));
      setSubprojectInput("");
    }

    function saveCollab(form) {
      if (form.id) {
        setCollaborators(prev => prev.map(c => c.id === form.id ? { ...c, ...form } : c));
      } else {
        setCollaborators(prev => [...prev, { ...form, id: genId() }]);
      }
      setCollabModal(null);
    }

    const currentSubprojects = selectedProject?.subprojects || [];
    const currentCollabs = collaborators.filter(c => currentSubprojects.find(s => s.id === c.subprojectId));

    return (
      <div>
        <div className="section-header" style={{ marginBottom: 16 }}>
          <span className="section-title">Projects & Scope</span>
          {isTL && <button className="btn btn-primary btn-sm" onClick={() => setProjectModal({})}>+ New Project</button>}
        </div>
        <div className="scope-layout">
          {/* Project tree */}
          <div>
            <div className="panel">
              <div className="panel-head">
                <span className="panel-title">Projects</span>
              </div>
              <div className="panel-body">
                {projects.map(p => (
                  <div key={p.id}>
                    <div className={`tree-item ${selectedProject?.id === p.id ? "selected" : ""}`} onClick={() => setSelectedProject(p)}>
                      <div className="tree-dot" style={{ background: p.color }} />
                      <span className="tree-name">{p.name}</span>
                      <span className="tree-badge">{p.code}</span>
                      {isTL && (
                        <button className="btn btn-ghost btn-xs" style={{ marginLeft: 4 }} onClick={e => { e.stopPropagation(); setProjectModal(p); }}>✏</button>
                      )}
                    </div>
                    {selectedProject?.id === p.id && (
                      <div className="tree-sub">
                        {(p.subprojects || []).map(sp => (
                          <div key={sp.id} className="tree-item">
                            <div className="tree-dot" style={{ background: p.color, opacity: 0.4 }} />
                            <span className="tree-name">{sp.name}</span>
                            <span className="tree-badge">{collaborators.filter(c=>c.subprojectId===sp.id).length} collabs</span>
                          </div>
                        ))}
                        {isTL && (
                          <div style={{ display: "flex", gap: 6, padding: "6px 8px" }}>
                            <input className="form-input" value={subprojectInput} onChange={e=>setSubprojectInput(e.target.value)} placeholder="New sub-project…" onKeyDown={e=>e.key==="Enter"&&addSubproject()} style={{ fontSize: 12 }} />
                            <button className="btn btn-ghost btn-xs" onClick={addSubproject}>+</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {selectedProject && isTL && (
              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                <button className="btn btn-danger btn-sm" onClick={() => deleteProject(selectedProject.id)}>Delete Project</button>
              </div>
            )}
          </div>

          {/* Collaborators */}
          <div>
            <div className="panel">
              <div className="panel-head">
                <span className="panel-title">Collaborators {selectedProject ? `— ${selectedProject.name}` : ""}</span>
                {isTL && <button className="btn btn-primary btn-xs" onClick={() => setCollabModal({})}>+ Add</button>}
              </div>
              <div className="scope-collab-list">
                {currentCollabs.length === 0 ? (
                  <div className="empty-state"><div className="empty-state-text">No collaborators for this project</div></div>
                ) : currentCollabs.map(c => {
                  const sp = allSubprojects.find(s => s.id === c.subprojectId);
                  return (
                    <div key={c.id} className="collab-row">
                      <Avatar initials={c.initials} color={selectedProject?.color} size={32} />
                      <div className="collab-info">
                        <div className="collab-name">{c.name}</div>
                        <div className="collab-sub">{sp?.name}</div>
                      </div>
                      <div className="collab-dates">{fmtDate(c.date_from)}<br />{c.date_to ? fmtDate(c.date_to) : "ongoing"}</div>
                      {isTL && (
                        <div style={{ display: "flex", gap: 4 }}>
                          <button className="btn btn-ghost btn-xs" onClick={() => setCollabModal(c)}>✏</button>
                          <button className="btn btn-danger btn-xs" onClick={() => setCollaborators(prev => prev.filter(x=>x.id!==c.id))}>✕</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {projectModal !== null && (
          <ProjectFormModal project={projectModal.id ? projectModal : null} onSave={saveProject} onClose={() => setProjectModal(null)} />
        )}
        {collabModal !== null && (
          <CollabFormModal collab={collabModal.id ? collabModal : null} subprojects={allSubprojects} projects={projects} onSave={saveCollab} onClose={() => setCollabModal(null)} />
        )}
      </div>
    );
  }

  // ── MEETINGS ──
  function MeetingsTab() {
    // Determine collaborator's projects
    const collabProjects = isTL ? projects : (() => {
      const myCollab = collaborators.find(c => c.id === collabUserId);
      if (!myCollab) return [];
      const mySubproject = allSubprojects.find(s => s.id === myCollab.subprojectId);
      const myProject = projects.find(p => p.id === mySubproject?.projectId);
      return myProject ? [myProject] : [];
    })();

    const showProjectFilter = isTL || collabProjects.length > 1;
    
    const [filterProject, setFilterProject] = useState(meetingViewProject || (collabProjects.length === 1 ? collabProjects[0].id : "all"));
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editMeeting, setEditMeeting] = useState(null);

    // Filter meetings based on role
    const filtered = isTL 
      ? meetings.filter(m => filterProject === "all" || m.projectId === filterProject)
      : meetings.filter(m => {
          // Collaborator: only meetings where they are present AND match project filter
          const hasSection = m.sections && m.sections[collabUserId];
          const matchesFilter = filterProject === "all" || m.projectId === filterProject;
          return hasSection && matchesFilter;
        });

    function createMeeting(form) {
      const project = projects.find(p => p.id === form.projectId);
      const collabs = getCollabsForProject(form.projectId);
      const sections = {};
      collabs.forEach(c => {
        sections[c.id] = { current: [], upcoming: [], openPoints: [], closed: [], outside: [] };
      });
      const newM = { id: genId(), ...form, sections };
      setMeetings(prev => [...prev, newM]);
      setShowCreateModal(false);
      setSelectedMeetingId(newM.id);
      setView("meeting-detail");
    }

    function updateMeeting(form) {
      setMeetings(prev => prev.map(m => m.id === form.id ? { ...m, ...form } : m));
      setEditMeeting(null);
    }

    return (
      <div>
        <div className="section-header" style={{ marginBottom: 16 }}>
          <span className="section-title">{isTL ? "Meeting Pages" : "My Meetings"}</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {showProjectFilter && (
              <select className="form-select" value={filterProject} onChange={e => setFilterProject(e.target.value)} style={{ width: 180, fontSize: 12 }}>
                {isTL && <option value="all">All projects</option>}
                {collabProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
            {isTL && <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>+ New Meeting</button>}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-text">{isTL ? "No meeting pages yet. Create your first one." : "Aucun meeting assigné."}</div>
          </div>
        ) : filtered.sort((a,b) => b.date.localeCompare(a.date)).map(m => {
          const proj = projects.find(p => p.id === m.projectId);
          const taskCount = Object.values(m.sections).reduce((a, sec) => a + (sec.current?.length||0) + (sec.upcoming?.length||0), 0);
          const opCount = Object.values(m.sections).reduce((a, sec) => a + (sec.openPoints?.length||0), 0);
          return (
            <div key={m.id} className="meeting-list-item" onClick={() => { setSelectedMeetingId(m.id); setView("meeting-detail"); }}>
              <div className="meeting-list-date">{fmtDate(m.date)}</div>
              <div style={{ width: 4, height: 36, background: proj?.color, flexShrink: 0 }} />
              <div className="meeting-list-title">{m.title}</div>
              <div className="meeting-list-project">{proj?.name}</div>
              <div className="meeting-list-stats">
                <span className="tag">{taskCount} tasks</span>
                {opCount > 0 && <span className="tag" style={{ color: "#FF9B3D", borderColor: "rgba(255,155,61,0.3)" }}>{opCount} open pts</span>}
              </div>
              {isTL && (
                <button className="btn btn-ghost btn-xs" onClick={e => { e.stopPropagation(); setEditMeeting(m); }}>✏</button>
              )}
            </div>
          );
        })}

        {(showCreateModal || editMeeting) && (
          <MeetingFormModal
            projects={projects}
            existingMeeting={editMeeting}
            onSave={editMeeting ? updateMeeting : createMeeting}
            onClose={() => { setShowCreateModal(false); setEditMeeting(null); }}
          />
        )}
      </div>
    );
  }

  // ── MEETING DETAIL ──
  function MeetingDetailView() {
    const meeting = getMeeting(selectedMeetingId);
    if (!meeting) return <div className="empty-state"><div className="empty-state-text">Meeting not found</div></div>;

    const project = projects.find(p => p.id === meeting.projectId);
    const projectCollabs = isTL
      ? getCollabsForProject(meeting.projectId)
      : collaborators.filter(c => c.id === collabUserId);

    function openAddTask(collabId, sectionKey) {
      setTaskModal({ collabId, sectionKey, meetingId: meeting.id, task: { title: "", description: "", status: "Open", deadline: "" } });
    }

    function openEditTask(task, collabId, sectionKey) {
      setTaskModal({ collabId, sectionKey, meetingId: meeting.id, task });
    }

    const totalActive = Object.values(meeting.sections).reduce((a, sec) => a + (sec.current?.length||0) + (sec.upcoming?.length||0), 0);

    return (
      <div>
        <div className="meeting-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 4, height: 24, background: project?.color, borderRadius: 1 }} />
              <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--text3)" }}>{project?.code} / {project?.name}</span>
            </div>
            <div className="meeting-title">{meeting.title}</div>
            <div className="meeting-meta">
              <span>{fmtDate(meeting.date)}</span>
              <span>{projectCollabs.length} collaborators</span>
              <span>{totalActive} active tasks</span>
            </div>
          </div>
          <div>
            {!isTL && (
              <div className="meeting-badge">
                <div className="meeting-badge-dot" />
                Collaborator View — {collaborators.find(c=>c.id===collabUserId)?.name}
              </div>
            )}
          </div>
        </div>

        {projectCollabs.map(collab => {
          const data = meeting.sections[collab.id] || {};
          return (
            <CollabSection
              key={collab.id}
              collab={collab}
              data={data}
              project={project}
              projectColor={project?.color || "#E8531D"}
              isTL={isTL}
              onOpenTask={(task) => {
                const sKey = SECTION_KEYS.find(k => (data[k] || []).find(t => t.id === task.id));
                openEditTask(task, collab.id, sKey);
              }}
              onAddTask={openAddTask}
              onDropTask={(e, toCollabId, toSection) => handleDropTask(e, meeting.id, toCollabId, toSection)}
            />
          );
        })}
      </div>
    );
  }

  // ── NOTIFICATIONS TAB ──
  function NotificationsTab() {
    // Filter notifications based on role
    const visibleNotifications = isTL 
      ? notifications 
      : notifications.filter(n => {
          const myName = currentUser.name?.split(" ")[0];
          return n.text?.includes(`<strong>${myName}`) || n.text?.includes(`<strong>${currentUser.name}`);
        });

    return (
      <div>
        <div className="section-header" style={{ marginBottom: 16 }}>
          <span className="section-title">Notifications</span>
          {visibleNotifications.some(n => !n.read) && (
            <button className="btn btn-ghost btn-sm" onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}>
              Mark all read
            </button>
          )}
        </div>
        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}>
          {visibleNotifications.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="empty-state-icon">🔔</div>
              <div className="empty-state-text">{isTL ? "No notifications" : "Aucune notification pour le moment"}</div>
            </div>
          ) : visibleNotifications.map(n => (
            <div key={n.id} className={`notif-tab-item ${n.read ? "" : "unread"}`}
              onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}>
              <div className="notif-tab-icon">{n.icon || "●"}</div>
              <div className="notif-tab-body">
                <div className="notif-tab-text" dangerouslySetInnerHTML={{ __html: n.text }} />
                <div className="notif-tab-meta">
                  <span>{n.time}</span>
                  {!n.read && <span style={{ color: "var(--accent)" }}>● unread</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── RENDER ──────────────────────────────────────────────────────────────

  const NAV = isTL ? [
    { key: "dashboard", label: "Dashboard", icon: "◧" },
    { key: "projects", label: "Projects & Scope", icon: "◱" },
    { key: "meetings", label: "Meeting Pages", icon: "◨" },
    { key: "notifications", label: "Notifications", icon: "◯" },
  ] : [
    { key: "dashboard", label: "Dashboard", icon: "◧" },
    { key: "meetings", label: "My Meetings", icon: "◨" },
  ];

  const TOPBAR_TITLES = {
    dashboard: "Dashboard",
    projects: "Projects & Scope",
    meetings: "Meeting Pages",
    "meeting-detail": getMeeting(selectedMeetingId)?.title || "Meeting",
    notifications: "Notifications",
  };

  return (
    <>
      <style>{css}</style>
      <div className="app" onClick={() => userMenuOpen && setUserMenuOpen(false)}>
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <img src={AVL_LOGO_URL} alt="AVL Logo" style={{ width: 100, height: 48, objectFit: 'contain' }} />
            <div style={{ marginLeft: 8 }}>
              <div className="logo-text" style={{ fontSize: 11, lineHeight: 1.2 }}>Meeting<br/>Tracker</div>
              <div className="logo-sub">v1.0</div>
            </div>
          </div>
          <nav className="sidebar-nav">
            <div className="nav-section-title">Navigation</div>
            {NAV.map(n => (
              <div key={n.key} className={`nav-item ${(view === n.key || (view === "meeting-detail" && n.key === "meetings")) ? "active" : ""}`}
                onClick={() => { if (n.key === view) return; setView(n.key); setSelectedMeetingId(null); }}>
                <span className="nav-icon">{n.icon}</span>
                {n.label}
                {n.key === "notifications" && unreadCount > 0 && (
                  <span style={{ marginLeft: "auto", background: "var(--accent)", color: "white", borderRadius: 10, fontSize: 9, padding: "1px 6px", fontFamily: "var(--mono)" }}>{unreadCount}</span>
                )}
              </div>
            ))}
          </nav>

          {/* USER MENU */}
          <div className="user-menu-wrap" onClick={e => e.stopPropagation()}>
            {userMenuOpen && (
              <div className="user-dropdown">
                <div className="user-dropdown-header">
                  <Avatar initials={currentUser.initials} color={userColor} size={34} />
                  <div>
                    <div className="user-dropdown-name">{currentUser.name}</div>
                    <div className="user-dropdown-email">{currentUser.email}</div>
                  </div>
                  <div className="user-dropdown-role-badge" style={{
                    color: isTL ? "var(--accent)" : "var(--blue)",
                    borderColor: isTL ? "rgba(0,168,204,0.4)" : "rgba(100,180,220,0.4)",
                    background: isTL ? "rgba(0,168,204,0.12)" : "rgba(100,180,220,0.12)",
                  }}>{isTL ? "TL" : "Collab"}</div>
                </div>
                <button className="dropdown-item" onClick={() => { setShowAccountModal(true); setUserMenuOpen(false); }}>
                  <span className="dropdown-item-icon">◎</span> Mon compte
                </button>
                <button className="dropdown-item" onClick={() => { setView("notifications"); setUserMenuOpen(false); }}>
                  <span className="dropdown-item-icon">🔔</span> Notifications
                  {unreadCount > 0 && <span style={{ marginLeft: "auto", background: "var(--accent)", color: "white", borderRadius: 10, fontSize: 9, padding: "1px 6px" }}>{unreadCount}</span>}
                </button>
                <div className="dropdown-divider" />
                <div className="theme-toggle">
                  <div className="theme-toggle-label">
                    <span className="dropdown-item-icon">{theme === 'dark' ? '🌙' : '☀️'}</span>
                    <span>Mode {theme === 'dark' ? 'sombre' : 'clair'}</span>
                  </div>
                  <div className={`theme-switch ${theme === 'light' ? 'active' : ''}`} onClick={toggleTheme}>
                    <div className="theme-switch-slider" />
                  </div>
                </div>
                <div className="dropdown-divider" />
                <button className="dropdown-item danger" onClick={handleLogout}>
                  <span className="dropdown-item-icon">→</span> Se déconnecter
                </button>
              </div>
            )}
            <button className="sidebar-user-btn" onClick={() => setUserMenuOpen(o => !o)}>
              <Avatar initials={currentUser.initials} color={userColor} size={28} />
              <div style={{ flex: 1, textAlign: "left" }}>
                <div className="user-name">{currentUser.name}</div>
                <div className="user-role">{isTL ? "Team Leader" : "Collaborateur"}</div>
              </div>
              <span className={`user-chevron ${userMenuOpen ? "open" : ""}`}>▲</span>
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <div className="main">
          <header className="topbar">
            {view === "meeting-detail" && (
              <button className="btn btn-ghost btn-sm" onClick={() => setView("meetings")}>← Back</button>
            )}
            <span className="topbar-title">{TOPBAR_TITLES[view] || ""}</span>
            {view === "meeting-detail" && getMeeting(selectedMeetingId) && (
              <>
                <div className="topbar-sep" />
                <span className="topbar-meta">{fmtDate(getMeeting(selectedMeetingId)?.date)}</span>
              </>
            )}
            <div className="topbar-actions">
              {isTL && (
                <div className="notif-bell" onClick={() => setView("notifications")}>
                  🔔
                  {unreadCount > 0 && <span className="notif-badge" />}
                </div>
              )}
              <button className="btn btn-ghost btn-sm" style={{ gap: 8 }} onClick={() => setShowAccountModal(true)}>
                <Avatar initials={currentUser.initials} color={userColor} size={20} />
                {currentUser.name?.split(" ")[0]}
              </button>
            </div>
          </header>

          <div className="content">
            {view === "dashboard" && <DashboardTab />}
            {view === "projects" && <ProjectsTab />}
            {view === "meetings" && <MeetingsTab />}
            {view === "meeting-detail" && <MeetingDetailView />}
            {view === "notifications" && <NotificationsTab />}
          </div>
        </div>
      </div>

      {/* TASK MODAL */}
      {taskModal && (
        <TaskModal
          task={taskModal.task}
          collaborators={collaborators}
          isTL={isTL}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          onClose={() => setTaskModal(null)}
        />
      )}

      {/* ACCOUNT MODAL */}
      {showAccountModal && (
        <AccountModal
          user={loggedInUser}
          notifications={notifications}
          meetings={meetings}
          collaborators={collaborators}
          onClose={() => setShowAccountModal(false)}
          onLogout={handleLogout}
          onSave={handleSaveAccount}
        />
      )}
    </>
  );
}
