import { NextRequest } from 'next/server';
import { apiError } from '@/lib/security/apiResponse';
import { requireIndustrialPermission } from '@/lib/security/industrialPermissions';

export function requireIndustrialViewApi(req: NextRequest) {
  const access = requireIndustrialPermission(req, 'industrial_intelligence.view');
  if (!access.ok) return { ok: false as const, response: apiError(access.code, access.message, access.status) };
  return { ok: true as const, actor: access.actor };
}

export const industrialNoStoreHeaders = {
  'cache-control': 'no-store, private',
};

export function industrialApiFailure(error: unknown) {
  console.error('INDUSTRIAL_INTELLIGENCE_API_FAILED', error);
  return apiError('INDUSTRIAL_INTELLIGENCE_API_FAILED', 'Unable to load Industrial Intelligence data.', 500);
}
