'use client';

import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="font-display text-4xl text-ink text-center mb-10">{t.about.title}</h1>

      <div className="relative w-full aspect-[3/4] sm:aspect-[4/3] rounded-3xl overflow-hidden shadow-card-hover mb-10">
        <Image
          src="/images/o-nas.jpeg"
          alt="Klára & Sebin"
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="space-y-5 text-ink leading-relaxed">
        {t.about.paragraphs.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      <div className="mt-10 pt-8 border-t border-ink-lighter/20 text-center font-display text-lg text-brand">
        {t.about.signatureLines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </div>
  );
}
