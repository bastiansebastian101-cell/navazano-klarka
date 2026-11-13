'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCzk } from '@/lib/format';
import type { ActivePromo } from '@/lib/promoBanner';

// The order is already placed there.
const HIDDEN_PATHS = ['/objednavka'];

const pad = (n: number) => String(n).padStart(2, '0');

export function PromoBar() {
  const pathname = usePathname();
  const { t, language } = useLanguage();
  const [promo, setPromo] = useState<ActivePromo | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/promo-banner', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { promo: null }))
      .then((d) => !cancelled && setPromo(d.promo ?? null))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!promo?.expiresAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [promo?.expiresAt]);

  if (!promo || HIDDEN_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) return null;

  const secsLeft = promo.expiresAt ? Math.floor((new Date(promo.expiresAt).getTime() - now) / 1000) : null;
  if (secsLeft !== null && secsLeft <= 0) return null; // offer is over — stop advertising it

  const value =
    promo.discountType === 'percentage'
      ? language === 'cs'
        ? `${promo.discountValue} %`
        : `${promo.discountValue}%`
      : formatCzk(promo.discountValue);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(promo.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked — the code is still visible
    }
  };

  let timer: React.ReactNode = null;
  if (secsLeft !== null) {
    const d = Math.floor(secsLeft / 86400);
    const h = pad(Math.floor((secsLeft % 86400) / 3600));
    const m = pad(Math.floor((secsLeft % 3600) / 60));
    const s = pad(secsLeft % 60);
    timer = (
      <span
        className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5"
        role="timer"
        aria-live="off"
        aria-label={`${t.promo.endsIn} ${d > 0 ? `${d} ${t.promo.days} ` : ''}${h}:${m}:${s}`}
      >
        <span className="opacity-90">{t.promo.endsIn}</span>
        <span className="font-mono font-semibold tabular-nums tracking-wide">
          {d > 0 && (
            <>
              {d}
              {t.promo.days}{' '}
            </>
          )}
          {h}
          <span className="countdown-colon">:</span>
          {m}
          <span className="countdown-colon">:</span>
          <span className="inline-block min-w-[2ch] rounded bg-white px-0.5 text-center text-ink overflow-hidden align-middle">
            <span key={s} className="countdown-tick inline-block">
              {s}
            </span>
          </span>
        </span>
      </span>
    );
  }

  return (
    <div className="relative overflow-hidden bg-ink text-white text-xs sm:text-sm">
      <div className="countdown-glow absolute inset-0 pointer-events-none" aria-hidden="true" />
      <div className="relative max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
        <span className="inline-flex flex-wrap items-center justify-center gap-1.5 font-medium">
          <span className="coin-flip" aria-hidden="true">
            🎁
          </span>
          <strong className="font-semibold text-brand-light">{t.promo.discount.replace('{value}', value)}</strong>
          <span>{t.promo.withCode}</span>
          <button
            type="button"
            onClick={copyCode}
            title={t.promo.copy}
            className="font-mono font-semibold rounded-md border border-dashed border-brand-light/70 bg-white/10 px-2 py-0.5 hover:bg-white/20 transition-colors"
          >
            {copied ? t.promo.copied : promo.code}
          </button>
        </span>
        {timer}
      </div>
    </div>
  );
}
