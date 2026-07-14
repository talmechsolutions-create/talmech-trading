import path from 'path';
import { readJsonArray, writeJsonArray } from '@/lib/marketplaceStore';
import { hasDatabaseConnection, prisma } from '@/lib/proDb';
import { isProduction, persistentStorageUnavailable, requirePersistentStorage } from '@/lib/storageMode';
import { sanitizeMultiline, sanitizeString } from '@/lib/validation';

export type SupportTicketStatus = 'Open' | 'In Progress' | 'Waiting for Client' | 'Resolved' | 'Closed';

export type SupportTicket = {
  ticketId: string;
  ownerUserId: string;
  accountId: string;
  firmName: string;
  contactName: string;
  email: string;
  mobile: string;
  category: string;
  priority: string;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  adminNote: string;
  emailStatus?: string;
  emailRecipient?: string;
  emailSender?: string;
  emailProvider?: string;
  lastEmailSentAt?: string;
  emailError?: string;
  emailNotifications?: Array<Record<string, any>>;
  createdAt: string;
  updatedAt: string;
  timeline: { at: string; by: 'client' | 'admin' | 'system'; message: string; status?: SupportTicketStatus }[];
};

const supportTicketsFile = path.join(process.cwd(), 'data', 'support-tickets.json');
const statuses = new Set(['Open', 'In Progress', 'Waiting for Client', 'Resolved', 'Closed']);

function normalizeStatus(value: unknown): SupportTicketStatus {
  const text = sanitizeString(value, 40);
  return (statuses.has(text) ? text : 'Open') as SupportTicketStatus;
}

function normalizeTicket(row: any): SupportTicket {
  const now = new Date().toISOString();
  const createdAt = sanitizeString(row?.createdAt, 40) || now;
  return {
    ticketId: sanitizeString(row?.ticketId, 80) || `TKT-${Date.now()}`,
    ownerUserId: sanitizeString(row?.ownerUserId, 80),
    accountId: sanitizeString(row?.accountId, 80),
    firmName: sanitizeString(row?.firmName, 160),
    contactName: sanitizeString(row?.contactName, 120),
    email: sanitizeString(row?.email, 254).toLowerCase(),
    mobile: sanitizeString(row?.mobile, 20),
    category: sanitizeString(row?.category, 80) || 'General support',
    priority: sanitizeString(row?.priority, 40) || 'Normal',
    subject: sanitizeString(row?.subject, 160),
    message: sanitizeMultiline(row?.message, 2000),
    status: normalizeStatus(row?.status),
    adminNote: sanitizeMultiline(row?.adminNote, 1200),
    emailStatus: sanitizeString(row?.emailStatus, 80),
    emailRecipient: sanitizeString(row?.emailRecipient, 254),
    emailSender: sanitizeString(row?.emailSender, 254),
    emailProvider: sanitizeString(row?.emailProvider, 80),
    lastEmailSentAt: sanitizeString(row?.lastEmailSentAt, 40),
    emailError: sanitizeMultiline(row?.emailError, 500),
    emailNotifications: Array.isArray(row?.emailNotifications)
      ? row.emailNotifications.slice(0, 25).map((item: any) => ({
          type: sanitizeString(item?.type, 80),
          status: sanitizeString(item?.status, 80),
          recipient: sanitizeString(item?.recipient, 254),
          sender: sanitizeString(item?.sender, 254),
          provider: sanitizeString(item?.provider, 80),
          at: sanitizeString(item?.at, 40),
          error: sanitizeMultiline(item?.error, 500),
        }))
      : [],
    createdAt,
    updatedAt: sanitizeString(row?.updatedAt, 40) || createdAt,
    timeline: Array.isArray(row?.timeline)
      ? row.timeline.slice(0, 80).map((item: any) => ({
          at: sanitizeString(item?.at, 40) || createdAt,
          by: item?.by === 'admin' ? 'admin' : item?.by === 'client' ? 'client' : 'system',
          message: sanitizeMultiline(item?.message, 1200),
          status: item?.status ? normalizeStatus(item.status) : undefined,
        }))
      : [{ at: createdAt, by: 'system', message: 'Ticket created.', status: 'Open' }],
  };
}

function dateString(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  return sanitizeString(value, 40);
}

function fromDbTicket(row: any): SupportTicket {
  return normalizeTicket({
    ...(row?.raw && typeof row.raw === 'object' ? row.raw : {}),
    ticketId: row?.id,
    ownerUserId: row?.ownerUserId,
    accountId: row?.accountId,
    firmName: row?.firmName,
    contactName: row?.contactName,
    email: row?.email,
    mobile: row?.mobile,
    category: row?.category,
    priority: row?.priority,
    subject: row?.subject,
    status: row?.status,
    createdAt: dateString(row?.createdAt),
    updatedAt: dateString(row?.updatedAt),
  });
}

async function withTicketDb<T>(fn: () => Promise<T>, fallback: () => Promise<T>) {
  if (!hasDatabaseConnection()) return fallback();
  try {
    return await fn();
  } catch (error) {
    console.error('[Support ticket DB error]', error);
    if (isProduction()) throw persistentStorageUnavailable();
    return fallback();
  }
}

