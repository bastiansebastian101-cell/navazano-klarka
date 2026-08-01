'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-brand-light">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
        <h1 className="font-display text-4xl sm:text-6xl text-ink text-balance">
          {t.home.heroTitle}
        </h1>
        <p className="mt-5 text-lg text-ink-light max-w-xl mx-auto">{t.home.heroSubtitle}</p>
        <Link
          href="/katalog"
          className="mt-10 inline-flex items-center bg-brand hover:bg-brand-hover text-white font-semibold px-8 py-3.5 rounded-full transition-colors"
        >
          {t.home.heroCta}
        </Link>
      </div>
    </section>
  );
}
