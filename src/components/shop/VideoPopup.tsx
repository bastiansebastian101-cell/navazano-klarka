'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export function VideoPopup({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          aria-label={t.videoPopup.close}
          className="absolute top-3 right-3 z-10 bg-white/90 rounded-full w-8 h-8 flex items-center justify-center text-ink-light hover:text-ink shadow"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <h3 className="font-display text-xl text-ink pr-8 text-center">{t.videoPopup.title}</h3>
        <p className="mt-1 text-sm text-ink-light text-center">{t.videoPopup.subtitle}</p>

        <video
          className="mt-4 w-full rounded-2xl bg-ink"
          src="/videos/subscription-showcase.mp4"
          autoPlay
          muted
          loop
          playsInline
          controls
        />

        <Link
          href="/kancelare"
          onClick={handleClose}
          className="mt-4 block text-center bg-brand hover:bg-brand-hover text-white text-sm font-semibold py-3 rounded-full transition-colors"
        >
          {t.videoPopup.cta}
        </Link>
      </div>
    </div>
  );
}
