import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function loadTlData(tlId: string) {
  const [{ data: projects }, { data: subprojects }, { data: collaborators }, { data: meetings }] = await Promise.all([
    supabase.from('projects').select('*').eq('tl_id', tlId).order('created_at'),
    supabase.from('subprojects').select('*').eq('tl_id', tlId),
    supabase.from('collaborators').select('*').eq('tl_id', tlId),
    supabase.from('meetings').select('*').eq('tl_id', tlId).order('created_at'),
  ]);

  return {
    projects: (projects || []).map((p: any) => ({
      id: p.id, name: p.name, code: p.code, color: p.color,
      date_from: p.date_from, date_to: p.date_to,
      subprojects: (subprojects || [])
        .filter((s: any) => s.project_id === p.id)
        .map((s: any) => ({ id: s.id, name: s.name, code: s.code, date_from: s.date_from, date_to: s.date_to, projectId: s.project_id }))
    })),
    collaborators: (collaborators || []).map((c: any) => ({
      id: c.id, name: c.name, initials: c.initials, email: c.email,
      subprojectId: c.subproject_id, date_from: c.date_from, date_to: c.date_to,
      changeHistory: c.change_history || [], invitationToken: c.invitation_token
    })),
    meetings: (meetings || []).map((m: any) => ({
      id: m.id, projectId: m.project_id, date: m.date, title: m.title, sections: m.sections || {}
    }))
  };
}

async function upsertProject(p: any, tlId: string) {
  return supabase.from('projects').upsert({
    id: p.id, tl_id: tlId, name: p.name || '', code: p.code || '',
    color: p.color || '#E8531D', date_from: p.date_from || '', date_to: p.date_to || ''
  }, { onConflict: 'id' });
}

async function upsertSubproject(s: any, projectId: string, tlId: string) {
  return supabase.from('subprojects').upsert({
    id: s.id, project_id: projectId, tl_id: tlId,
    name: s.name || '', code: s.code || '', date_from: s.date_from || '', date_to: s.date_to || ''
  }, { onConflict: 'id' });
}

async function upsertCollaborator(c: any, tlId: string) {
  return supabase.from('collaborators').upsert({
    id: c.id, tl_id: tlId, name: c.name || '', initials: c.initials || '',
    email: c.email || '', subproject_id: c.subprojectId || '',
    date_from: c.date_from || '', date_to: c.date_to || '',
    change_history: c.changeHistory || [], invitation_token: c.invitationToken || ''
  }, { onConflict: 'id' });
}

async function upsertMeeting(m: any, tlId: string) {
  return supabase.from('meetings').upsert({
    id: m.id, tl_id: tlId, project_id: m.projectId || '',
    date: m.date || '', title: m.title || '', sections: m.sections || {}
  }, { onConflict: 'id' });
}

async function saveTlData(tlId: string, body: any) {
  const { projects = [], collaborators = [], meetings = [] } = body;

  // Save projects + subprojects
  const projectIds: string[] = [];
  const subprojectIds: string[] = [];

  for (const p of projects) {
    projectIds.push(p.id);
    const { error } = await upsertProject(p, tlId);
    if (error) console.error('Project upsert error:', error.message, p);

    for (const s of (p.subprojects || [])) {
      subprojectIds.push(s.id);
      const { error: se } = await upsertSubproject(s, p.id, tlId);
      if (se) console.error('Subproject upsert error:', se.message, s);
    }
  }

  // Delete removed projects
  if (projectIds.length > 0) {
    await supabase.from('projects').delete().eq('tl_id', tlId).not('id', 'in', `(${projectIds.map(id => `'${id}'`).join(',')})`);
    if (subprojectIds.length > 0) {
      await supabase.from('subprojects').delete().eq('tl_id', tlId).not('id', 'in', `(${subprojectIds.map(id => `'${id}'`).join(',')})`);
    } else {
      await supabase.from('subprojects').delete().eq('tl_id', tlId);
    }
  } else {
    await supabase.from('projects').delete().eq('tl_id', tlId);
    await supabase.from('subprojects').delete().eq('tl_id', tlId);
  }

  // Save collaborators
  const collabIds: string[] = [];
  for (const c of collaborators) {
    collabIds.push(c.id);
    const { error } = await upsertCollaborator(c, tlId);
    if (error) console.error('Collaborator upsert error:', error.message, c);
  }
  if (collabIds.length > 0) {
    await supabase.from('collaborators').delete().eq('tl_id', tlId).not('id', 'in', `(${collabIds.map(id => `'${id}'`).join(',')})`);
  } else {
    await supabase.from('collaborators').delete().eq('tl_id', tlId);
  }

  // Save meetings
  const meetingIds: string[] = [];
  for (const m of meetings) {
    meetingIds.push(m.id);
    const { error } = await upsertMeeting(m, tlId);
    if (error) console.error('Meeting upsert error:', error.message, m);
  }
  if (meetingIds.length > 0) {
    await supabase.from('meetings').delete().eq('tl_id', tlId).not('id', 'in', `(${meetingIds.map(id => `'${id}'`).join(',')})`);
  } else {
    await supabase.from('meetings').delete().eq('tl_id', tlId);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { tlId } = req.query as { tlId: string };
  if (!tlId) return res.status(400).json({ error: 'Missing tlId' });

  if (req.method === 'GET') {
    try {
      const data = await loadTlData(tlId);
      return res.json({ data });
    } catch (err: any) {
      console.error('Load error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      await saveTlData(tlId, req.body);
      return res.json({ success: true });
    } catch (err: any) {
      console.error('Save error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
