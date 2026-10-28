'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export default function MainContentWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Check if current route is a subtopic reader studio: /read/[courseSlug]/[topicSlug]/[subtopicSlug]
  const isReaderStudio = Boolean(
    pathname?.startsWith('/read/') && pathname.split('/').filter(Boolean).length >= 4
  );

  if (isReaderStudio) {
    return (
      <main id="main-content" className="flex-1 w-full max-w-none p-0 m-0 focus:outline-none">
        {children}
      </main>
    );
  }

  return (
    <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 focus:outline-none">
      {children}
    </main>
  );
}
