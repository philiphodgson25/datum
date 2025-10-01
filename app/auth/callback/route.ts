import { redirect } from 'next/navigation';
import { createServerClient } from '../../../lib/supabase.server';

export async function GET(req: Request) {
  const supabase = createServerClient();
  await supabase.auth.exchangeCodeForSession(req.url);
  redirect('/runs');
}

