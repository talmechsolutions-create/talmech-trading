import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/adminSecurity';
import { createAdminAssistedAccount } from '@/lib/adminAssistedAccounts';
import { auditAdminAction } from '@/lib/security/auditLog';
import { publicStorageError } from '@/lib/storageMode';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: { submissionId: string };
};

function requireAdmin(req: NextRequest) {
  return verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value);
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ ok: false, error: 'Admin authentication required.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  try {
    const result = await createAdminAssistedAccount(params.submissionId, body);
    if (result.ok) {
      await auditAdminAction({
        action: 'ADMIN_CREATE_ACCOUNT',
        entity: 'WhatsappUpload',
        entityId: params.submissionId,
        note: `account:${(result as any).account?.id || (result as any).user?.id || ''}`,
      });
    }
    return NextResponse.json(result, { status: result.ok ? 200 : result.status || 400 });
  } catch (error) {
    const storageError = publicStorageError(error);
    if (storageError) return NextResponse.json(storageError, { status: storageError.status });
    return NextResponse.json({ ok: false, error: 'Unable to create account.' }, { status: 500 });
  }
}
