'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

export function Header() {
  const { t } = useLanguage();
  const { totalCount } = useCart();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const navLink = (href: string, label: string, onClick?: () => void) => (
    <Link
      href={href}
      onClick={onClick}
      className={`text-sm font-medium transition-colors ${
        pathname === href ? 'text-brand' : 'text-ink hover:text-brand'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 bg-cream/95 backdrop-blur border-b border-ink-lighter/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-6">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Menu"
          aria-expanded={menuOpen}
          className="md:hidden flex-shrink-0 -ml-1 p-2 text-ink"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>

        <Link href="/" className="flex-shrink-0 min-w-0 truncate">
          <span className="font-display text-xl sm:text-2xl tracking-tight text-brand">Navázáno</span>
          <span className="font-display text-xl sm:text-2xl tracking-tight text-ink"> by Klára</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 mx-auto">
          {navLink('/', t.nav.home)}
          {navLink('/katalog', t.nav.catalog)}
          {navLink('/o-nas', t.nav.about)}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <Link href="/ucet" className="hidden md:inline text-sm font-medium text-ink hover:text-brand transition-colors">
            {t.nav.account}
          </Link>
          <Link
            href="/kosik"
            className="relative inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white text-sm font-semibold px-3 sm:px-4 py-2 rounded-full transition-colors"
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

      {menuOpen && (
        <nav className="md:hidden border-t border-ink-lighter/20 bg-cream px-4 py-4 flex flex-col gap-4">
          {navLink('/', t.nav.home, () => setMenuOpen(false))}
          {navLink('/katalog', t.nav.catalog, () => setMenuOpen(false))}
          {navLink('/o-nas', t.nav.about, () => setMenuOpen(false))}
          {navLink('/ucet', t.nav.account, () => setMenuOpen(false))}
        </nav>
      )}
    </header>
  );
}
