'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-ink-lighter/20 bg-cream mt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="font-display text-lg text-brand">Navázáno by Klára</span>
        <div className="flex items-center gap-4">
          <a
            href="https://www.facebook.com/share/19MtZK7uGb/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="text-ink-light hover:text-brand transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.89h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
            </svg>
          </a>
          <a
            href="https://www.instagram.com/navazano.byklara/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="text-ink-light hover:text-brand transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
            </svg>
          </a>
        </div>
        <p className="text-sm text-ink-light">
          © {new Date().getFullYear()} Navázáno by Klára. {t.footer.rights}
        </p>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <p className="text-xs text-ink-lighter text-center sm:text-left">{t.footer.deliveryArea}</p>
      </div>
    </footer>
  );
}
