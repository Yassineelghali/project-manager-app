import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const results: any = {};
  results.env = {
    hasUrl: !!process.env.VITE_SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    url: process.env.VITE_SUPABASE_URL?.slice(0, 30) + '...',
  };

  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase.from('users').select('id').limit(1);
    results.select = { data, error };

    const testId = `debug_${Date.now()}`;
    const { error: insertError } = await supabase.from('users').insert([{
      id: testId,
      name: 'Debug Test',
      email: `debug_${Date.now()}@test.com`,
      password: 'test',
      role: 'TL',
      department: '',
      team: 'test',
      join_date: new Date().toISOString()
    }]);
    results.insert = { error: insertError };

    if (!insertError) {
      await supabase.from('users').delete().eq('id', testId);
      results.cleanup = 'ok';
    }
  } catch (err: any) {
    results.exception = err.message;
  }

  return res.json(results);
}
