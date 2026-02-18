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

function genId() { return Math.random().toString(36).slice(2, 9); }
function fmtDate(d: string | null) { return d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—"; }
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
    flex: 1; background: linear-gradient(135deg, var(--accent) 0%, var(--cobalt) 100%);
    display: flex; align-items: center; justify-content: center; position: relative;
  }
  .login-right::before {
    content: ''; position: absolute; inset: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="white" opacity="0.1"/><circle cx="80" cy="30" r="1.5" fill="white" opacity="0.1"/><circle cx="50" cy="70" r="2.5" fill="white" opacity="0.1"/></svg>');
    opacity: 0.5;
  }
  .login-form { width: 100%; max-width: 320px; position: relative; z-index: 1; }
  .login-title { font-family: var(--display); font-weight: 800; font-size: 24px; margin-bottom: 8px; }
  .login-subtitle { font-size: 13px; color: var(--text2); margin-bottom: 28px; }
  .login-form-group { margin-bottom: 14px; }
  .login-label { display: block; font-size: 11px; font-family: var(--mono); color: var(--text3); margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
  .login-input { width: 100%; background: var(--bg3); border: 1px solid var(--border2); color: var(--text); font-family: var(--sans); font-size: 13px; padding: 10px 12px; outline: none; transition: border-color 0.15s; }
  .login-input:focus { border-color: var(--accent); }
  .login-button { width: 100%; padding: 10px; background: var(--accent); color: white; border: none; font-family: var(--sans); font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; margin-top: 8px; }
  .login-button:hover { background: var(--accent2); }
  .login-users { margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border); }
  .login-users-title { font-size: 10px; font-family: var(--mono); color: var(--text3); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
  .login-user-btn {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; background: var(--bg3); border: 1px solid var(--border);
    cursor: pointer; transition: all 0.15s; margin-bottom: 8px; border-radius: 3px;
  }
  .login-user-btn:hover { background: var(--bg4); border-color: var(--border2); }
  .login-user-avatar { width: 32px; height: 32px; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-family: var(--mono); font-size: 11px; font-weight: 600; color: white; flex-shrink: 0; }
  .login-user-info { flex: 1; }
  .login-user-name { font-size: 12px; font-weight: 500; }
  .login-user-role { font-size: 10px; color: var(--text3); font-family: var(--mono); }
`;

// ─── LOGIN SCREEN ───────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (user: any) => void }) {
  const [form, setForm] = useState({ email: "", password: "" });

  const predefinedUsers = [
    { id: "c1", name: "Yassine Mansouri", email: "yassine@example.com", role: "Collaborator", color: "#FF9B3D", collabId: "c1" },
    { id: "tl1", name: "Team Lead", email: "tl@example.com", role: "TL", color: "#00A8CC", collabId: null },
  ];

  return (
    <>
      <style>{css}</style>
      <div className="login-screen">
        <div className="login-left">
          <div className="login-form">
            <div className="login-title">WeekTrack</div>
            <div className="login-subtitle">Project & Meeting Manager</div>
            <div className="login-form-group">
              <label className="login-label">Email</label>
              <input
                type="email"
                className="login-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="login-form-group">
              <label className="login-label">Password</label>
              <input
                type="password"
                className="login-input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <button className="login-button" onClick={() => onLogin(predefinedUsers[0])}>
              Sign In
            </button>

            <div className="login-users">
              <div className="login-users-title">Quick Login</div>
              {predefinedUsers.map((user) => (
                <button
                  key={user.id}
                  className="login-user-btn"
                  onClick={() => onLogin(user)}
                >
                  <div className="login-user-avatar" style={{ background: user.color }}>
                    {user.name.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                  <div className="login-user-info">
                    <div className="login-user-name">{user.name}</div>
                    <div className="login-user-role">{user.role}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="login-right"></div>
      </div>
    </>
  );
}

// ─── MAIN APP ───────────────────────────────────────────────────────────────

export default function Home() {
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
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

  const [view, setView] = useState("dashboard");
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [collaborators, setCollaborators] = useState(INITIAL_COLLABORATORS);
  const [meetings, setMeetings] = useState(INITIAL_MEETINGS);
  const [notifications, setNotifications] = useState([
    { id: "n1", text: "<strong>Yassine Mansouri</strong> changed status of <em>DGO torque arbitration</em> from <strong>Open → Ongoing</strong>", time: "5m ago", read: false, icon: "↔" },
    { id: "n2", text: "<strong>Inès Boudali</strong> updated description of <em>Lambda correction model</em>", time: "1h ago", read: false, icon: "✏" },
    { id: "n3", text: "<strong>Karim Sefrioui</strong> moved <em>Sensor calibration</em> to <em>Upcoming Tasks</em>", time: "2h ago", read: true, icon: "↕" },
  ]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [meetingViewProject, setMeetingViewProject] = useState<string | null>(null);
  const [modal, setModal] = useState<any>(null);
  const [taskModal, setTaskModal] = useState<any>(null);

  const role = loggedInUser?.role || "TL";
  const currentUser = loggedInUser || {};
  const collabUserId = loggedInUser?.collabId || "c1";
  const isTL = role === "TL";
  const unreadCount = notifications.filter(n => !n.read).length;
  const userColor = loggedInUser?.color || "#00A8CC";

  function handleLogin(user: any) { setLoggedInUser(user); setView("dashboard"); }
  function handleLogout() { setLoggedInUser(null); setView("dashboard"); }

  if (!loggedInUser) return <LoginScreen onLogin={handleLogin} />;

  const allSubprojects = projects.flatMap(p => p.subprojects || []);

  const getProjectColor = (projectId: string) => {
    const p = projects.find(x => x.id === projectId);
    return p?.color || "#00A8CC";
  };

  const getCollabsForProject = (projectId: string) => {
    const sps = allSubprojects.filter(s => s.projectId === projectId).map(s => s.id);
    return collaborators.filter(c => sps.includes(c.subprojectId));
  };

  function addNotification(text: string, icon?: string) {
    const n = { id: genId(), text, time: "now", read: false, icon: icon || "●" };
    setNotifications(prev => [n, ...prev]);
  }

  function getMeeting(id: string) { return meetings.find(m => m.id === id); }

  function updateMeetingSection(meetingId: string, collabId: string, sectionKey: string, updater: any): void {
    setMeetings(prev => prev.map(m => {
      if (m.id !== meetingId) return m;
      const sections = { ...m.sections } as any;
      const collabSec = { ...(sections[collabId] || {}) } as any;
      collabSec[sectionKey] = updater(collabSec[sectionKey] || []);
      sections[collabId] = collabSec;
      return { ...m, sections };
    }));
  }

  function handleSaveTask(formData: any): void {
    if (!taskModal) return;
    const { collabId, sectionKey, meetingId, task: originalTask } = taskModal;
    const collab = collaborators.find(c => c.id === collabId);
    const now = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

    if (originalTask.id) {
      const changes = [];
      if (formData.status !== originalTask.status) changes.push(`<strong>${originalTask.status} → ${formData.status}</strong>`);
      if (formData.title !== originalTask.title) changes.push(`title updated`);
      if (formData.description !== originalTask.description) changes.push(`description updated`);
      if (formData.deadline !== originalTask.deadline) changes.push(`deadline → ${fmtDate(formData.deadline)}`);

      const histEntry = changes.length > 0 ? { text: `${!isTL ? (collab?.name || "Collaborator") : "TL"} — ${changes.join(", ")}`, time: `Today ${now}` } : null;
      const updatedTask = { ...originalTask, ...formData, history: [...(originalTask.history || []), ...(histEntry ? [histEntry] : [])] };

      updateMeetingSection(meetingId, collabId, sectionKey, (tasks: any) =>
        tasks.map((t: any) => t.id === updatedTask.id ? updatedTask : t)
      );
      if (!isTL && changes.length > 0) {
        addNotification(`<strong>${collab?.name}</strong> ${changes.join(", ")} on <em>${formData.title}</em>`, "✏");
      }
    } else {
      const newTask = { ...formData, id: genId(), history: [{ text: `Created by ${isTL ? "TL" : collab?.name}`, time: `Today ${now}` }] };
      updateMeetingSection(meetingId, collabId, sectionKey, (tasks: any) => [...tasks, newTask]);
    }
    setTaskModal(null);
  }

  function handleDeleteTask(taskId: string): void {
    if (!taskModal) return;
    const { collabId, sectionKey, meetingId } = taskModal;
    updateMeetingSection(meetingId, collabId, sectionKey, (tasks: any) => tasks.filter((t: any) => t.id !== taskId));
    setTaskModal(null);
  }

  function handleDropTask(e: any, meetingId: string, toCollabId: string, toSection: string): void {
    const taskId = e.dataTransfer.getData("taskId");
    const fromSection = e.dataTransfer.getData("fromSection");
    if (!taskId || !fromSection) return;

    let droppedTask = null;
    const meeting = getMeeting(meetingId);
    if (!meeting) return;

    let fromCollabId = null;
    for (const [cid, sections] of Object.entries(meeting.sections)) {
      for (const [sk, tasks] of Object.entries(sections)) {
        const found = (tasks as any)?.find((t: any) => t.id === taskId);
        if (found) { droppedTask = found; fromCollabId = cid; break; }
      }
      if (droppedTask) break;
    }
    if (!droppedTask || (fromCollabId === toCollabId && fromSection === toSection)) return;

    updateMeetingSection(meetingId, fromCollabId!, fromSection, (tasks: any) => tasks.filter((t: any) => t.id !== taskId));
    const collab = collaborators.find(c => c.id === fromCollabId);
    const histEntry = { text: `Moved from <em>${SECTION_LABELS[fromSection as keyof typeof SECTION_LABELS]}</em> → <em>${SECTION_LABELS[toSection as keyof typeof SECTION_LABELS]}</em>`, time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) };
    const updTask = { ...droppedTask, history: [...(droppedTask.history || []), histEntry] };
    updateMeetingSection(meetingId, toCollabId, toSection, (tasks: any) => [...tasks, updTask]);
    if (!isTL) addNotification(`<strong>${collab?.name}</strong> moved <em>${droppedTask.title}</em> to <em>${SECTION_LABELS[toSection as keyof typeof SECTION_LABELS]}</em>`, "↕");
  }

  // ─── DASHBOARD ────────────────────────────────────────────────────────────

  function DashboardTab() {
    let totalTasks, activeMeetings, activeProjects;
    
    if (isTL) {
      totalTasks = meetings.reduce((acc, m) => {
        return acc + Object.values(m.sections).reduce((a2, sec: any) => a2 + SECTION_KEYS.reduce((a3, k) => a3 + (sec[k]?.length || 0), 0), 0);
      }, 0);
      activeMeetings = meetings.length;
      activeProjects = projects.length;
    } else {
      totalTasks = meetings.reduce((acc, m) => {
        const mySection = (m.sections as any)[collabUserId];
        if (!mySection) return acc;
        return acc + SECTION_KEYS.reduce((a, k) => a + (mySection[k]?.length || 0), 0);
      }, 0);
      
      activeMeetings = meetings.filter(m => (m.sections as any)[collabUserId]).length;
      
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
            const myCollab = collaborators.find(c => c.id === collabUserId);
            const mySubproject = allSubprojects.find(s => s.id === myCollab?.subprojectId);
            const myProject = projects.find(p => p.id === mySubproject?.projectId);
            return myProject ? [myProject] : [];
          })()).map(p => {
            const collabs = getCollabsForProject(p.id);
            const projectMeetings = meetings.filter(m => m.projectId === p.id);
            return (
              <div key={p.id} className="project-card" style={{ "--card-color": p.color } as any}
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
                const myName = currentUser.name?.split(" ")[0];
                return n.text?.includes(`<strong>${myName}`) || n.text?.includes(`<strong>${currentUser.name}`);
              }).slice(0, 5)
          ).map((notif: any) => (
            <div key={notif.id} className={`notif-item ${notif.read ? '' : 'unread'}`}>
              <div className={`notif-dot ${notif.read ? 'read' : ''}`}></div>
              <div className="notif-text" dangerouslySetInnerHTML={{ __html: notif.text }}></div>
              <div className="notif-time">{notif.time}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── MAIN RENDER ────────────────────────────────────────────────────────────

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-mark">W</div>
            <div>
              <div className="logo-text">WeekTrack</div>
              <div className="logo-sub">v1.0</div>
            </div>
          </div>
          <div className="sidebar-nav">
            <div className="nav-section-title">Navigation</div>
            <div className={`nav-item ${view === "dashboard" ? "active" : ""}`} onClick={() => setView("dashboard")}>
              <span className="nav-icon">📊</span>
              <span>Dashboard</span>
            </div>
            <div className={`nav-item ${view === "projects" ? "active" : ""}`} onClick={() => setView("projects")}>
              <span className="nav-icon">📁</span>
              <span>Projects</span>
            </div>
            <div className={`nav-item ${view === "meetings" ? "active" : ""}`} onClick={() => setView("meetings")}>
              <span className="nav-icon">📅</span>
              <span>Meetings</span>
            </div>
            <div className={`nav-item ${view === "notifications" ? "active" : ""}`} onClick={() => setView("notifications")}>
              <span className="nav-icon">🔔</span>
              <span>Notifications</span>
            </div>
          </div>
          <div className="sidebar-user">
            <div className="avatar" style={{ background: userColor }}>
              {loggedInUser?.name?.split(" ").map((n: string) => n[0]).join("")}
            </div>
            <div>
              <div className="user-name">{loggedInUser?.name}</div>
              <div className="user-role">{loggedInUser?.role}</div>
            </div>
          </div>
        </div>

        <div className="main">
          <div className="topbar">
            <div className="topbar-title">
              {view === "dashboard" && "Dashboard"}
              {view === "projects" && "Projects"}
              {view === "meetings" && "Meetings"}
              {view === "notifications" && "Notifications"}
            </div>
            <div className="topbar-sep"></div>
            <div className="topbar-meta">{loggedInUser?.name}</div>
            <div className="topbar-actions">
              <button className="notif-bell" onClick={() => setView("notifications")}>
                🔔
                {unreadCount > 0 && <div className="notif-badge"></div>}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={toggleTheme}>
                {theme === "dark" ? "☀️" : "🌙"}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
            </div>
          </div>

          <div className="content">
            {view === "dashboard" && <DashboardTab />}
            {view === "projects" && <div className="empty-state"><div className="empty-state-icon">📁</div><div className="empty-state-text">Projects management coming soon</div></div>}
            {view === "meetings" && <div className="empty-state"><div className="empty-state-icon">📅</div><div className="empty-state-text">Meetings view coming soon</div></div>}
            {view === "notifications" && <div className="empty-state"><div className="empty-state-icon">🔔</div><div className="empty-state-text">Notifications view coming soon</div></div>}
          </div>
        </div>
      </div>
    </>
  );
}
