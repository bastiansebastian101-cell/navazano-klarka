'use client';

import { useEffect } from 'react';
import { GOOGLE_ADS_ID, GOOGLE_ADS_PURCHASE_LABEL } from '@/lib/googleAds';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// Reports one completed order to Google Ads (and GA4, if loaded) with its real value.
// Fires once per order per browser, so reloading or revisiting the confirmation page
// doesn't count the sale again; transaction_id also lets Google de-duplicate it.
export function PurchaseConversion({ orderNumber, valueCzk }: { orderNumber: number; valueCzk: number }) {
  useEffect(() => {
    const adsId = GOOGLE_ADS_ID;
    const label = GOOGLE_ADS_PURCHASE_LABEL;
    const storageKey = `purchase-tracked-${orderNumber}`;

    try {
      if (localStorage.getItem(storageKey)) return;
    } catch {
      // Storage unavailable: still report; Google de-duplicates by transaction_id.
    }

    window.dataLayer = window.dataLayer || [];
    const gtag =
      window.gtag ??
      function gtag() {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer!.push(arguments);
      };

    const transactionId = String(orderNumber);

    if (adsId && label) {
      gtag('event', 'conversion', {
        send_to: `${adsId}/${label}`,
        value: valueCzk,
        currency: 'CZK',
        transaction_id: transactionId,
      });
    }

    // GA4 ecommerce purchase event (only reaches GA4 if NEXT_PUBLIC_GA_ID is set).
    gtag('event', 'purchase', {
      transaction_id: transactionId,
      value: valueCzk,
      currency: 'CZK',
    });

    try {
      localStorage.setItem(storageKey, '1');
    } catch {
      // ignore
    }
  }, [orderNumber, valueCzk]);

  return null;
}
