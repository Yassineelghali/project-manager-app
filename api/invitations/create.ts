import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, subprojectId, tlId } = req.body;
  if (!email || !subprojectId || !tlId) return res.status(400).json({ error: 'Missing required fields' });
  const token = Math.random().toString(36).slice(2,15) + Math.random().toString(36).slice(2,15);
  const { error } = await supabase.from('invitation_tokens').insert([{ token, email, subproject_id: subprojectId, tl_id: tlId, created_at: new Date().toISOString(), accepted_at: null }]);
  if (error) return res.status(500).json({ error: 'Failed to create invitation', details: error.message });
  const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  return res.json({ token, inviteLink: `${base}?invite=${token}` });
}
