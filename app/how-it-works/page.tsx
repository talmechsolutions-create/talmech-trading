import type { Metadata } from 'next';
import HowItWorksClient from '@/components/help/HowItWorksClient';
import { HelpLanguage, isHelpLanguage } from '@/data/helpGuides';

export const metadata: Metadata = {
  title: 'How Talmech Trading Works | Buyer and Seller Onboarding Guide',
  description:
    'Learn how buyers, sellers, traders, and suppliers can register, post requirements, list products, and use Talmech Trading.',
  alternates: { canonical: '/how-it-works' },
};

type HowItWorksPageProps = {
  searchParams?: {
    lang?: string | string[];
  };
};

export default function HowItWorksPage({ searchParams }: HowItWorksPageProps) {
  const rawLanguage = Array.isArray(searchParams?.lang) ? searchParams?.lang[0] : searchParams?.lang;
  const initialLanguage: HelpLanguage = isHelpLanguage(rawLanguage) ? rawLanguage : 'en';

  return <HowItWorksClient initialLanguage={initialLanguage} />;
}
