import 'server-only';
import { createServerClient } from './supabase.server';
import { TENANT_DEFAULT } from './config';
import { db } from './db';
import { users } from './schema';
import { eq } from 'drizzle-orm';

export type CurrentUser = { id: string; email: string | null; tenant_id: string };

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = createServerClient();
  const { data: session } = await supabase.auth.getUser();
  const user = session.user;
  if (!user) return null;

  const email = user.email ?? null;
  // Upsert user into our DB
  try {
    const existing = await db.select().from(users).where(eq(users.id, user.id));
    if (existing.length === 0) {
      await db
        .insert(users)
        .values({ id: user.id, email: email ?? 'unknown@example.com', tenant_id: null });
    } else if (email && existing[0]?.email !== email) {
      await db.update(users).set({ email }).where(eq(users.id, user.id));
    }
  } catch {
    // ignore if DB is not configured
  }

  return { id: user.id, email, tenant_id: TENANT_DEFAULT };
}

