import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const results: any = {};

  // Check all tables
  const tables = ['users', 'projects', 'subprojects', 'collaborators', 'meetings'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(5);
    results[t] = { count: data?.length, sample: data?.[0], error: error?.message };
  }

  // Test insert into projects
  if (req.method === 'POST' && req.body?.testInsert) {
    const testId = `test_${Date.now()}`;
    const { error } = await supabase.from('projects').insert([{
      id: testId, tl_id: 'test_tl', name: 'Test Project', code: 'TEST', color: '#E8531D', date_from: '2025-01-01', date_to: ''
    }]);
    results.testInsert = { error: error?.message || 'OK' };
    if (!error) await supabase.from('projects').delete().eq('id', testId);
  }

  return res.json(results);
}
