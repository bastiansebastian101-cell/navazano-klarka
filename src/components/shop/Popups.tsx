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

type AutoPopup = 'video' | 'bouquet' | null;

export function Popups() {
  const pathname = usePathname();
  const blocked = isNoPopupPath(pathname);
  const [autoPopup, setAutoPopup] = useState<AutoPopup>(null);

  useEffect(() => {
    if (blocked || autoPopup || hasSeenPopup()) return;
    const next: AutoPopup = pathname === '/kancelare' ? 'bouquet' : 'video';
    setAutoPopup(next);
    // The video shows straight away, so it counts as seen now.
    // The bouquet popup waits 5 s and is marked seen when it actually opens.
    if (next === 'video') markPopupSeen();
  }, [blocked, pathname, autoPopup]);

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
