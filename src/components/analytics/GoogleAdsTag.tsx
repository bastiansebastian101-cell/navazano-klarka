import Script from 'next/script';
import { GOOGLE_ADS_ID } from '@/lib/googleAds';

// Loads the Google Ads tag (gtag.js).
export function GoogleAdsTag() {
  const adsId = GOOGLE_ADS_ID;
  if (!adsId) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${adsId}`} strategy="afterInteractive" />
      <Script id="google-ads-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${adsId}');`}
      </Script>
    </>
  );
}
