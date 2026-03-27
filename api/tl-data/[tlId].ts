import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { tlId } = req.query as { tlId: string };

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('tl_app_data')
      .select('data')
      .eq('tl_id', tlId)
      .maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ data: data?.data || null });
  }

  if (req.method === 'POST') {
    const { error } = await supabase
      .from('tl_app_data')
      .upsert({ tl_id: tlId, data: req.body }, { onConflict: 'tl_id' });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
