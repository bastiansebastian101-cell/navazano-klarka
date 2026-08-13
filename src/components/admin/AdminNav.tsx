'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

export function AdminNav() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin');
  };

  if (pathname === '/admin') return null;

  return (
    <header className="bg-white border-b border-ink-lighter/20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <span className="font-display text-lg text-brand">Navázáno — Admin</span>
        <nav className="flex items-center gap-6">
          <Link
            href="/admin/objednavky"
            className={`text-sm font-medium ${pathname.startsWith('/admin/objednavky') ? 'text-brand' : 'text-ink hover:text-brand'}`}
          >
            {t.admin.orders}
          </Link>
          <Link
            href="/admin/produkty"
            className={`text-sm font-medium ${pathname.startsWith('/admin/produkty') ? 'text-brand' : 'text-ink hover:text-brand'}`}
          >
            {t.admin.products}
          </Link>
          <Link
            href="/admin/kupony"
            className={`text-sm font-medium ${pathname.startsWith('/admin/kupony') ? 'text-brand' : 'text-ink hover:text-brand'}`}
          >
            {t.admin.coupons}
          </Link>
          <Link
            href="/admin/napady"
            className={`text-sm font-medium ${pathname.startsWith('/admin/napady') ? 'text-brand' : 'text-ink hover:text-brand'}`}
          >
            {t.admin.customRequests}
          </Link>
          <Link
            href="/admin/recenze"
            className={`text-sm font-medium ${pathname.startsWith('/admin/recenze') ? 'text-brand' : 'text-ink hover:text-brand'}`}
          >
            {t.admin.reviews}
          </Link>
          <Link
            href="/admin/kalkulacka"
            className={`text-sm font-medium ${pathname.startsWith('/admin/kalkulacka') ? 'text-brand' : 'text-ink hover:text-brand'}`}
          >
            {t.admin.calculator}
          </Link>
          <button onClick={handleLogout} className="text-sm text-ink-light hover:text-brand">
            {t.admin.logout}
          </button>
        </nav>
      </div>
    </header>
  );
}
