'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

function AccountLoginForm() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await fetch('/api/auth/request-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setSubmitting(false);
    setSent(true);
  };

  return (
    <div className="max-w-sm mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <h1 className="font-display text-3xl text-ink text-center mb-3">{t.account.loginTitle}</h1>

      {sent ? (
        <p className="text-center text-ink-light mt-6">{t.account.checkEmail}</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <p className="text-sm text-ink-light text-center mb-6">{t.account.loginIntro}</p>
          {urlError === 'expired' && <p className="text-red-600 text-sm mb-3 text-center">{t.account.linkExpired}</p>}
          {urlError === 'invalid' && <p className="text-red-600 text-sm mb-3 text-center">{t.account.linkInvalid}</p>}
          <input
            required
            type="email"
            placeholder={t.account.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-ink-lighter/30 rounded-lg px-4 py-2.5"
          />
          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full bg-brand hover:bg-brand-hover disabled:opacity-60 text-white font-semibold py-2.5 rounded-full transition-colors"
          >
            {submitting ? t.account.sending : t.account.sendLink}
          </button>
        </form>
      )}
    </div>
  );
}

export default function AccountLoginPage() {
  return (
    <Suspense fallback={null}>
      <AccountLoginForm />
    </Suspense>
  );
}
