import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function loadTlData(tlId: string) {
  const { data: projects } = await supabase.from('projects').select('*').eq('tl_id', tlId).order('created_at');
  const projectIds = (projects || []).map((p: any) => p.id);
  const { data: subprojects } = projectIds.length > 0
    ? await supabase.from('subprojects').select('*').in('project_id', projectIds)
    : { data: [] };
  const { data: collaborators } = await supabase.from('collaborators').select('*').eq('tl_id', tlId);
  const { data: meetings } = await supabase.from('meetings').select('*').eq('tl_id', tlId).order('created_at');

  return {
    projects: (projects || []).map((p: any) => ({
      id: p.id, name: p.name, code: p.code, color: p.color,
      date_from: p.date_from, date_to: p.date_to,
      subprojects: (subprojects || []).filter((s: any) => s.project_id === p.id).map((s: any) => ({
        id: s.id, name: s.name, code: s.code,
        date_from: s.date_from, date_to: s.date_to, projectId: s.project_id
      }))
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

async function saveTlData(tlId: string, body: any) {
  const { projects = [], collaborators = [], meetings = [] } = body;

  // Save projects
  for (const p of projects) {
    await supabase.from('projects').upsert({ id: p.id, tl_id: tlId, name: p.name, code: p.code || '', color: p.color || '#E8531D', date_from: p.date_from || '', date_to: p.date_to || '' }, { onConflict: 'id' });
    for (const s of (p.subprojects || [])) {
      await supabase.from('subprojects').upsert({ id: s.id, project_id: p.id, name: s.name, code: s.code || '', date_from: s.date_from || '', date_to: s.date_to || '' }, { onConflict: 'id' });
    }
    const subIds = (p.subprojects || []).map((s: any) => s.id);
    if (subIds.length > 0) {
      await supabase.from('subprojects').delete().eq('project_id', p.id).not('id', 'in', `(${subIds.map((id: string) => `'${id}'`).join(',')})`);
    } else {
      await supabase.from('subprojects').delete().eq('project_id', p.id);
    }
  }
  const pIds = projects.map((p: any) => p.id);
  if (pIds.length > 0) {
    await supabase.from('projects').delete().eq('tl_id', tlId).not('id', 'in', `(${pIds.map((id: string) => `'${id}'`).join(',')})`);
  } else {
    await supabase.from('projects').delete().eq('tl_id', tlId);
  }

  // Save collaborators
  for (const c of collaborators) {
    await supabase.from('collaborators').upsert({ id: c.id, tl_id: tlId, name: c.name, initials: c.initials || '', email: c.email || '', subproject_id: c.subprojectId || null, date_from: c.date_from || '', date_to: c.date_to || '', change_history: c.changeHistory || [], invitation_token: c.invitationToken || null }, { onConflict: 'id' });
  }
  const cIds = collaborators.map((c: any) => c.id);
  if (cIds.length > 0) {
    await supabase.from('collaborators').delete().eq('tl_id', tlId).not('id', 'in', `(${cIds.map((id: string) => `'${id}'`).join(',')})`);
  } else {
    await supabase.from('collaborators').delete().eq('tl_id', tlId);
  }

  // Save meetings
  for (const m of meetings) {
    await supabase.from('meetings').upsert({ id: m.id, tl_id: tlId, project_id: m.projectId, date: m.date, title: m.title, sections: m.sections || {} }, { onConflict: 'id' });
  }
  const mIds = meetings.map((m: any) => m.id);
  if (mIds.length > 0) {
    await supabase.from('meetings').delete().eq('tl_id', tlId).not('id', 'in', `(${mIds.map((id: string) => `'${id}'`).join(',')})`);
  } else {
    await supabase.from('meetings').delete().eq('tl_id', tlId);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { tlId } = req.query as { tlId: string };
  if (!tlId) return res.status(400).json({ error: 'Missing tlId' });
  if (req.method === 'GET') {
    try { return res.json({ data: await loadTlData(tlId) }); }
    catch (err: any) { return res.status(500).json({ error: err.message }); }
  }
  if (req.method === 'POST') {
    try { await saveTlData(tlId, req.body); return res.json({ success: true }); }
    catch (err: any) { return res.status(500).json({ error: err.message }); }
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
