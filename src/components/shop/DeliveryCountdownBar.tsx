'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { ORDER_CUTOFF_HOUR, SHOP_TIME_ZONE as SHOP_TZ } from '@/lib/delivery';

// Hidden where the customer is already paying.
const HIDDEN_PATHS = ['/pokladna', '/objednavka'];

/** Current hour/minute/second in Prague, wherever the visitor is. */
function pragueNow(): { h: number; m: number; s: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: SHOP_TZ,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { h: get('hour'), m: get('minute'), s: get('second') };
}

/**
 * Seconds until the next real order cutoff (ORDER_CUTOFF_HOUR, Prague time) and
 * whether that cutoff is still today. This is the same rule checkout uses for the
 * earliest delivery date, so the promise on the bar is always true.
 */
function untilCutoff(): { seconds: number; beforeCutoffToday: boolean } {
  const { h, m, s } = pragueNow();
  const nowSec = h * 3600 + m * 60 + s;
  const cutoffSec = ORDER_CUTOFF_HOUR * 3600;
  if (nowSec < cutoffSec) return { seconds: cutoffSec - nowSec, beforeCutoffToday: true };
  return { seconds: 24 * 3600 - nowSec + cutoffSec, beforeCutoffToday: false };
}

const pad = (n: number) => String(n).padStart(2, '0');

export function DeliveryCountdownBar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  // null until mounted, so server and client render the same markup.
  const [state, setState] = useState<ReturnType<typeof untilCutoff> | null>(null);

  useEffect(() => {
    const tick = () => setState(untilCutoff());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (HIDDEN_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) return null;

  const time = `${pad(ORDER_CUTOFF_HOUR)}:00`;
  const message = (state?.beforeCutoffToday ?? true ? t.countdown.beforeCutoff : t.countdown.afterCutoff).replace(
    '{time}',
    time
  );
  const secs = state?.seconds ?? 0;
  const hh = pad(Math.floor(secs / 3600));
  const mm = pad(Math.floor((secs % 3600) / 60));
  const ss = pad(secs % 60);

  return (
    <div className="relative overflow-hidden bg-brand text-white text-xs sm:text-sm">
      <div className="countdown-glow absolute inset-0 pointer-events-none" aria-hidden="true" />
      <div className="relative max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <svg
            className="truck-drive shrink-0"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" />
            <circle cx="7" cy="17.5" r="1.8" />
            <circle cx="17" cy="17.5" r="1.8" />
          </svg>
          {message} <strong className="font-semibold">· {t.countdown.free}</strong>
        </span>
        <span
          className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5"
          role="timer"
          aria-live="off"
          aria-label={`${t.countdown.timeLeft} ${hh}:${mm}:${ss}`}
        >
          <span className="opacity-90">{t.countdown.timeLeft}</span>
          <span className="font-mono font-semibold tabular-nums tracking-wide">
            {state ? (
              <>
                {hh}
                <span className="countdown-colon">:</span>
                {mm}
                <span className="countdown-colon">:</span>
                {/* key changes every second, so the tick animation replays */}
                <span className="inline-block min-w-[2ch] rounded bg-white px-0.5 text-center text-brand-dark overflow-hidden align-middle">
                  <span key={ss} className="countdown-tick inline-block">
                    {ss}
                  </span>
                </span>
              </>
            ) : (
              '--:--:--'
            )}
          </span>
        </span>
      </div>
    </div>
  );
}
