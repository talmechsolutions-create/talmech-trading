import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AdminDataLoadError from '@/components/AdminDataLoadError';
import WhatsappUploadDetailAdmin from '@/components/WhatsappUploadDetailAdmin';
import { loadAdminData } from '@/lib/adminSsr';
import { findWhatsappUpload } from '@/lib/whatsappUploadStore';

export const metadata: Metadata = {
  title: 'Admin WhatsApp Upload Detail',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

type PageProps = {
  params: { submissionId: string };
};

export default async function AdminWhatsappUploadDetailPage({ params }: PageProps) {
  const route = `/admin/whatsapp-uploads/${params.submissionId}`;
  const { data: submission, error } = await loadAdminData(route, () => findWhatsappUpload(params.submissionId), null, { submissionId: params.submissionId });
  if (error) return <AdminDataLoadError title="Admin WhatsApp upload detail" route={route} error={error} backHref="/admin/whatsapp-uploads" backLabel="Back to uploads" />;
  if (!submission) notFound();
  return <WhatsappUploadDetailAdmin submission={submission} />;
}
