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

        <ul className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <li
            className="hero-badge shine relative overflow-hidden inline-flex items-center gap-2 rounded-full bg-sage-light text-sage-dark border border-sage/30 px-4 py-2 text-sm font-semibold shadow-card"
            style={{ animationDelay: '0.2s' }}
          >
            <svg
              className="truck-drive"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" />
              <circle cx="7" cy="17.5" r="1.8" fill="white" />
              <circle cx="17" cy="17.5" r="1.8" fill="white" />
            </svg>
            {t.home.freeDelivery}
          </li>
          <li
            className="hero-badge shine relative overflow-hidden inline-flex items-center gap-2 rounded-full bg-white/80 text-brand-dark border border-brand/30 px-4 py-2 text-sm font-semibold shadow-card"
            style={{ animationDelay: '0.45s' }}
          >
            <span className="coin-flip text-base leading-none" aria-hidden="true">
              💵
            </span>
            {t.home.cashOnDelivery}
          </li>
        </ul>
      </div>
    </section>
  );
}
