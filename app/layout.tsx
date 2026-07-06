import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import FloatingContact from '@/components/FloatingContact';
import RoleGate from '@/components/RoleGate';
import MarketingTracker from '@/components/MarketingTracker';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://talmech-trading.vercel.app';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0f766e'
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Talmech Trading | Verified Metal Marketplace India', template: '%s | Talmech Trading' },
  description: 'India-focused B2B metal marketplace for steel, scrap, copper, aluminum, brass, forgings, precision components, buyer requirements, supplier listings and logistics coordination.',
  applicationName: 'Talmech Trading',
  generator: 'Next.js',
  keywords: [
    'Talmech Trading', 'metal marketplace India', 'steel suppliers Pune', 'TMT bars supplier', 'copper scrap buyer',
    'sell scrap metal', 'metal buyers India', 'metal suppliers India', 'forging components India', 'industrial logistics metal'
  ],
  authors: [{ name: 'Talmech Trading' }],
  creator: 'Talmech Trading',
  publisher: 'Talmech Trading',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteUrl,
    siteName: 'Talmech Trading',
    title: 'Talmech Trading | Verified Metal Marketplace India',
    description: 'Post metal requirements, list supply, find local suppliers and coordinate metal logistics with verification-first workflow.',
    images: [{ url: '/images/metal-categories/steel.webp', width: 1200, height: 800, alt: 'Talmech Trading verified metal marketplace' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Talmech Trading | Verified Metal Marketplace India',
    description: 'Verified marketplace for steel, copper, aluminum, brass, scrap, forgings and industrial components.',
    images: ['/images/metal-categories/steel.webp']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 }
  },
  category: 'B2B marketplace'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Talmech Trading',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/public-marketplace?query={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };
  return (
    <html lang="en-IN">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
        <PublicHeader />
        <RoleGate />
        <MarketingTracker />
        {children}
        <footer className="footer">
          <div className="container footerGrid">
            <div>
              <b>Talmech Trading</b>
              <p>India-first metal marketplace connecting buyers, suppliers, scrap dealers, fabricators, forging units, component manufacturers and logistics providers.</p>
              <p className="muted">Verified posting workflow for steel, copper, aluminum, brass, scrap, forging and industrial-component requirements.</p>
            </div>
            <div>
              <b>Marketplace</b>
              <Link href="/public-marketplace">Browse Market</Link>
              <Link href="/post-requirement">Post Requirement</Link>
              <Link href="/sell">Sell Metal</Link>
              <Link href="/metal-products">Metal Products</Link>
            </div>
            <div>
              <b>Company</b>
              <Link href="/metals">Metal categories</Link>
              <Link href="/scrap">Scrap trading</Link>
              <Link href="/signin">User sign in</Link>
              <Link href="/contact">Contact Talmech</Link>
            </div>
            <div>
              <b>Support</b>
              <a href="tel:+917389642874">Call +91 7389642874</a>
              <a href="https://wa.me/917389642874" target="_blank" rel="noreferrer">WhatsApp support</a>
              <Link href="/whatsapp-upload">Upload via WhatsApp</Link>
              <span>Business verification, lead routing and marketplace assistance.</span>
            </div>
          </div>
        </footer>
        <FloatingContact />
      </body>
    </html>
  );
}
