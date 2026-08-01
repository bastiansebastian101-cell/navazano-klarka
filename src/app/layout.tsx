import type { Metadata } from 'next';
import { Inter, Fredoka } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { CartProvider } from '@/contexts/CartContext';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
});

const fredoka = Fredoka({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-fredoka',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Navázáno by Klára — Ručně vázané kytice',
  description: 'Ručně vázané kytice a květinové dárky s doručením až k vám domů.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" className={`${inter.variable} ${fredoka.variable}`}>
      <body className="font-sans bg-cream text-ink">
        <LanguageProvider>
          <CartProvider>{children}</CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
