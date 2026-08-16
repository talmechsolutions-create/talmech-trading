import { NextRequest } from 'next/server';
import { ADMIN_COOKIE, adminUsername, verifyAdminToken } from '@/lib/adminSecurity';

export const industrialPermissions = [
  'industrial_intelligence.view',
  'industrial_intelligence.edit',
  'industrial_intelligence.verify',
  'industrial_intelligence.import',
  'industrial_intelligence.resolve_duplicates',
  'industrial_intelligence.promote_outreach',
  'industrial_intelligence.promote_crm',
  'industrial_intelligence.admin',
] as const;

export type IndustrialPermission = (typeof industrialPermissions)[number];

const industrialPermissionSet = new Set<string>(industrialPermissions);

const defaultPermissions: IndustrialPermission[] = ['industrial_intelligence.view'];

function configuredPermissions() {
  const raw = process.env.INDUSTRIAL_INTELLIGENCE_PERMISSIONS || '';
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function isIndustrialPermission(value: unknown): value is IndustrialPermission {
  return industrialPermissionSet.has(String(value || ''));
}

export function hasIndustrialPermission(permission: IndustrialPermission, granted = configuredPermissions()) {
  const allowed = new Set(granted.length ? granted : defaultPermissions);
  return allowed.has('*') || allowed.has('industrial_intelligence.admin') || allowed.has(permission);
}

export function industrialAdminFromRequest(req: NextRequest) {
  return industrialAdminFromToken(req.cookies.get(ADMIN_COOKIE)?.value);
}

export function industrialAdminFromToken(token?: string) {
  if (!verifyAdminToken(token)) return null;
  return {
    username: token?.split('.')[2] || adminUsername(),
    permissions: configuredPermissions().filter(isIndustrialPermission),
  };
}

export function requireIndustrialPermission(req: NextRequest, permission: IndustrialPermission) {
  return requireIndustrialPermissionForToken(req.cookies.get(ADMIN_COOKIE)?.value, permission);
}

export function requireIndustrialPermissionForToken(token: string | undefined, permission: IndustrialPermission) {
  const actor = industrialAdminFromToken(token);
  if (!actor) {
    return {
      ok: false as const,
      status: 401,
      code: 'ADMIN_AUTH_REQUIRED',
      message: 'Admin authentication required.',
    };
  }

  if (!hasIndustrialPermission(permission, actor.permissions)) {
    return {
      ok: false as const,
      status: 403,
      code: 'INDUSTRIAL_PERMISSION_REQUIRED',
      message: `Permission required: ${permission}`,
      actor,
    };
  }

  return { ok: true as const, actor };
}
