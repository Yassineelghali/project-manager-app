import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { token, name, password, department, team } = req.body;
  if (!token || !name || !password) return res.status(400).json({ error: 'Missing required fields' });

  const { data: invitation, error: invError } = await supabase
    .from('invitation_tokens').select('*').eq('token', token).single();

  if (invError || !invitation) return res.status(404).json({ error: 'Invitation not found' });
  if (invitation.acceptedAt) return res.status(400).json({ error: 'Invitation already used' });

  const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const collabId = `c_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const { error: userError } = await supabase.from('users').insert([{
    id: userId, name,
    email: invitation.email,
    password,
    role: 'Collaborator',
    department: department || '',
    team: team || '',
    joinDate: new Date().toISOString(),
    collabId,
    tlId: invitation.tlId,
    subprojectId: invitation.subprojectId
  }]);

  if (userError) return res.status(500).json({ error: 'Failed to create user' });

  await supabase.from('invitation_tokens')
    .update({ acceptedAt: new Date().toISOString() })
    .eq('token', token);

  return res.json({ success: true, userId, collabId, tlId: invitation.tlId, subprojectId: invitation.subprojectId, email: invitation.email });
}
