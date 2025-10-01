import { NextRequest } from 'next/server';
import { db, dbConfigured } from '../../../lib/db';
import { runs } from '../../../lib/schema';
import { TENANT_DEFAULT } from '../../../lib/config';
import { getCurrentUser } from '../../../lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  const body = await req.json().catch(() => ({}));
  const address = (body?.address as string) || '';

  // TODO: OS Places → resolve UPRN
  // TODO: Lookup LPA/designations
  // TODO: Call PlanIt
  // TODO: Assemble context; call LLM
  // TODO: Persist evidence, policy citations, generated docs

  const uprn = 'UPRN-STUB';
  const id = uuidv4();
  if (dbConfigured) {
    await db.insert(runs).values({
      id,
      tenant_id: TENANT_DEFAULT,
      uprn,
      user_id: user.id,
      status: 'created',
      model: 'stub',
      prompt_version: 'dev-0'
    });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      run: { id, uprn, status: 'created' },
      address,
      notes: 'Stubbed pipeline. Replace with real integrations.'
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