export async function listSupportTickets() {
  return withTicketDb(
    async () => (await prisma.supportTicket.findMany({ orderBy: { createdAt: 'desc' } })).map(fromDbTicket),
    async () => {
      const rows = await readJsonArray(supportTicketsFile);
      return rows.map(normalizeTicket).sort((a: SupportTicket, b: SupportTicket) => b.createdAt.localeCompare(a.createdAt));
    }
  );
}

export async function listSupportTicketsForUser(userId: string) {
  const cleanId = sanitizeString(userId, 80);
  return (await listSupportTickets()).filter((ticket: SupportTicket) => ticket.ownerUserId === cleanId || ticket.accountId === cleanId);
}

export async function createSupportTicket(input: Partial<SupportTicket>) {
  requirePersistentStorage();
  const now = new Date().toISOString();
  const ticket = normalizeTicket({
    ...input,
    ticketId: `TKT-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    status: 'Open',
    timeline: [{ at: now, by: 'client', message: sanitizeMultiline(input.message, 1200) || 'Ticket opened.', status: 'Open' }],
  });
  return withTicketDb(
    async () => fromDbTicket(await prisma.supportTicket.create({
      data: {
        id: ticket.ticketId,
        createdAt: new Date(ticket.createdAt),
        updatedAt: new Date(ticket.updatedAt),
        ownerUserId: ticket.ownerUserId,
        accountId: ticket.accountId,
        firmName: ticket.firmName,
        contactName: ticket.contactName,
        email: ticket.email,
        mobile: ticket.mobile,
        category: ticket.category,
        priority: ticket.priority,
        subject: ticket.subject,
        status: ticket.status,
        raw: ticket,
      },
    })),
    async () => {
      const rows = await listSupportTickets();
      rows.unshift(ticket);
      await writeJsonArray(supportTicketsFile, rows);
      return ticket;
    }
  );
}

export async function updateSupportTicket(ticketId: string, patch: { status?: string; adminNote?: string; reply?: string; by?: 'client' | 'admin' }) {
  requirePersistentStorage();
  const cleanId = sanitizeString(ticketId, 80);
  const rows = await listSupportTickets();
  const index = rows.findIndex((ticket: SupportTicket) => ticket.ticketId === cleanId);
  if (index < 0) return null;

  const current = rows[index];
  const now = new Date().toISOString();
  const status = patch.status ? normalizeStatus(patch.status) : current.status;
  const reply = sanitizeMultiline(patch.reply, 1200);
  const adminNote = patch.adminNote === undefined ? current.adminNote : sanitizeMultiline(patch.adminNote, 1200);
  const timeline = [...current.timeline];
  if (reply || status !== current.status) {
    timeline.push({
      at: now,
      by: patch.by === 'client' ? 'client' : 'admin',
      message: reply || `Status changed to ${status}.`,
      status,
    });
  }

  rows[index] = normalizeTicket({
    ...current,
    status,
    adminNote,
    updatedAt: now,
    timeline,
  });
  const ticket = rows[index];
  return withTicketDb(
    async () => fromDbTicket(await prisma.supportTicket.update({
      where: { id: cleanId },
      data: {
        updatedAt: new Date(ticket.updatedAt),
        status: ticket.status,
        raw: ticket,
      },
    })),
    async () => {
      await writeJsonArray(supportTicketsFile, rows);
      return ticket;
    }
  );
}

export async function recordSupportTicketEmailStatus(ticketId: string, tracking: Record<string, any>) {
  const cleanId = sanitizeString(ticketId, 80);
  const rows = await listSupportTickets();
  const index = rows.findIndex((ticket: SupportTicket) => ticket.ticketId === cleanId);
  if (index < 0) return null;

  const current = rows[index];
  const now = new Date().toISOString();
  const notification = {
    type: sanitizeString(tracking.type || tracking.notificationType, 80),
    status: sanitizeString(tracking.emailStatus || tracking.status, 80),
    recipient: sanitizeString(tracking.emailRecipient || tracking.recipient, 254),
    sender: sanitizeString(tracking.emailSender || tracking.sender, 254),
    provider: sanitizeString(tracking.emailProvider || tracking.provider, 80),
    at: now,
    error: sanitizeMultiline(tracking.emailError || tracking.error, 500),
  };
  const notifications = [notification, ...(current.emailNotifications || [])].slice(0, 25);

  rows[index] = normalizeTicket({
    ...current,
    emailStatus: notification.status,
    emailRecipient: notification.recipient,
    emailSender: notification.sender,
    emailProvider: notification.provider,
    lastEmailSentAt: notification.status === 'sent' ? now : current.lastEmailSentAt,
    emailError: notification.error,
    emailNotifications: notifications,
    updatedAt: now,
  });
  const ticket = rows[index];

  return withTicketDb(
    async () => fromDbTicket(await prisma.supportTicket.update({
      where: { id: cleanId },
      data: {
        updatedAt: new Date(ticket.updatedAt),
        raw: ticket,
      },
    })),
    async () => {
      await writeJsonArray(supportTicketsFile, rows);
      return ticket;
    }
  );
}
