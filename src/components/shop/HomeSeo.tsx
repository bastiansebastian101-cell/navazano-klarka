'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

/** Short local-SEO intro + FAQ at the bottom of the homepage. Texts live in translations (home.seo / home.faq). */
export function HomeSeo() {
  const { t } = useLanguage();

  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h2 className="font-display text-2xl sm:text-3xl text-ink text-center">{t.home.seoTitle}</h2>
      <div className="mt-6 space-y-4 text-ink-light leading-relaxed">
        {t.home.seoParagraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <p className="mt-6 text-center">
        <Link href="/katalog" className="text-brand hover:text-brand-hover font-semibold">
          {t.home.seoCta} →
        </Link>
      </p>

      <h2 className="mt-14 font-display text-2xl sm:text-3xl text-ink text-center">{t.home.faqTitle}</h2>
      <div className="mt-6 space-y-3">
        {t.home.faq.map((item) => (
          <details key={item.q} className="group bg-white rounded-2xl shadow-card px-5 py-4">
            <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-medium text-ink">
              {item.q}
              <span className="text-brand text-xl transition-transform group-open:rotate-45" aria-hidden="true">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm text-ink-light leading-relaxed">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
