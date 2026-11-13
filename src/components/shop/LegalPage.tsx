import Link from 'next/link';
import type { ReactNode } from 'react';

/** Shared layout for the terms of sale and privacy pages (Czech is the binding language). */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <h1 className="font-display text-3xl sm:text-4xl text-ink">{title}</h1>
      <p className="mt-2 text-sm text-ink-light">
        Účinné od {updated} · <span lang="en">The binding version of this document is in Czech.</span>
      </p>
      <div className="legal mt-8 space-y-4 text-ink leading-relaxed text-[15px]">{children}</div>
      <p className="mt-12 text-sm">
        <Link href="/" className="text-brand hover:text-brand-hover font-medium">
          ← Zpět na hlavní stránku
        </Link>
      </p>
    </div>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="font-display text-xl text-ink pt-6">{children}</h2>;
}
