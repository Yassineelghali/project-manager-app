import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { token } = req.query as { token: string };

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('invitation_tokens').select('*').eq('token', token).single();
    if (error || !data) return res.status(404).json({ error: 'Invitation not found' });
    // Return camelCase for frontend compatibility
    return res.json({
      ...data,
      subprojectId: data.subproject_id,
      tlId: data.tl_id,
      acceptedAt: data.accepted_at,
      createdAt: data.created_at
    });
  }

  if (req.method === 'POST') {
    const { error } = await supabase
      .from('invitation_tokens')
      .update({ accepted_at: new Date().toISOString() })
      .eq('token', token);
    if (error) return res.status(500).json({ error: 'Failed to accept invitation' });
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
