import { NextRequest, NextResponse } from 'next/server';
import { changeAdminAssistedAccountPassword } from '@/lib/adminAssistedAccounts';
import { getClientSessionUser } from '@/lib/clientAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await getClientSessionUser(req);
  if (!user) return NextResponse.json({ ok: false, error: 'Client sign-in required.' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const result = await changeAdminAssistedAccountPassword(
    user.id,
    String(body.currentPassword || ''),
    String(body.newPassword || '')
  );
  return NextResponse.json(result, { status: result.ok ? 200 : result.status || 400 });
}
