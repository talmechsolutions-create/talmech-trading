import { logAdminAction } from '@/lib/proDb';
import { sanitizeString } from '@/lib/validation';

type AuditInput = {
  actor?: string;
  action: string;
  entity?: string;
  entityId?: string;
  note?: string;
  raw?: Record<string, unknown>;
};

const secretKeyPattern = /password|secret|token|key|otp|authorization|cookie|session/i;

function redact(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.slice(0, 20).map(redact);
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      secretKeyPattern.test(key) ? '[REDACTED]' : redact(entry),
    ])
  );
}

export async function auditAdminAction(input: AuditInput) {
  const actor = sanitizeString(input.actor || 'admin', 120);
  const action = sanitizeString(input.action, 120);
  const entity = sanitizeString(input.entity, 120);
  const entityId = sanitizeString(input.entityId, 120);
  const note = sanitizeString(input.note, 500);
  const raw = input.raw ? redact(input.raw) : undefined;

  console.info('ADMIN_AUDIT', { actor, action, entity, entityId, note, raw });

  try {
    await logAdminAction(actor, action, entity, entityId, note);
  } catch (error) {
    console.warn('ADMIN_AUDIT_DB_WRITE_FAILED', error);
  }
}
