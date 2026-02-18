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

const DEPARTMENTS_TEAMS = {
  ESW: { name: "ESW", teams: ["EE", "DAI", "SW Coding", "SMBD"] },
  VSP: { name: "VSP", teams: ["CT1", "CT2", "CT3", "SD1", "SD2", "VAH"] },
  MDS: { name: "MDS", teams: ["SD", "MS", "CD&I"] }
};

const AVL_LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310419663030990083/MraiIlghFkQrjJjT.png";

function genId() { return Math.random().toString(36).slice(2, 9); }
function fmtDate(d: any) { return d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—"; }
function today() { return new Date().toISOString().slice(0, 10); }

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;600;700;800&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --mono: 'DM Mono', monospace;
    --sans: 'IBM Plex Sans', sans-serif;
    --display: 'Syne', sans-serif;
  }

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
  .btn-sm { padding: 4px 10px; font-size: 11px; }

  .content { flex: 1; overflow-y: auto; padding: 24px; }

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
`;

const USERS_DB = [
  { id: "tl1", name: "Marie Leclerc", initials: "ML", email: "m.leclerc@weektrack.io", role: "TL", password: "tl1234", color: "#00A8CC", department: "Engineering", team: "Powertrain Team", joinDate: "2023-06-01", collabId: null },
  { id: "tl2", name: "Thomas Bernard", initials: "TB", email: "t.bernard@weektrack.io", role: "TL", password: "tl5678", color: "#2E5EAA", department: "Engineering", team: "ADAS Team", joinDate: "2022-11-15", collabId: null },
  { id: "c1",  name: "Yassine Mansouri", initials: "YM", email: "y.mansouri@weektrack.io", role: "Collaborator", password: "collab1", color: "#64B4DC", department: "Powertrain ECU", team: "Powertrain Team", joinDate: "2024-01-15", collabId: "c1" },
  { id: "c2",  name: "Inès Boudali", initials: "IB", email: "i.boudali@weektrack.io", role: "Collaborator", password: "collab2", color: "#1DD3B0", department: "Powertrain ECU", team: "Powertrain Team", joinDate: "2024-03-05", collabId: "c2" },
  { id: "c3",  name: "Karim Sefrioui", initials: "KS", email: "k.sefrioui@weektrack.io", role: "Collaborator", password: "collab3", color: "#2E5EAA", department: "ADAS Integration", team: "ADAS Team", joinDate: "2025-01-10", collabId: "c3" },
  { id: "c4",  name: "Lina Ouhabi", initials: "LO", email: "l.ouhabi@weektrack.io", role: "Collaborator", password: "collab4", color: "#64B4DC", department: "ADAS Integration", team: "ADAS Team", joinDate: "2025-01-20", collabId: "c4" },
];

function LoginScreen({ onLogin }: { onLogin: (user: any) => void }) {
      const [mode, setMode] = useState<string>("login");
      const [email, setEmail] = useState<string>("");
      const [password, setPassword] = useState<string>("");
      const [showPass, setShowPass] = useState<boolean>(false);
      const [error, setError] = useState<string>("");
      const [loading, setLoading] = useState<boolean>(false);

  function handleLogin(e: any) {
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

  function quickLogin(user: any) {
    setEmail(user.email);
    setPassword(user.password);
    setError("");
    setLoading(true);
    setTimeout(() => { onLogin(user); setLoading(false); }, 400);
  }

  return (
    <div className="login-screen" style={{ minHeight: "100vh", display: "flex", background: "var(--bg)", position: "relative", overflow: "hidden" }}>
      <div style={{
        width: 420, minWidth: 420, background: "var(--bg2)",
        borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "60px 48px", position: "relative", zIndex: 2,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
          <img src={AVL_LOGO_URL} alt="AVL Logo" style={{ width: 100, height: 48, objectFit: 'contain' }} />
          <div>
            <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 11, lineHeight: 1.2 }}>Meeting<br/>Tracker</div>
            <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)", marginTop: 2 }}>v1.0</div>
          </div>
        </div>

        <div style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 24, marginBottom: 6 }}>Connexion</div>
        <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 36 }}>Accédez à votre espace de suivi hebdomadaire</div>

        {error && (
          <div style={{ padding: "10px 12px", background: "rgba(255,85,85,0.08)", border: "1px solid rgba(255,85,85,0.25)", color: "#FF7A7A", fontSize: 12, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span>⚠</span> {error}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 11, fontFamily: "var(--mono)", color: "var(--text3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Adresse email</label>
          <input
            style={{ width: "100%", background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text)", fontFamily: "var(--sans)", fontSize: 13, padding: "8px 10px", outline: "none", transition: "border-color 0.15s", borderRadius: 0 }}
            type="email"
            placeholder="prenom.nom@avl.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={(e: any) => e.key === "Enter" && handleLogin(e)}
            autoFocus
          />
        </div>

        <div style={{ marginBottom: 4, position: "relative" }}>
          <label style={{ display: "block", fontSize: 11, fontFamily: "var(--mono)", color: "var(--text3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Mot de passe</label>
          <div style={{ position: "relative" }}>
            <input
              style={{ width: "100%", background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text)", fontFamily: "var(--sans)", fontSize: 13, padding: "8px 10px", paddingRight: 40, outline: "none", transition: "border-color 0.15s", borderRadius: 0 }}
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={(e: any) => e.key === "Enter" && handleLogin(e)}
            />
            <button
              onClick={() => setShowPass(s => !s)}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 14 }}
            >{showPass ? "🙈" : "👁"}</button>
          </div>
        </div>

        <button
          style={{ width: "100%", justifyContent: "center", padding: "10px", fontSize: 13, marginTop: 4, display: "inline-flex", alignItems: "center", gap: 6, background: "var(--accent)", color: "white", borderRadius: 4, border: "none", cursor: "pointer", fontFamily: "var(--sans)", fontWeight: 500, transition: "all 0.15s", whiteSpace: "nowrap" }}
          onClick={handleLogin}
          disabled={loading || !email || !password}
        >
          {loading ? "Connexion…" : "Se connecter →"}
        </button>

        <div style={{ textAlign: "center", margin: "16px 0", fontSize: 12, color: "var(--text3)" }}>
          Pas encore de compte ? <button onClick={() => setMode("signup")} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", textDecoration: "underline", fontSize: 12 }}>Créer un compte</button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0", fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }}></div>
          comptes demo
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }}></div>
        </div>

        <div style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--text3)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 10 }}>Cliquez pour vous connecter rapidement</div>
        <div>
          {USERS_DB.slice(0, 6).map(u => (
            <div key={u.id} style={{ padding: "10px 12px", border: "1px solid var(--border)", background: "var(--bg3)", cursor: "pointer", transition: "border-color 0.15s", marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }} onClick={() => quickLogin(u)}>
              <div style={{ width: 30, height: 30, background: u.color + "22", color: u.color, border: `1.5px solid ${u.color}44`, fontSize: 10, fontFamily: "var(--mono)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, borderRadius: 4 }}>
                {u.initials}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{u.name}</div>
                <div style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--text3)", marginTop: 2 }}>{u.role} · {u.team}</div>
              </div>
              <div style={{ fontSize: 10 }}>{u.email}</div>
              <div style={{ color: "var(--text3)" }}>→</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(0,168,204,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,168,204,0.08) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div style={{ position: "absolute", width: 600, height: 600, background: "radial-gradient(circle, rgba(0,168,204,0.12) 0%, transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: 40 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>Plateforme de suivi</div>
          <div style={{ fontFamily: "var(--display)", fontSize: 48, fontWeight: 800, lineHeight: 1.1, color: "var(--text)", marginBottom: 16 }}>
            Meetings<br /><span style={{ color: "var(--accent)" }}>hebdomadaires</span><br />structurés
          </div>
          <div style={{ fontSize: 14, color: "var(--text3)", maxWidth: 340, lineHeight: 1.6 }}>
            Gérez vos tâches, Open Points et collaborateurs depuis une interface unifiée pour TL et équipes.
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardTab({ projects, meetings, collaborators, notifications, isTL, currentUser }: { projects: any[]; meetings: any[]; collaborators: any[]; notifications: any[]; isTL: boolean; currentUser: any }) {
  const totalTasks = meetings.reduce((acc: number, m: any) => {
    return acc + Object.values(m.sections as any).reduce((a2: number, sec: any) => a2 + Object.values(sec as any).reduce((a3: number, arr: any) => a3 + (arr?.length || 0), 0), 0);
  }, 0);

  return (
    <div>
      <div className="dash-grid">
        <div className="stat-card">
          <div className="stat-label">Active Projects</div>
          <div className="stat-value">{projects.length}</div>
          <div className="stat-sub">Projects in progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Meeting Pages</div>
          <div className="stat-value">{meetings.length}</div>
          <div className="stat-sub">Scheduled meetings</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Tasks</div>
          <div className="stat-value">{totalTasks}</div>
          <div className="stat-sub">{notifications.filter(n=>!n.read).length} unread notifications</div>
        </div>
      </div>

      <div className="section-header" style={{ marginBottom: 12 }}>
        <span className="section-title">Active Projects</span>
      </div>
      <div className="project-cards">
        {projects.map(p => (
          <div key={p.id} className="project-card" style={{ "--card-color": p.color } as any}>
            <div className="project-card-code">{p.code}</div>
            <div className="project-card-name">{p.name}</div>
            <div className="project-card-meta">
              <span>{collaborators.filter((c: any) => p.subprojects.some((s: any) => s.id === c.subprojectId)).length} collaborators</span>
              <span>{meetings.filter((m: any) => m.projectId === p.id).length} meetings</span>
              <span>{fmtDate(p.date_from)} → {p.date_to ? fmtDate(p.date_to) : "ongoing"}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="section-header" style={{ marginBottom: 12 }}>
        <span className="section-title">Recent Activity</span>
      </div>
      <div className="notif-list">
        {notifications.slice(0, 5).map(n => (
          <div key={n.id} className={`notif-item ${n.read ? "" : "unread"}`}>
            <div className={`notif-dot ${n.read ? "read" : ""}`} />
            <div className="notif-text" dangerouslySetInnerHTML={{ __html: n.text }} />
            <div className="notif-time">{n.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('weektrack-theme');
    return saved || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('weektrack-theme', theme);
  }, [theme]);

  const [view, setView] = useState("dashboard");
  const [projects, setProjects] = useState<any[]>(INITIAL_PROJECTS);
  const [collaborators, setCollaborators] = useState<any[]>(INITIAL_COLLABORATORS);
  const [meetings, setMeetings] = useState<any[]>(INITIAL_MEETINGS);
  const [notifications, setNotifications] = useState<any[]>([
    { id: "n1", text: "<strong>Yassine Mansouri</strong> changed status of <em>DGO torque arbitration</em> from <strong>Open → Ongoing</strong>", time: "5m ago", read: false, icon: "↔" },
    { id: "n2", text: "<strong>Inès Boudali</strong> updated description of <em>Lambda correction model</em>", time: "1h ago", read: false, icon: "✏" },
    { id: "n3", text: "<strong>Karim Sefrioui</strong> moved <em>Sensor calibration</em> to <em>Upcoming Tasks</em>", time: "2h ago", read: true, icon: "↕" },
  ]);

  const role = loggedInUser?.role || "TL";
  const isTL = role === "TL";
  const userColor = loggedInUser?.color || "#00A8CC";

  function handleLogin(user: any) { setLoggedInUser(user); setView("dashboard"); }
  function handleLogout() { setLoggedInUser(null); }

  if (!loggedInUser) return <><style>{css}</style><LoginScreen onLogin={handleLogin} /></>;

  const NAV = isTL ? [
    { key: "dashboard", label: "Dashboard", icon: "◧" },
  ] : [
    { key: "dashboard", label: "Dashboard", icon: "◧" },
  ];

  return (
    <>
      <style>{css}</style>
      <div className="app">
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
              <div key={n.key} className={`nav-item ${view === n.key ? "active" : ""}`}
                onClick={() => { setView(n.key); }}>
                <span className="nav-icon">{n.icon}</span>
                {n.label}
              </div>
            ))}
          </nav>
          <div className="sidebar-user">
            <div className="avatar" style={{ width: 28, height: 28, background: userColor + "22", color: userColor, border: `1.5px solid ${userColor}44`, fontSize: 10 }}>
              {loggedInUser.initials}
            </div>
            <div style={{ flex: 1 }}>
              <div className="user-name">{loggedInUser.name}</div>
              <div className="user-role">{isTL ? "Team Leader" : "Collaborateur"}</div>
            </div>
          </div>
        </aside>

        <div className="main">
          <header className="topbar">
            <span className="topbar-title">Dashboard</span>
            <div className="topbar-actions">
              <button className="btn btn-ghost btn-sm" style={{ gap: 8 }} onClick={handleLogout}>
                {loggedInUser.name?.split(" ")[0]} (logout)
              </button>
            </div>
          </header>

          <div className="content">
            {view === "dashboard" && <DashboardTab projects={projects} meetings={meetings} collaborators={collaborators} notifications={notifications} isTL={isTL} currentUser={loggedInUser} />}
          </div>
        </div>
      </div>
    </>
  );
}
