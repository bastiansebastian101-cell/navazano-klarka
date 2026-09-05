'use client';

import { useState } from 'react';
import type { OfficeSubscriptionPlan } from '@prisma/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCzk } from '@/lib/format';

type Commitment = 'monthly' | 'yearly';

export function OfficeSubscriptionPage({ plans }: { plans: OfficeSubscriptionPlan[] }) {
  const { language, t } = useLanguage();
  const [commitment, setCommitment] = useState<Commitment>('monthly');
  const [planTier, setPlanTier] = useState<string>(plans[0]?.tier ?? '');

  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectPlan = (tier: string) => {
    setPlanTier(tier);
    document.getElementById('office-subscription-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/office-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, contactName, email, phone, deliveryAddress, planTier, commitment, message }),
      });
      if (!res.ok) {
        setError(t.officeSubscription.genericError);
        return;
      }
      setSubmitted(true);
    } catch {
      setError(t.officeSubscription.genericError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center max-w-xl mx-auto">
        <h1 className="font-display text-3xl sm:text-4xl text-ink">{t.officeSubscription.title}</h1>
        <p className="mt-3 text-ink-light">{t.officeSubscription.intro}</p>
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3 text-sm text-ink">
          <span className="inline-flex items-center gap-2 bg-sage-light rounded-full px-4 py-2">
            🌸 {t.officeSubscription.deliveryPoint}
          </span>
          <span className="inline-flex items-center gap-2 bg-sage-light rounded-full px-4 py-2">
            🏺 {t.officeSubscription.vasePoint}
          </span>
          <span className="inline-flex items-center gap-2 bg-sage-light rounded-full px-4 py-2">
            🚚 {t.officeSubscription.freeDeliveryPoint}
          </span>
        </div>

        <video
          className="mt-8 w-full max-w-lg mx-auto rounded-2xl bg-ink"
          src="/videos/subscription-showcase.mp4"
          autoPlay
          muted
          loop
          playsInline
          controls
        />
      </div>

      <div className="mt-10 flex justify-center">
        <div className="inline-flex bg-sage-light rounded-full p-1">
          <button
            onClick={() => setCommitment('monthly')}
            className={`text-sm font-medium px-4 py-2 rounded-full transition-colors ${
              commitment === 'monthly' ? 'bg-white text-brand shadow-card' : 'text-ink-light'
            }`}
          >
            {t.officeSubscription.monthly}
          </button>
          <button
            onClick={() => setCommitment('yearly')}
            className={`text-sm font-medium px-4 py-2 rounded-full transition-colors ${
              commitment === 'yearly' ? 'bg-white text-brand shadow-card' : 'text-ink-light'
            }`}
          >
            {t.officeSubscription.yearly}
          </button>
        </div>
      </div>

      <div className="mt-8 grid sm:grid-cols-3 gap-5">
        {plans.map((plan) => {
          const name = language === 'cs' ? plan.nameCs : plan.nameEn;
          const description = language === 'cs' ? plan.descriptionCs : plan.descriptionEn;
          const priceCzk = commitment === 'yearly' ? plan.priceYearlyCommitmentCzk : plan.priceMonthlyCzk;
          const selected = planTier === plan.tier;
          return (
            <div
              key={plan.id}
              className={`rounded-3xl bg-white shadow-card p-6 flex flex-col border-2 transition-colors ${
                selected ? 'border-brand' : 'border-transparent'
              }`}
            >
              <h3 className="font-display text-xl text-ink">{name}</h3>
              <p className="mt-2 text-2xl font-semibold text-brand">
                {formatCzk(priceCzk)}
                <span className="text-sm font-normal text-ink-light"> / {t.officeSubscription.perMonth}</span>
              </p>
              <p className="mt-3 text-sm text-ink-light flex-1">{description}</p>
              <button
                onClick={() => selectPlan(plan.tier)}
                className={`mt-5 w-full text-sm font-semibold py-2.5 rounded-full transition-colors ${
                  selected
                    ? 'bg-brand text-white'
                    : 'bg-sage-light text-ink hover:bg-brand hover:text-white'
                }`}
              >
                {selected ? t.officeSubscription.selected : t.officeSubscription.selectPlan}
              </button>
            </div>
          );
        })}
      </div>

      <div id="office-subscription-form" className="mt-14 max-w-lg mx-auto">
        {submitted ? (
          <div className="text-center py-8">
            <p className="text-4xl mb-3">🌸</p>
            <h3 className="font-display text-xl text-ink mb-2">{t.officeSubscription.successTitle}</h3>
            <p className="text-ink-light text-sm">{t.officeSubscription.successMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-card p-6 sm:p-8">
            <h3 className="font-display text-xl text-ink">{t.officeSubscription.formTitle}</h3>
            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-light mb-1">{t.officeSubscription.companyName}</label>
                <input
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-xl border border-ink-lighter/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-light mb-1">{t.officeSubscription.contactName}</label>
                <input
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full rounded-xl border border-ink-lighter/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-light mb-1">{t.officeSubscription.email}</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-ink-lighter/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-light mb-1">{t.officeSubscription.phone}</label>
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-ink-lighter/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-light mb-1">{t.officeSubscription.deliveryAddress}</label>
                <textarea
                  required
                  rows={2}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full rounded-xl border border-ink-lighter/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-light mb-1">{t.officeSubscription.message}</label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t.officeSubscription.messagePlaceholder}
                  className="w-full rounded-xl border border-ink-lighter/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
                />
              </div>
            </div>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting || !planTier}
              className="mt-5 w-full bg-brand hover:bg-brand-hover disabled:opacity-60 text-white text-sm font-semibold py-3 rounded-full transition-colors"
            >
              {submitting ? t.officeSubscription.submitting : t.officeSubscription.submit}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
