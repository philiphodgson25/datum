export const dynamic = 'force-dynamic';
import { db, dbConfigured } from '../../lib/db';
import { runs } from '../../lib/schema';
import { and, desc, eq } from 'drizzle-orm';
import { TENANT_DEFAULT } from '../../lib/config';
import { getCurrentUser } from '../../lib/auth';
import { redirect } from 'next/navigation';

export default async function RunsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/sign-in');
  const rows = dbConfigured
    ? await db
        .select({ id: runs.id, uprn: runs.uprn, status: runs.status, created_at: runs.created_at })
        .from(runs)
        .where(and(eq(runs.tenant_id, TENANT_DEFAULT), eq(runs.user_id, user.id)))
        .orderBy(desc(runs.created_at))
        .limit(20)
    : [];

  return (
    <main style={{ padding: 24 }}>
      <h1>Recent runs</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>UPRN</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.uprn}</td>
              <td>{r.status}</td>
              <td>{r.created_at?.toISOString?.() || String(r.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

