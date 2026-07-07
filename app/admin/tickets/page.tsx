import type { Metadata } from 'next';
import AdminTicketsConsole from '@/components/AdminTicketsConsole';
import { listSupportTickets } from '@/lib/supportTicketStore';

export const metadata: Metadata = {
  title: 'Admin Support Tickets',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminTicketsPage() {
  const tickets = await listSupportTickets();
  return <AdminTicketsConsole initialTickets={tickets} />;
}
