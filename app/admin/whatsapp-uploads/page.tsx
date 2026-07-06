import type { Metadata } from 'next';
import WhatsappUploadsAdmin from '@/components/WhatsappUploadsAdmin';
import { listWhatsappUploads, toWhatsappUploadAdminRow } from '@/lib/whatsappUploadStore';

export const metadata: Metadata = {
  title: 'Admin WhatsApp Assisted Uploads',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminWhatsappUploadsPage() {
  const submissions = await listWhatsappUploads();
  return <WhatsappUploadsAdmin initialRows={submissions.map(toWhatsappUploadAdminRow)} />;
}
