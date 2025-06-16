'use client';

import { useEffect } from 'react';
import { AnalyticsBrowser } from '@segment/analytics-next'
import { usePathname } from 'next/navigation';

const analytics = AnalyticsBrowser.load({ writeKey: 'aMRHH4QuZeV9B2z0xr0Xvb4YxwBeRExC' })

export default function useVisitorTracker() {
  const pathname = usePathname();
  useEffect(() => {
    analytics.track('page_view');
  }, [pathname]);
}

