import path from 'path';
import { readJsonArray, writeJsonArray } from '@/lib/marketplaceStore';
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

export async function listSupportTickets() {
  const rows = await readJsonArray(supportTicketsFile);
  return rows.map(normalizeTicket).sort((a: SupportTicket, b: SupportTicket) => b.createdAt.localeCompare(a.createdAt));
}

export async function listSupportTicketsForUser(userId: string) {
  const cleanId = sanitizeString(userId, 80);
  return (await listSupportTickets()).filter((ticket: SupportTicket) => ticket.ownerUserId === cleanId || ticket.accountId === cleanId);
}

export async function createSupportTicket(input: Partial<SupportTicket>) {
  const now = new Date().toISOString();
  const ticket = normalizeTicket({
    ...input,
    ticketId: `TKT-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    status: 'Open',
    timeline: [{ at: now, by: 'client', message: sanitizeMultiline(input.message, 1200) || 'Ticket opened.', status: 'Open' }],
  });
  const rows = await listSupportTickets();
  rows.unshift(ticket);
  await writeJsonArray(supportTicketsFile, rows);
  return ticket;
}

export async function updateSupportTicket(ticketId: string, patch: { status?: string; adminNote?: string; reply?: string; by?: 'client' | 'admin' }) {
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
  await writeJsonArray(supportTicketsFile, rows);
  return rows[index];
}
