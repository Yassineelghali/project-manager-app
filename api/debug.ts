import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const results: any = {};

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. List all tl_app_data rows
  const { data: tlData, error: tlError } = await supabase
    .from('tl_app_data').select('tl_id, updated_at, data');
  results.tl_app_data = { rows: tlData, error: tlError };

  // 2. Test upsert into tl_app_data
  const testTlId = 'debug_tl_test';
  const { error: upsertError } = await supabase
    .from('tl_app_data')
    .upsert({ tl_id: testTlId, data: { projects: [], meetings: [], collaborators: [] } }, { onConflict: 'tl_id' });
  results.upsert_test = { error: upsertError };

  // cleanup
  await supabase.from('tl_app_data').delete().eq('tl_id', testTlId);

  // 3. List all users with their tl_id
  const { data: users } = await supabase.from('users').select('id, name, role, tl_id, collab_id');
  results.users = users;

  return res.json(results);
}
