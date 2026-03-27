import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const results: any = { env: {}, tests: {} };

  results.env = {
    hasUrl: !!process.env.VITE_SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Test 1: list all invitation tokens
    const { data: tokens, error: tokensError } = await supabase
      .from('invitation_tokens').select('token, email, tl_id, accepted_at').limit(10);
    results.tests.invitation_tokens = { count: tokens?.length, tokens, error: tokensError };

    // Test 2: insert + retrieve a test invitation
    const testToken = `test_${Date.now()}`;
    const { error: insertErr } = await supabase.from('invitation_tokens').insert([{
      token: testToken,
      email: 'test@test.com',
      subproject_id: 'sp1',
      tl_id: 'tl1',
      created_at: new Date().toISOString(),
      accepted_at: null
    }]);
    results.tests.insert_invitation = { error: insertErr };

    if (!insertErr) {
      const { data: found, error: findErr } = await supabase
        .from('invitation_tokens').select('*').eq('token', testToken).single();
      results.tests.retrieve_invitation = { found, error: findErr };
      // cleanup
      await supabase.from('invitation_tokens').delete().eq('token', testToken);
    }

  } catch (err: any) {
    results.exception = err.message;
  }

  return res.json(results);
}
