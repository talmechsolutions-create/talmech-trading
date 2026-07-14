import type { Metadata } from 'next';
import AdminDataLoadError from '@/components/AdminDataLoadError';
import WhatsappUploadsAdmin from '@/components/WhatsappUploadsAdmin';
import { loadAdminData } from '@/lib/adminSsr';
import { listWhatsappUploads, toWhatsappUploadAdminRow } from '@/lib/whatsappUploadStore';

export const metadata: Metadata = {
  title: 'Admin WhatsApp Assisted Uploads',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminWhatsappUploadsPage() {
  const { data: submissions, error } = await loadAdminData('/admin/whatsapp-uploads', listWhatsappUploads, []);
  if (error) return <AdminDataLoadError title="Admin WhatsApp assisted uploads" route="/admin/whatsapp-uploads" error={error} />;
  return <WhatsappUploadsAdmin initialRows={submissions.map(toWhatsappUploadAdminRow)} />;
}
