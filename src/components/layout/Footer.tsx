'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-ink-lighter/20 bg-cream mt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="font-display text-lg text-brand">Navazano by Klara</span>
        <p className="text-sm text-ink-light">
          © {new Date().getFullYear()} Navazano by Klara. {t.footer.rights}
        </p>
      </div>
    </footer>
  );
}
