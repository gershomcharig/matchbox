'use client';

export default function EmptyState() {
  return (
    <div className="absolute inset-x-0 bottom-0 flex justify-center pb-8 pointer-events-none z-10">
      <div className="pointer-events-auto">
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-lg border border-zinc-200/50 dark:border-zinc-700/50">
          <p className="text-zinc-600 dark:text-zinc-300 text-sm font-medium tracking-tight">
            Paste a Google Maps link to get started
          </p>
        </div>
      </div>
    </div>
  );
}
