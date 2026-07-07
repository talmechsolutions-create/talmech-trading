import type { Metadata } from 'next';
import AdminAccountActivation from '@/components/AdminAccountActivation';

export const metadata: Metadata = {
  title: 'Activate Talmech Trading Account',
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams?: { token?: string };
};

export default function ActivateAccountPage({ searchParams }: PageProps) {
  return <AdminAccountActivation token={searchParams?.token || ''} />;
}
