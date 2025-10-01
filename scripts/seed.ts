// import { db } from '../lib/db';
// import { TENANT_DEFAULT } from '../lib/config';

async function main() {
  // Tenant table removed for MVP; users.tenant_id is nullable
  // Seed script is now a no-op stub
  // eslint-disable-next-line no-console
  console.log('Seed: no-op (tenant_id is nullable; no default tenant needed)');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });

