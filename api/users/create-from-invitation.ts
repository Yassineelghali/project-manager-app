import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { token, name, password, department, team } = req.body;
  if (!token || !name || !password) return res.status(400).json({ error: 'Missing required fields' });

  const { data: invitation, error: invError } = await supabase
    .from('invitation_tokens').select('*').eq('token', token).single();
  if (invError || !invitation) return res.status(404).json({ error: 'Invitation not found' });
  if (invitation.accepted_at) return res.status(400).json({ error: 'Invitation already used' });

  const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const collabId = `c_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const { error: userError } = await supabase.from('users').insert([{
    id: userId, name,
    email: invitation.email,
    password,
    role: 'Collaborator',
    department: department || '',
    team: team || '',
    join_date: new Date().toISOString(),
    collab_id: collabId,
    tl_id: invitation.tl_id,
    subproject_id: invitation.subproject_id
  }]);

  if (userError) {
    console.error('Insert error:', userError);
    return res.status(500).json({ error: 'Failed to create user', details: userError.message });
  }

  await supabase.from('invitation_tokens')
    .update({ accepted_at: new Date().toISOString() })
    .eq('token', token);

  return res.json({
    success: true, userId, collabId,
    tlId: invitation.tl_id,
    subprojectId: invitation.subproject_id,
    email: invitation.email
  });
}
