import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import WhatsappUploadDetailAdmin from '@/components/WhatsappUploadDetailAdmin';
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
  const submission = await findWhatsappUpload(params.submissionId);
  if (!submission) notFound();
  return <WhatsappUploadDetailAdmin submission={submission} />;
}
