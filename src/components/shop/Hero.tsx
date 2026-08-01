'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-brand-light">
      <div
        className="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-sage-light blur-3xl opacity-70"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-24 -right-10 w-80 h-80 rounded-full bg-brand/20 blur-3xl opacity-70"
        aria-hidden="true"
      />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
        <span className="text-4xl" aria-hidden="true">
          🌸
        </span>
        <h1 className="mt-3 font-display text-4xl sm:text-6xl text-ink text-balance">
          {t.home.heroTitle}
        </h1>
        <p className="mt-5 text-lg text-ink-light max-w-xl mx-auto">{t.home.heroSubtitle}</p>
        <Link
          href="/katalog"
          className="mt-10 inline-flex items-center bg-brand hover:bg-brand-hover text-white font-semibold px-8 py-3.5 rounded-full shadow-card transition-colors"
        >
          {t.home.heroCta} 💐
        </Link>
      </div>
    </section>
  );
}
