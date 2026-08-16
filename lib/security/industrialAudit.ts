import { randomUUID } from 'crypto';
import { prisma } from '@/lib/proDb';
import { sanitizeString } from '@/lib/validation';

type IndustrialAuditInput = {
  actor?: string;
  action: string;
  entity?: string;
  entityId?: string;
  requestId?: string;
  importBatchId?: string;
  companyId?: string;
  plantId?: string;
  contactId?: string;
  serviceOpportunityId?: string;
  note?: string;
  raw?: Record<string, unknown>;
};

const sensitiveKeyPattern = /password|secret|token|key|otp|authorization|cookie|session|phone|mobile|whatsapp|email/i;

function redact(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.slice(0, 25).map(redact);
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      sensitiveKeyPattern.test(key) ? '[REDACTED]' : redact(entry),
    ]),
  );
}

export async function auditIndustrialAction(input: IndustrialAuditInput) {
  const event = {
    id: `IAUD-${randomUUID()}`,
    actor: sanitizeString(input.actor || 'admin', 120),
    action: sanitizeString(input.action, 140),
    entity: sanitizeString(input.entity, 120) || null,
    entityId: sanitizeString(input.entityId, 120) || null,
    requestId: sanitizeString(input.requestId, 180) || null,
    importBatchId: sanitizeString(input.importBatchId, 120) || null,
    companyId: sanitizeString(input.companyId, 120) || null,
    plantId: sanitizeString(input.plantId, 120) || null,
    contactId: sanitizeString(input.contactId, 120) || null,
    serviceOpportunityId: sanitizeString(input.serviceOpportunityId, 120) || null,
    note: sanitizeString(input.note, 700) || null,
    raw: input.raw ? redact(input.raw) : undefined,
  };

  console.info('INDUSTRIAL_AUDIT', event);

  try {
    await (prisma as any).industrialAuditEvent.create({ data: event });
  } catch (error) {
    console.warn('INDUSTRIAL_AUDIT_DB_WRITE_FAILED', error);
  }
}
