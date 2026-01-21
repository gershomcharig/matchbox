'use client';

import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  sidePanel?: ReactNode;
}

export default function Layout({ children, sidePanel }: LayoutProps) {
  return (
    <div className="h-screen w-screen overflow-hidden flex">
      {/* Map area - fills available space */}
      <div className="flex-1 relative">
        {children}
      </div>

      {/* Side panel area - desktop only, reserved space for future use */}
      {sidePanel && (
        <div className="hidden lg:block w-[400px] border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          {sidePanel}
        </div>
      )}
    </div>
  );
}
