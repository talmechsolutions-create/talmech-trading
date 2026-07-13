import { promises as fs } from 'fs';
import path from 'path';
import { sendOrQueueEmail } from '@/lib/email';
import { csv, readJsonArray, writeJsonArray } from '@/lib/marketplaceStore';
import {
  defaultTemplateForBusinessType,
  normalizeBusinessType,
  normalizeConsentStatus,
  normalizeOutreachStatus,
  normalizeTemplateId,
  outreachIndustryTags,
  renderOutreachEmail,
  renderWhatsAppMessage,
  whatsappClickToChat,
} from '@/lib/outreachTemplates';
import { prisma, useDatabase } from '@/lib/proDb';
import { isProduction, persistentStorageUnavailable, requirePersistentStorage } from '@/lib/storageMode';
import { isValidEmail, normalizeEmail, sanitizeMultiline, sanitizeString, sanitizeStringArray } from '@/lib/validation';

const dataDir = path.join(process.cwd(), 'data');
const prospectsFile = path.join(dataDir, 'outreach-prospects.json');
const suppressionsFile = path.join(dataDir, 'outreach-suppressions.json');

export type OutreachProspectInput = Record<string, unknown>;

export type OutreachProspect = {
  id: string;
  prospectId: string;
  companyName: string;
  contactPerson: string;
  designation: string;
  email: string;
  mobile: string;
  whatsappNumber: string;
  city: string;
  state: string;
  country: string;
  website: string;
  businessType: string;
  industryTags: string[];
  source: string;
  consentStatus: string;
  outreachStatus: string;
  assignedTemplate: string;
  lastEmailSentAt: string | null;
  lastWhatsappPreparedAt: string | null;
  lastFollowUpAt: string | null;
  nextFollowUpAt: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  raw?: Record<string, unknown>;
};

type ValidationIssue = {
  field: string;
  message: string;
};

type NormalizeOptions = {
  allowMissingContact?: boolean;
  keepDates?: boolean;
};

function dbProspect() {
  return (prisma as any).outreachProspect;
}

function dbSuppression() {
  return (prisma as any).outreachSuppression;
}

function clean<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as T;
}

async function withOutreachDb<T>(fn: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  if (!useDatabase()) return fallback();
  try {
    return await fn();
  } catch (error) {
    console.error('[Talmech outreach DB error]', error);
    if (isProduction()) throw persistentStorageUnavailable();
    return fallback();
  }
}

function fromDbDates(row: any): any {
  if (!row) return row;
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [
    key,
    value instanceof Date ? value.toISOString() : value,
  ]));
}

function normalizeDate(value: unknown) {
  const cleanValue = sanitizeString(value, 80);
  if (!cleanValue) return null;
  const date = new Date(cleanValue);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toDbDate(value: unknown) {
  const normalized = normalizeDate(value);
  return normalized ? new Date(normalized) : null;
}

export function normalizeOutreachPhone(value: unknown) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits.slice(-15);
}

function isValidOutreachPhone(value: unknown) {
  const digits = normalizeOutreachPhone(value);
  return !digits || (digits.length >= 7 && digits.length <= 15);
}

