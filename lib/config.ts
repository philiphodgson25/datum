export const TENANT_DEFAULT = '00000000-0000-0000-0000-000000000000';

export function assertTenant<T extends { tenant_id: string | null | undefined }>(
  row: T,
  tenantId: string
): asserts row is T & { tenant_id: string } {
  if (!row.tenant_id) {
    throw new Error('Missing tenant_id');
  }
  if (row.tenant_id !== tenantId) {
    throw new Error('Tenant mismatch');
  }
}

