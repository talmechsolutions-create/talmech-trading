import type { Metadata } from 'next';
import AdminDataLoadError from '@/components/AdminDataLoadError';
import AdminTicketsConsole from '@/components/AdminTicketsConsole';
import { loadAdminData } from '@/lib/adminSsr';
import { listSupportTickets } from '@/lib/supportTicketStore';

export const metadata: Metadata = {
  title: 'Admin Support Tickets',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminTicketsPage() {
  const { data: tickets, error } = await loadAdminData('/admin/tickets', listSupportTickets, []);
  if (error) return <AdminDataLoadError title="Support tickets" route="/admin/tickets" error={error} />;
  return <AdminTicketsConsole initialTickets={tickets} />;
}
