import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, password, department, team, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check existing — use maybeSingle() instead of single() to avoid errors when no row found
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existing) return res.status(400).json({ error: 'Email already in use' });

  const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const userRole = role || 'TL';

  const { error } = await supabase.from('users').insert([{
    id: userId,
    name,
    email,
    password,
    role: userRole,
    department: department || '',
    team: team || '',
    joinDate: new Date().toISOString(),
    collabId: userRole === 'Collaborator' ? `c_${Date.now()}` : null
  }]);

  if (error) {
    console.error('Supabase insert error:', error);
    return res.status(500).json({ error: 'Failed to create user', details: error.message });
  }

  return res.json({ success: true, userId, email, role: userRole });
}
