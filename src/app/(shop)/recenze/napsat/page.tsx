'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          aria-label={`${star} star${star === 1 ? '' : 's'}`}
          className="text-3xl leading-none transition-colors"
        >
          <span className={star <= value ? 'text-brand' : 'text-ink-lighter/40'}>★</span>
        </button>
      ))}
    </div>
  );
}

function ReviewForm() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [loading, setLoading] = useState(true);
  const [tokenState, setTokenState] = useState<'valid' | 'not_found' | 'used' | 'expired'>('not_found');

  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setTokenState('not_found');
      setLoading(false);
      return;
    }
    fetch(`/api/reviews/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setTokenState('valid');
          setName(data.customerName ?? '');
        } else {
          setTokenState(data.reason === 'used' ? 'used' : data.reason === 'expired' ? 'expired' : 'not_found');
        }
      })
      .catch(() => setTokenState('not_found'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) {
      setError(t.reviewForm.genericError);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, customerName: name, rating, comment }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
    } catch {
      setError(t.reviewForm.genericError);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-center text-ink-light py-20">…</p>;
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-4xl mb-3">🌸</p>
        <h1 className="font-display text-2xl text-ink mb-2">{t.reviewForm.successTitle}</h1>
        <p className="text-ink-light text-sm">{t.reviewForm.successMessage}</p>
      </div>
    );
  }

  if (tokenState !== 'valid') {
    const message =
      tokenState === 'used' ? t.reviewForm.alreadyUsed
      : tokenState === 'expired' ? t.reviewForm.expiredToken
      : t.reviewForm.invalidToken;
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-ink-light">{message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="font-display text-2xl text-ink text-center mb-2">{t.reviewForm.title}</h1>
      <p className="text-sm text-ink-light text-center mb-8">{t.reviewForm.intro}</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-ink-light mb-1">{t.reviewForm.name}</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-ink-lighter/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-light mb-1">{t.reviewForm.rating}</label>
          <StarRating value={rating} onChange={setRating} />
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-light mb-1">{t.reviewForm.comment}</label>
          <textarea
            required
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t.reviewForm.commentPlaceholder}
            className="w-full rounded-xl border border-ink-lighter/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand hover:bg-brand-hover disabled:opacity-60 text-white text-sm font-semibold py-3 rounded-full transition-colors"
        >
          {submitting ? t.reviewForm.submitting : t.reviewForm.submit}
        </button>
      </form>
    </div>
  );
}

export default function WriteReviewPage() {
  return (
    <Suspense fallback={null}>
      <ReviewForm />
    </Suspense>
  );
}
