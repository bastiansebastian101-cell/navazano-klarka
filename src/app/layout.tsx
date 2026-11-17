import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { GoogleAnalytics } from '@next/third-parties/google';
import './globals.css';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { CartProvider } from '@/contexts/CartContext';
import { SELLER } from '@/lib/seller';
import { GoogleAdsTag } from '@/components/analytics/GoogleAdsTag';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-playfair',
  display: 'swap',
});

const TITLE = 'Květinářství České Budějovice — Navázáno by Klára | Ručně vázané kytice';
const DESCRIPTION = 'Ručně vázané kytice a květinové dárky s rozvozem po Českých Budějovicích a okolí. Objednejte online, doručíme až k vám domů.';

export const metadata: Metadata = {
  metadataBase: new URL('https://navazano.cz'),
  title: TITLE,
  description: DESCRIPTION,
  keywords: 'květiny České Budějovice, květinářství České Budějovice, kytice České Budějovice, rozvoz květin České Budějovice, květinový dárek',
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://navazano.cz',
    siteName: 'Navázáno by Klára',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    locale: 'cs_CZ',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/og-image.png'],
  },
};

const localBusinessJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Florist',
  name: 'Navázáno by Klára',
  description:
    'Květinářství v Českých Budějovicích — ručně vázané kytice, květiny a květinové dárky s rozvozem zdarma po Českých Budějovicích a okolí.',
  telephone: SELLER.phone.replace(/\s/g, ''),
  email: SELLER.email,
  sameAs: ['https://www.instagram.com/navazano.byklara/', 'https://www.facebook.com/share/19MtZK7uGb/'],
  paymentAccepted: 'Cash, Bank transfer',
  currenciesAccepted: 'CZK',
  image: 'https://navazano.cz/og-image.png',
  url: 'https://navazano.cz',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Pražská tř. 1586/9',
    postalCode: '370 04',
    addressLocality: 'České Budějovice',
    addressCountry: 'CZ',
  },
  areaServed: [
    { '@type': 'City', name: 'České Budějovice' },
    { '@type': 'AdministrativeArea', name: 'Českobudějovicko (PSČ 370–373)' },
  ],
  priceRange: '$$',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="cs" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
      </head>
      <body className="font-sans bg-cream text-ink">
        <LanguageProvider>
          <CartProvider>{children}</CartProvider>
        </LanguageProvider>
      </body>
      {gaId && <GoogleAnalytics gaId={gaId} />}
      <GoogleAdsTag />
    </html>
  );
}
