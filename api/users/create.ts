import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, password, department, team, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { data: existing } = await supabase
    .from('users').select('id').eq('email', email).single();

  if (existing) return res.status(400).json({ error: 'Email already in use' });

  const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const { error } = await supabase.from('users').insert([{
    id: userId, name, email, password,
    role: role || 'TL',
    department: department || '',
    team: team || '',
    joinDate: new Date().toISOString()
  }]);

  if (error) return res.status(500).json({ error: 'Failed to create user' });

  return res.json({ success: true, userId, email });
}
