import { cookies, headers } from 'next/headers';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/adminSecurity';
import { isStorageModeError } from '@/lib/storageMode';

export type AdminDataErrorInfo = {
  code: string;
  message: string;
  status: number;
};

function errorStack(error: unknown) {
  return error instanceof Error ? error.stack : undefined;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error || 'Unknown server error');
}

function errorCode(error: unknown) {
  if (isStorageModeError(error)) return error.code;
  if (error && typeof error === 'object' && typeof (error as any).code === 'string') return String((error as any).code);
  if (error && typeof error === 'object' && typeof (error as any).name === 'string') return String((error as any).name);
  return 'ADMIN_SSR_DATA_ERROR';
}

function adminUserFromCookie() {
  try {
    const token = cookies().get(ADMIN_COOKIE)?.value;
    if (!verifyAdminToken(token)) return 'unknown';
    return token?.split('.')[2] || 'admin';
  } catch {
    return 'unknown';
  }
}

function requestIdFromHeaders() {
  try {
    const h = headers();
    return h.get('x-vercel-id') || h.get('x-request-id') || h.get('x-forwarded-for') || 'local';
  } catch {
    return 'unknown';
  }
}

export function toAdminDataErrorInfo(error: unknown): AdminDataErrorInfo {
  if (isStorageModeError(error)) {
    return {
      code: error.code,
      message: error.message,
      status: error.status || 503,
    };
  }

  return {
    code: errorCode(error),
    message: 'This admin module could not load live server data. Please check the server logs and production environment configuration.',
    status: 500,
  };
}

export function logAdminSsrError(route: string, error: unknown, context: Record<string, unknown> = {}) {
  console.error('ADMIN_SSR_DATA_LOAD_FAILED', {
    route,
    user: adminUserFromCookie(),
    requestId: requestIdFromHeaders(),
    timestamp: new Date().toISOString(),
    code: errorCode(error),
    message: errorMessage(error),
    stack: errorStack(error),
    ...context,
  });
}

export async function loadAdminData<T>(
  route: string,
  loader: () => Promise<T>,
  fallback: T,
  context: Record<string, unknown> = {},
): Promise<{ data: T; error: AdminDataErrorInfo | null }> {
  try {
    return { data: await loader(), error: null };
  } catch (error) {
    logAdminSsrError(route, error, context);
    return { data: fallback, error: toAdminDataErrorInfo(error) };
  }
}
