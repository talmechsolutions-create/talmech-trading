import { NextResponse } from 'next/server';
import { ADMIN_COOKIE } from '@/lib/adminSecurity';
import { auditAdminAction } from '@/lib/security/auditLog';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, '', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 });
  await auditAdminAction({ actor: 'admin', action: 'ADMIN_LOGOUT', entity: 'AdminSession' });
  return res;
}
