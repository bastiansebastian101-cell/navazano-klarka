'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { CustomBouquetPopup } from './CustomBouquetPopup';
import { VideoPopup } from './VideoPopup';

// Set once a visitor has been shown an automatic popup. While it's set, no popup opens on its own again.
const POPUP_SEEN_KEY = 'navazano_popup_seen';

// Cart, checkout and order confirmation: never interrupt the purchase.
const NO_POPUP_PATHS = ['/kosik', '/pokladna', '/objednavka'];

function isNoPopupPath(pathname: string): boolean {
  return NO_POPUP_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function hasSeenPopup(): boolean {
  try {
    return localStorage.getItem(POPUP_SEEN_KEY) === '1';
  } catch {
    // Storage blocked: we can't remember, so don't risk showing it on every page.
    return true;
  }
}

function markPopupSeen() {
  try {
    localStorage.setItem(POPUP_SEEN_KEY, '1');
  } catch {
    // ignore
  }
}

// The subscription video only opens once the visitor has spent this long on the site.
const VIDEO_DELAY_MS = 60_000;
// When this visit started — kept for the browser tab, so page changes and reloads don't restart the minute.
const VISIT_START_KEY = 'navazano_visit_start';

function visitStart(): number {
  try {
    const saved = Number(sessionStorage.getItem(VISIT_START_KEY));
    if (saved > 0) return saved;
    const now = Date.now();
    sessionStorage.setItem(VISIT_START_KEY, String(now));
    return now;
  } catch {
    return Date.now();
  }
}

type AutoPopup = 'video' | 'bouquet' | null;

export function Popups() {
  const pathname = usePathname();
  const blocked = isNoPopupPath(pathname);
  const [autoPopup, setAutoPopup] = useState<AutoPopup>(null);
  // True once the visitor has been on the site for VIDEO_DELAY_MS.
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const remaining = visitStart() + VIDEO_DELAY_MS - Date.now();
    if (remaining <= 0) {
      setVideoReady(true);
      return;
    }
    const timer = setTimeout(() => setVideoReady(true), remaining);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (blocked || autoPopup || hasSeenPopup()) return;
    const next: AutoPopup = pathname === '/kancelare' ? 'bouquet' : 'video';
    if (next === 'video' && !videoReady) return;
    setAutoPopup(next);
    // The video counts as seen as soon as it opens.
    // The bouquet popup waits 5 s and is marked seen when it actually opens.
    if (next === 'video') markPopupSeen();
  }, [blocked, pathname, autoPopup, videoReady]);

  // Shown or closed: remember it and cancel any pending automatic popup.
  const finishAutoPopup = useCallback(() => {
    markPopupSeen();
    setAutoPopup(null);
  }, []);

  if (blocked) return null;

  return (
    <>
      {autoPopup === 'video' && <VideoPopup onClose={finishAutoPopup} />}
      <CustomBouquetPopup
        autoOpen={autoPopup === 'bouquet'}
        onAutoOpen={finishAutoPopup}
        onClose={finishAutoPopup}
      />
    </>
  );
}
