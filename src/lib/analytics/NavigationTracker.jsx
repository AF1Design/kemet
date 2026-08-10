'use client';

import React, { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView } from './index';

function NavigationTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastUrlRef = React.useRef('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
      if (lastUrlRef.current === url) return;
      lastUrlRef.current = url;
      trackPageView(url, document.title);
    }
  }, [pathname, searchParams]);

  return null;
}

export function NavigationTracker() {
  return (
    <Suspense fallback={null}>
      <NavigationTrackerInner />
    </Suspense>
  );
}
