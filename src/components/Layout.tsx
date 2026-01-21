'use client';

import { ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Plus } from 'lucide-react';
import { clearSessionToken } from '@/lib/auth';
import NewCollectionModal from './NewCollectionModal';
import { createCollection } from '@/app/actions/collections';

interface LayoutProps {
  children: ReactNode;
  sidePanel?: ReactNode;
  onCollectionCreated?: () => void;
}

export default function Layout({ children, sidePanel, onCollectionCreated }: LayoutProps) {
  const router = useRouter();
  const [isNewCollectionOpen, setIsNewCollectionOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogout = () => {
    clearSessionToken();
    router.push('/login');
  };

  const handleCreateCollection = async (data: {
    name: string;
    color: string;
    icon: string;
  }) => {
    setIsSubmitting(true);
    const result = await createCollection(data);
    setIsSubmitting(false);

    if (result.success) {
      setIsNewCollectionOpen(false);
      onCollectionCreated?.();
    } else {
      // TODO: Show error toast
      console.error('Failed to create collection:', result.error);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex">
      {/* Map area - fills available space */}
      <div className="flex-1 relative">
        {/* Top bar buttons */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          {/* New Collection button */}
          <button
            onClick={() => setIsNewCollectionOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:from-amber-400 hover:to-orange-400 transition-all"
            title="New Collection"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">New Collection</span>
          </button>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-lg shadow-zinc-900/5 dark:shadow-zinc-950/50"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>

        {children}
      </div>

      {/* New Collection Modal */}
      <NewCollectionModal
        isOpen={isNewCollectionOpen}
        onClose={() => setIsNewCollectionOpen(false)}
        onSubmit={handleCreateCollection}
        isSubmitting={isSubmitting}
      />

      {/* Side panel area - desktop only, reserved space for future use */}
      {sidePanel && (
        <div className="hidden lg:block w-[400px] border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          {sidePanel}
        </div>
      )}
    </div>
  );
}