function normalizeWebsite(value: unknown) {
  const website = sanitizeString(value, 260);
  if (!website) return '';
  if (/^https?:\/\//i.test(website)) return website;
  return `https://${website.replace(/^\/+/, '')}`;
}

function normalizeIndustryTags(value: unknown) {
  const allowed = new Set<string>(outreachIndustryTags);
  return sanitizeStringArray(value, 16, 80)
    .map((tag) => tag.toLowerCase())
    .filter((tag) => allowed.has(tag))
    .slice(0, 16);
}

function newProspectId() {
  return `OUT-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function normalizeProspectInput(input: OutreachProspectInput, options: NormalizeOptions = {}) {
  const now = new Date().toISOString();
  const businessType = normalizeBusinessType(input.businessType);
  const email = normalizeEmail(input.email);
  const mobile = normalizeOutreachPhone(input.mobile);
  const whatsappNumber = normalizeOutreachPhone(input.whatsappNumber || input.whatsapp || input.whatsappMobile || mobile);
  const consentStatus = normalizeConsentStatus(input.consentStatus);
  const requestedStatus = normalizeOutreachStatus(input.outreachStatus || input.status);
  const outreachStatus = ['do-not-contact', 'unsubscribed'].includes(consentStatus)
    ? 'do-not-contact'
    : requestedStatus;
  const assignedTemplate = normalizeTemplateId(input.assignedTemplate || input.templateId, businessType);
  const prospectId = sanitizeString(input.prospectId || input.id, 80) || newProspectId();
  const issues: ValidationIssue[] = [];

  if (email && !isValidEmail(email)) issues.push({ field: 'email', message: 'Enter a valid email address.' });
  if ((input.mobile || input.whatsappNumber) && !isValidOutreachPhone(input.mobile || input.whatsappNumber)) {
    issues.push({ field: 'mobile', message: 'Enter a valid mobile or WhatsApp number.' });
  }
  if (!options.allowMissingContact && !email && !mobile && !whatsappNumber) {
    issues.push({ field: 'email', message: 'At least email or mobile is required.' });
  }

  const prospect: OutreachProspect = {
    id: prospectId,
    prospectId,
    companyName: sanitizeString(input.companyName || input.company || input.firmName, 180),
    contactPerson: sanitizeString(input.contactPerson || input.person || input.contactName, 140),
    designation: sanitizeString(input.designation, 140),
    email,
    mobile,
    whatsappNumber,
    city: sanitizeString(input.city, 100),
    state: sanitizeString(input.state, 100),
    country: sanitizeString(input.country, 100) || 'India',
    website: normalizeWebsite(input.website),
    businessType,
    industryTags: normalizeIndustryTags(input.industryTags),
    source: sanitizeString(input.source, 120) || 'manual entry',
    consentStatus,
    outreachStatus,
    assignedTemplate,
    lastEmailSentAt: options.keepDates ? normalizeDate(input.lastEmailSentAt) : null,
    lastWhatsappPreparedAt: options.keepDates ? normalizeDate(input.lastWhatsappPreparedAt) : null,
    lastFollowUpAt: options.keepDates ? normalizeDate(input.lastFollowUpAt) : null,
    nextFollowUpAt: normalizeDate(input.nextFollowUpAt),
    notes: sanitizeMultiline(input.notes, 2500),
    createdAt: options.keepDates ? normalizeDate(input.createdAt) || now : now,
    updatedAt: now,
    raw: {},
  };

  prospect.raw = {
    companyName: prospect.companyName,
    contactPerson: prospect.contactPerson,
    email: prospect.email,
    mobile: prospect.mobile,
    whatsappNumber: prospect.whatsappNumber,
    businessType: prospect.businessType,
    source: prospect.source,
    consentStatus: prospect.consentStatus,
    outreachStatus: prospect.outreachStatus,
  };

  return { prospect, issues };
}

function mergeForUpdate(existing: OutreachProspect, patch: OutreachProspectInput) {
  const merged = {
    ...existing,
    ...patch,
    industryTags: patch.industryTags === undefined ? existing.industryTags : patch.industryTags,
    lastEmailSentAt: patch.lastEmailSentAt === undefined ? existing.lastEmailSentAt : patch.lastEmailSentAt,
    lastWhatsappPreparedAt: patch.lastWhatsappPreparedAt === undefined ? existing.lastWhatsappPreparedAt : patch.lastWhatsappPreparedAt,
    lastFollowUpAt: patch.lastFollowUpAt === undefined ? existing.lastFollowUpAt : patch.lastFollowUpAt,
    nextFollowUpAt: patch.nextFollowUpAt === undefined ? existing.nextFollowUpAt : patch.nextFollowUpAt,
  };
  return normalizeProspectInput(merged, { allowMissingContact: true, keepDates: true });
}

function normalizeProspectRow(row: any): OutreachProspect {
  const { prospect } = normalizeProspectInput(row || {}, { allowMissingContact: true, keepDates: true });
  return {
    ...prospect,
    id: row?.id || prospect.prospectId,
    prospectId: row?.prospectId || row?.id || prospect.prospectId,
    createdAt: normalizeDate(row?.createdAt) || prospect.createdAt,
    updatedAt: normalizeDate(row?.updatedAt) || prospect.updatedAt,
    raw: row?.raw && typeof row.raw === 'object' ? row.raw : prospect.raw,
  };
}

function toDbData(prospect: OutreachProspect) {
  return clean({
    id: prospect.id,
    prospectId: prospect.prospectId,
    createdAt: new Date(prospect.createdAt),
    updatedAt: new Date(prospect.updatedAt),
    companyName: prospect.companyName,
    contactPerson: prospect.contactPerson,
    designation: prospect.designation,
    email: prospect.email,
    mobile: prospect.mobile,
    whatsappNumber: prospect.whatsappNumber,
    city: prospect.city,
    state: prospect.state,
    country: prospect.country,
    website: prospect.website,
    businessType: prospect.businessType,
    industryTags: prospect.industryTags,
    source: prospect.source,
    consentStatus: prospect.consentStatus,
    outreachStatus: prospect.outreachStatus,
    assignedTemplate: prospect.assignedTemplate,
    lastEmailSentAt: toDbDate(prospect.lastEmailSentAt),
    lastWhatsappPreparedAt: toDbDate(prospect.lastWhatsappPreparedAt),
    lastFollowUpAt: toDbDate(prospect.lastFollowUpAt),
    nextFollowUpAt: toDbDate(prospect.nextFollowUpAt),
    notes: prospect.notes,
    raw: prospect.raw || prospect,
  });
}

function companyKey(value: unknown) {
  return sanitizeString(value, 180).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function sameContact(a: OutreachProspect, b: OutreachProspect) {
  if (a.email && b.email && a.email === b.email) return true;
  if (a.mobile && b.mobile && a.mobile === b.mobile) return true;
  if (a.whatsappNumber && b.whatsappNumber && a.whatsappNumber === b.whatsappNumber) return true;
  const companyA = companyKey(a.companyName);
  const companyB = companyKey(b.companyName);
  return Boolean(companyA && companyB && companyA === companyB);
}

async function findDuplicateProspect(prospect: OutreachProspect, ignoreProspectId = '') {
  const rows = await listOutreachProspects();
  return rows.find((row: OutreachProspect) => row.prospectId !== ignoreProspectId && sameContact(row, prospect)) || null;
}

function suppressionKeys(input: Pick<OutreachProspect, 'email' | 'mobile' | 'whatsappNumber'>) {
  const keys: Array<{ identifier: string; identifierType: string }> = [];
  if (input.email) keys.push({ identifier: `email:${input.email.toLowerCase()}`, identifierType: 'email' });
  if (input.mobile) keys.push({ identifier: `phone:${normalizeOutreachPhone(input.mobile)}`, identifierType: 'phone' });
  if (input.whatsappNumber) keys.push({ identifier: `phone:${normalizeOutreachPhone(input.whatsappNumber)}`, identifierType: 'phone' });
  return keys.filter((item, index, arr) => item.identifier !== 'phone:' && arr.findIndex((x) => x.identifier === item.identifier) === index);
}

async function listSuppressions() {
  return withOutreachDb(
    async () => (await dbSuppression().findMany({ orderBy: { createdAt: 'desc' } })).map(fromDbDates),
    async () => readJsonArray(suppressionsFile),
  );
}

export async function isSuppressedContact(prospect: Pick<OutreachProspect, 'email' | 'mobile' | 'whatsappNumber'>) {
  const keys = new Set(suppressionKeys(prospect).map((item) => item.identifier));
  if (!keys.size) return false;
  const suppressions = await listSuppressions();
  return suppressions.some((row: any) => keys.has(String(row.identifier || '').toLowerCase()));
}

export async function addOutreachSuppressions(prospect: OutreachProspect, reason = 'do-not-contact') {
  const keys = suppressionKeys(prospect);
  if (!keys.length) return [];
  requirePersistentStorage();

  return withOutreachDb(async () => {
    const rows = [];
    for (const key of keys) {
      const row = await dbSuppression().upsert({
        where: { identifier: key.identifier },
        update: {
          reason,
          sourceProspectId: prospect.prospectId,
          raw: { prospectId: prospect.prospectId, reason },
        },
        create: {
          id: `SUP-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
          identifier: key.identifier,
          identifierType: key.identifierType,
          reason,
          sourceProspectId: prospect.prospectId,
          raw: { prospectId: prospect.prospectId, reason },
        },
      });
      rows.push(fromDbDates(row));
    }
    return rows;
  }, async () => {
    const rows = await readJsonArray(suppressionsFile);
    for (const key of keys) {
      const idx = rows.findIndex((row: any) => row.identifier === key.identifier);
      const row = {
        id: idx >= 0 ? rows[idx].id : `SUP-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
        createdAt: idx >= 0 ? rows[idx].createdAt : new Date().toISOString(),
        identifier: key.identifier,
        identifierType: key.identifierType,
        reason,
        sourceProspectId: prospect.prospectId,
        raw: { prospectId: prospect.prospectId, reason },
      };
      if (idx >= 0) rows[idx] = row;
      else rows.unshift(row);
    }
    await writeJsonArray(suppressionsFile, rows);
    return rows.filter((row: any) => keys.some((key) => key.identifier === row.identifier));
  });
}

export async function listOutreachProspects(filters: Record<string, string> = {}) {
  const rows = await withOutreachDb(
    async () => (await dbProspect().findMany({ orderBy: { createdAt: 'desc' } })).map(fromDbDates),
    async () => readJsonArray(prospectsFile),
  );
  const normalized: OutreachProspect[] = rows.map(normalizeProspectRow);
  return normalized.filter((row: OutreachProspect) => {
    if (filters.businessType && row.businessType !== filters.businessType) return false;
    if (filters.outreachStatus && row.outreachStatus !== filters.outreachStatus) return false;
    if (filters.city && row.city.toLowerCase() !== filters.city.toLowerCase()) return false;
    if (filters.state && row.state.toLowerCase() !== filters.state.toLowerCase()) return false;
    return true;
  });
}

export async function findOutreachProspect(prospectId: string) {
  const cleanId = sanitizeString(prospectId, 100);
  if (!cleanId) return null;
  const rows = await listOutreachProspects();
  return rows.find((row: OutreachProspect) => row.prospectId === cleanId || row.id === cleanId) || null;
}

export async function createOutreachProspect(input: OutreachProspectInput) {
  requirePersistentStorage();
  const { prospect, issues } = normalizeProspectInput(input);
  if (issues.length) return { ok: false as const, code: 'VALIDATION_ERROR', issues };

  const suppressed = await isSuppressedContact(prospect);
  if (suppressed) {
    prospect.consentStatus = 'do-not-contact';
    prospect.outreachStatus = 'do-not-contact';
  }

  const duplicate = await findDuplicateProspect(prospect);
  if (duplicate) {
    return {
      ok: false as const,
      code: 'DUPLICATE_PROSPECT',
      message: 'A prospect with the same email, mobile, WhatsApp number, or company already exists.',
      duplicate,
    };
  }

  const created = await withOutreachDb(async () => {
    const row = await dbProspect().create({ data: toDbData(prospect) });
    return normalizeProspectRow(fromDbDates(row));
  }, async () => {
    const rows = await readJsonArray(prospectsFile);
    rows.unshift(prospect);
    await writeJsonArray(prospectsFile, rows);
    return prospect;
  });

  if (created.consentStatus === 'do-not-contact' || created.outreachStatus === 'do-not-contact') {
    await addOutreachSuppressions(created, 'existing-suppression');
  }

  return { ok: true as const, prospect: created };
}

export async function updateOutreachProspect(prospectId: string, patch: OutreachProspectInput) {
  requirePersistentStorage();
  const existing = await findOutreachProspect(prospectId);
  if (!existing) return { ok: false as const, code: 'NOT_FOUND', message: 'Prospect not found.' };
  const { prospect, issues } = mergeForUpdate(existing, patch);
  if (issues.length) return { ok: false as const, code: 'VALIDATION_ERROR', issues };

  const duplicate = await findDuplicateProspect(prospect, existing.prospectId);
  if (duplicate) {
    return {
      ok: false as const,
      code: 'DUPLICATE_PROSPECT',
      message: 'A prospect with the same email, mobile, WhatsApp number, or company already exists.',
      duplicate,
    };
  }

  const updated = await withOutreachDb(async () => {
    const row = await dbProspect().update({ where: { prospectId: existing.prospectId }, data: toDbData(prospect) });
    return normalizeProspectRow(fromDbDates(row));
  }, async () => {
    const rows = await readJsonArray(prospectsFile);
    const idx = rows.findIndex((row: any) => row.prospectId === existing.prospectId || row.id === existing.id);
    if (idx < 0) return null;
    rows[idx] = { ...rows[idx], ...prospect, updatedAt: new Date().toISOString() };
    await writeJsonArray(prospectsFile, rows);
    return normalizeProspectRow(rows[idx]);
  });

  if (!updated) return { ok: false as const, code: 'NOT_FOUND', message: 'Prospect not found.' };
  if (['do-not-contact', 'unsubscribed'].includes(updated.consentStatus) || updated.outreachStatus === 'do-not-contact') {
    await addOutreachSuppressions(updated, updated.consentStatus || updated.outreachStatus);
  }
  return { ok: true as const, prospect: updated };
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

const headerMap: Record<string, string> = {
  company: 'companyName',
  companyname: 'companyName',
  firm: 'companyName',
  person: 'contactPerson',
  contact: 'contactPerson',
  contactperson: 'contactPerson',
  name: 'contactPerson',
  designation: 'designation',
  email: 'email',
  mobile: 'mobile',
  phone: 'mobile',
  whatsapp: 'whatsappNumber',
  whatsappnumber: 'whatsappNumber',
  city: 'city',
  state: 'state',
  country: 'country',
  businesstype: 'businessType',
  type: 'businessType',
  website: 'website',
  source: 'source',
  consent: 'consentStatus',
  consentstatus: 'consentStatus',
  notes: 'notes',
};

function headerKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function rowFromFlexibleLine(line: string, defaults: OutreachProspectInput) {
  const email = line.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || '';
  const phone = line.match(/(?:\+?\d[\d\s().-]{6,}\d)/)?.[0] || '';
  const website = line.match(/(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.[a-z]{2,}(?:\/\S*)?/i)?.[0] || '';
  const companyName = sanitizeString(
    line
      .replace(email, '')
      .replace(phone, '')
      .replace(website, '')
      .replace(/[|;\t]+/g, ' ')
      .replace(/\s+/g, ' '),
    180,
  );
  return {
    ...defaults,
    companyName,
    email,
    mobile: phone,
    whatsappNumber: phone,
    website,
  };
}

export function parseOutreachPaste(text: unknown, defaults: OutreachProspectInput = {}) {
  const lines = sanitizeMultiline(text, 30000)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 500);
  if (!lines.length) return [];

  const parsedRows = lines.map(parseCsvLine);
  const first = parsedRows[0].map(headerKey);
  const hasHeader = first.some((cell) => headerMap[cell]);
  const headers = hasHeader ? first.map((cell) => headerMap[cell] || '') : [];
  const dataRows = hasHeader ? parsedRows.slice(1) : parsedRows;

  return dataRows.map((cells) => {
    if (headers.length) {
      const row: OutreachProspectInput = { ...defaults };
      headers.forEach((key, index) => {
        if (key) row[key] = cells[index] || '';
      });
      return row;
    }

    if (cells.length >= 3) {
      return {
        ...defaults,
        companyName: cells[0] || '',
        contactPerson: cells[1] || '',
        email: cells[2] || '',
        mobile: cells[3] || '',
        city: cells[4] || '',
        state: cells[5] || '',
        businessType: cells[6] || defaults.businessType || 'other',
        website: cells[7] || '',
      };
    }

    return rowFromFlexibleLine(cells.join(' '), defaults);
  });
}

export async function importOutreachProspects(text: unknown, defaults: OutreachProspectInput = {}) {
  const rows = parseOutreachPaste(text, defaults);
  const imported: OutreachProspect[] = [];
  const skipped: Array<{ row: number; code: string; message: string; issues?: ValidationIssue[]; duplicate?: OutreachProspect }> = [];

  for (let index = 0; index < rows.length; index += 1) {
    const result = await createOutreachProspect(rows[index]);
    if (result.ok) {
      imported.push(result.prospect);
    } else {
      skipped.push({
        row: index + 1,
        code: result.code,
        message: (result as any).message || 'Prospect was not imported.',
        issues: (result as any).issues,
        duplicate: (result as any).duplicate,
      });
    }
  }

  return { imported, skipped, totalRows: rows.length };
}

export async function renderProspectMessages(prospectId: string, templateId?: string) {
  const prospect = await findOutreachProspect(prospectId);
  if (!prospect) return null;
  const assignedTemplate = normalizeTemplateId(templateId || prospect.assignedTemplate, prospect.businessType);
  const email = renderOutreachEmail({ ...prospect, assignedTemplate }, assignedTemplate);
  const whatsappMessage = renderWhatsAppMessage({ ...prospect, assignedTemplate }, assignedTemplate);
  const whatsappUrl = whatsappClickToChat(prospect.whatsappNumber || prospect.mobile, whatsappMessage);
  return { prospect, assignedTemplate, email, whatsappMessage, whatsappUrl };
}

export async function sendOutreachEmail(prospectId: string, templateId?: string) {
  const rendered = await renderProspectMessages(prospectId, templateId);
  if (!rendered) return { ok: false as const, code: 'NOT_FOUND', message: 'Prospect not found.' };
  const { prospect, email, assignedTemplate } = rendered;
  if (!prospect.email) return { ok: false as const, code: 'EMAIL_REQUIRED', message: 'Prospect does not have an email address.' };
  if (['do-not-contact', 'unsubscribed'].includes(prospect.consentStatus) || prospect.outreachStatus === 'do-not-contact') {
    return { ok: false as const, code: 'DO_NOT_CONTACT', message: 'This prospect is marked do-not-contact.' };
  }
  if (await isSuppressedContact(prospect)) {
    await updateOutreachProspect(prospect.prospectId, { consentStatus: 'do-not-contact', outreachStatus: 'do-not-contact' });
    return { ok: false as const, code: 'SUPPRESSED_CONTACT', message: 'This contact is on the do-not-contact suppression list.' };
  }

  const sendResult = await sendOrQueueEmail({
    to: prospect.email,
    subject: email.subject,
    html: email.html,
    text: email.text,
    leadId: prospect.prospectId,
  });

  const patch: OutreachProspectInput = { assignedTemplate };
  if (sendResult.status === 'sent') {
    patch.lastEmailSentAt = new Date().toISOString();
    patch.outreachStatus = 'email-sent';
  }
  const updateResult = await updateOutreachProspect(prospect.prospectId, patch);

  return {
    ok: true as const,
    prospect: updateResult.ok ? updateResult.prospect : prospect,
    email,
    send: sendResult,
  };
}

export async function markOutreachWhatsapp(prospectId: string, templateId?: string) {
  const rendered = await renderProspectMessages(prospectId, templateId);
  if (!rendered) return { ok: false as const, code: 'NOT_FOUND', message: 'Prospect not found.' };
  const { prospect, assignedTemplate, whatsappMessage, whatsappUrl } = rendered;
  if (['do-not-contact', 'unsubscribed'].includes(prospect.consentStatus) || prospect.outreachStatus === 'do-not-contact') {
    return { ok: false as const, code: 'DO_NOT_CONTACT', message: 'This prospect is marked do-not-contact.' };
  }
  const result = await updateOutreachProspect(prospect.prospectId, {
    assignedTemplate,
    lastWhatsappPreparedAt: new Date().toISOString(),
    outreachStatus: 'whatsapp-prepared',
  });
  return {
    ok: result.ok,
    prospect: result.ok ? result.prospect : prospect,
    whatsappMessage,
    whatsappUrl,
  };
}

export async function optOutOutreachProspect(input: OutreachProspectInput) {
  const prospectId = sanitizeString(input.prospectId || input.id, 100);
  const reason = sanitizeString(input.reason, 220) || 'opt-out';
  let prospect = prospectId ? await findOutreachProspect(prospectId) : null;
  if (!prospect) {
    const { prospect: normalized, issues } = normalizeProspectInput(input, { allowMissingContact: true });
    if (issues.length || (!normalized.email && !normalized.mobile && !normalized.whatsappNumber)) {
      return { ok: false as const, code: 'CONTACT_REQUIRED', message: 'Email, mobile, WhatsApp number, or prospect id is required.' };
    }
    prospect = normalized;
  }

  await addOutreachSuppressions(prospect, reason);
  if (prospectId) {
    const updated = await updateOutreachProspect(prospectId, {
      consentStatus: 'do-not-contact',
      outreachStatus: 'do-not-contact',
      notes: [prospect.notes, `Opt-out: ${reason}`].filter(Boolean).join('\n'),
    });
    return updated.ok ? { ok: true as const, prospect: updated.prospect } : updated;
  }

  return { ok: true as const, prospect };
}

export function outreachProspectsCsv(rows: OutreachProspect[]) {
  const exportRows = rows.map((row) => ({
    companyName: row.companyName,
    contactPerson: row.contactPerson,
    email: row.email,
    mobile: row.mobile,
    whatsappNumber: row.whatsappNumber,
    city: row.city,
    state: row.state,
    businessType: row.businessType,
    status: row.outreachStatus,
    notes: row.notes,
  }));
  return csv(exportRows, ['companyName', 'contactPerson', 'email', 'mobile', 'whatsappNumber', 'city', 'state', 'businessType', 'status', 'notes']);
}
