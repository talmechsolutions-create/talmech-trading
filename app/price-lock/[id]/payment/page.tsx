import PriceLockPaymentClient from './payment-client';
export const metadata = { title: 'Secure Price-Lock Payment | Talmech Trading', robots: { index:false, follow:false } };
export default function Page({ params }: { params: { id: string } }) { return <PriceLockPaymentClient lockId={params.id} />; }
