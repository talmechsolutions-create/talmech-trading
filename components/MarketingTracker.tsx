'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function detectDevice() {
  if (typeof window === 'undefined') return 'server';
  const w = window.innerWidth;
  if (w <= 640) return 'mobile';
  if (w <= 1024) return 'tablet';
  return 'desktop';
}

export default function MarketingTracker() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const role = localStorage.getItem('talmech-account-class') || localStorage.getItem('talmech-role') || localStorage.getItem('talmech-market-view') || '';
      const payload = {
        eventType: 'page_view',
        page: `${pathname}${window.location.search || ''}`,
        source: params.get('utm_source') || (document.referrer ? new URL(document.referrer).hostname : 'direct'),
        medium: params.get('utm_medium') || (document.referrer ? 'referral' : 'organic'),
        campaign: params.get('utm_campaign') || '',
        keyword: params.get('utm_term') || params.get('query') || params.get('product') || '',
        city: localStorage.getItem('talmech-buyer-city') || localStorage.getItem('talmech-city') || '',
        role,
        device: detectDevice(),
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      };
      const body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/marketing-events', new Blob([body], { type: 'application/json' }));
      } else {
        fetch('/api/marketing-events', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true });
      }
    } catch {}
  }, [pathname]);

  return null;
}
