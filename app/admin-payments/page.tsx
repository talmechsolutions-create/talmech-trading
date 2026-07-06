import PaymentOperationsConsole from '@/components/PaymentOperationsConsole';

export const metadata = {
  title: 'Admin Payment Tracker',
  robots: { index: false, follow: false },
};

export default function AdminPaymentsPage() {
  return <PaymentOperationsConsole />;
}
