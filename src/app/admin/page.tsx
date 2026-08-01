'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminLoginPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error === 'Invalid password' ? t.admin.wrongPassword : data.error ?? t.admin.wrongPassword);
      setSubmitting(false);
      return;
    }

    router.push('/admin/objednavky');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-light px-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card p-8 w-full max-w-sm">
        <h1 className="font-display text-2xl text-ink mb-6 text-center">{t.admin.login}</h1>
        <input
          type="password"
          required
          placeholder={t.admin.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-ink-lighter/30 rounded-lg px-4 py-2.5"
        />
        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-5 w-full bg-brand hover:bg-brand-hover disabled:opacity-60 text-white font-semibold py-2.5 rounded-full transition-colors"
        >
          {t.admin.loginButton}
        </button>
      </form>
    </div>
  );
}
