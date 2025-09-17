import crypto from 'crypto';

export type TenantScope = { tenantId: Buffer };

export function parseUuidToBuffer(uuid: string): Buffer {
  //32 or 36 bit UUID
  const hex = uuid.replace(/-/g, '');
  if (hex.length !== 32) throw new Error('UUID must be 16 bytes');
  return Buffer.from(hex, 'hex');
}

export function generateTenantId(): Buffer {
  return crypto.randomBytes(16);
}


export async function resolveTenantIdFromShopDomain(shopDomain: string): Promise<Buffer> {

  const hash = crypto.createHash('sha256').update(shopDomain).digest();
  return hash.subarray(0, 16);
}


