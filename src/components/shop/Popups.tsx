'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { CustomBouquetPopup } from './CustomBouquetPopup';
import { VideoPopup } from './VideoPopup';

type PopupId = 'bouquet' | 'video';

// Time on the site (not on one page) before each popup opens on its own.
const AUTO_OPEN_DELAY_MS: Record<PopupId, number> = {
  bouquet: 35_000,
  video: 60_000,
};
// Order in which due popups open (one at a time).
const POPUP_ORDER: PopupId[] = ['bouquet', 'video'];
// After a popup is closed, it doesn't open on its own again for this long.
const CLOSED_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

const VISIT_START_KEY = 'navazano_visit_start';
const AD_VISIT_KEY = 'navazano-ad-visit';
const shownKey = (id: PopupId) => `navazano_popup_shown_${id}`; // sessionStorage
const closedKey = (id: PopupId) => `navazano_popup_closed_${id}`; // localStorage (timestamp)

// Cart, checkout and order confirmation: no popups and no floating button at all.
const HIDDEN_PATHS = ['/kosik', '/pokladna', '/objednavka'];
// Pages where popups never open on their own (the floating button still works).
const NO_AUTO_OPEN_PATHS = [...HIDDEN_PATHS, '/katalog', '/produkt'];

function matchesPath(pathname: string, paths: string[]): boolean {
  return paths.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function isAdLanding(search: string): boolean {
  const params = new URLSearchParams(search);
  return (
    params.has('gclid') ||
    params.has('gbraid') ||
    params.has('wbraid') ||
    params.get('utm_source')?.toLowerCase() === 'google' ||
    params.get('utm_medium')?.toLowerCase() === 'cpc'
  );
}

/** When this visit started, or null if storage is blocked (then nothing opens on its own). */
function visitStart(): number | null {
  try {
    const saved = Number(sessionStorage.getItem(VISIT_START_KEY));
    if (saved > 0) return saved;
    const now = Date.now();
    sessionStorage.setItem(VISIT_START_KEY, String(now));
    return now;
  } catch {
    return null;
  }
}

function canAutoOpen(id: PopupId): boolean {
  try {
    if (sessionStorage.getItem(AD_VISIT_KEY) === '1') return false;
    if (sessionStorage.getItem(shownKey(id)) === '1') return false;
    const closedAt = Number(localStorage.getItem(closedKey(id)));
    if (closedAt > 0 && Date.now() - closedAt < CLOSED_COOLDOWN_MS) return false;
    return true;
  } catch {
    return false;
  }
}

function markShown(id: PopupId) {
  try {
    sessionStorage.setItem(shownKey(id), '1');
  } catch {
    // ignore
  }
}

function markClosed(id: PopupId) {
  try {
    localStorage.setItem(closedKey(id), String(Date.now()));
  } catch {
    // ignore
  }
}

export function Popups() {
  const pathname = usePathname();
  const hidden = matchesPath(pathname, HIDDEN_PATHS);
  const noAutoOpen = matchesPath(pathname, NO_AUTO_OPEN_PATHS);
  // The popup on screen right now (opened automatically or with the floating button).
  const [openPopup, setOpenPopup] = useState<PopupId | null>(null);
  const [autoOpenBouquet, setAutoOpenBouquet] = useState(false);
  // Bumped by the timer to re-check which popup is due.
  const [tick, setTick] = useState(0);

  // Visitors from Google Ads: no automatic popup for the rest of the session.
  useEffect(() => {
    if (!isAdLanding(window.location.search)) return;
    try {
      sessionStorage.setItem(AD_VISIT_KEY, '1');
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (noAutoOpen || openPopup || autoOpenBouquet) return;
    const start = visitStart();
    if (start === null) return;

    const now = Date.now();
    let nextDue = Infinity;
    for (const id of POPUP_ORDER) {
      if (!canAutoOpen(id)) continue;
      const due = start + AUTO_OPEN_DELAY_MS[id];
      if (due <= now) {
        markShown(id);
        if (id === 'bouquet') setAutoOpenBouquet(true);
        else setOpenPopup(id);
        return;
      }
      nextDue = Math.min(nextDue, due);
    }
    if (nextDue === Infinity) return;
    const timer = setTimeout(() => setTick((n) => n + 1), nextDue - now);
    return () => clearTimeout(timer);
  }, [noAutoOpen, openPopup, autoOpenBouquet, tick]);

  const handleBouquetAutoOpen = useCallback(() => {
    setAutoOpenBouquet(false);
    setOpenPopup('bouquet');
  }, []);

  // Opened with the floating button: counts as shown for this session.
  const handleBouquetOpen = useCallback(() => {
    markShown('bouquet');
    setOpenPopup('bouquet');
  }, []);

  const handleBouquetClose = useCallback(() => {
    markClosed('bouquet');
    setOpenPopup(null);
  }, []);

  const handleVideoClose = useCallback(() => {
    markClosed('video');
    setOpenPopup(null);
  }, []);

  if (hidden) return null;

  return (
    <>
      {openPopup === 'video' && <VideoPopup onClose={handleVideoClose} />}
      <CustomBouquetPopup
        autoOpen={autoOpenBouquet}
        onAutoOpen={handleBouquetAutoOpen}
        onOpen={handleBouquetOpen}
        onClose={handleBouquetClose}
      />
    </>
  );
}
