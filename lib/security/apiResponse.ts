import { NextResponse } from 'next/server';

export type ApiErrorPayload = {
  ok: false;
  code: string;
  message: string;
};

export function apiOk<T extends Record<string, unknown>>(data: T = {} as T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, ...data }, init);
}

export function apiError(code: string, message: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, code, message, ...extra }, { status });
}

export function apiInternalError(error: unknown, code = 'INTERNAL_ERROR', message = 'Something went wrong.') {
  console.error(code, error);
  return apiError(code, message, 500);
}
