'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

export function Header() {
  const { t } = useLanguage();
  const { totalCount } = useCart();
  const pathname = usePathname();

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`text-sm font-medium transition-colors ${
        pathname === href ? 'text-brand' : 'text-ink hover:text-brand'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 bg-cream/95 backdrop-blur border-b border-ink-lighter/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        <Link href="/" className="flex-shrink-0">
          <span className="font-display text-2xl tracking-tight text-brand">Navazano</span>
          <span className="font-display text-2xl tracking-tight text-ink"> by Klara</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLink('/', t.nav.home)}
          {navLink('/katalog', t.nav.catalog)}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            href="/kosik"
            className="relative inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
          >
            {t.nav.cart}
            {totalCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-white text-brand text-xs font-bold">
                {totalCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
