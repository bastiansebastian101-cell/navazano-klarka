'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { earliestDeliveryDate } from '@/lib/delivery';

function toDateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function CustomBouquetPopup() {
  const { t } = useLanguage();
  const minDate = useMemo(() => toDateInputValue(earliestDeliveryDate()), []);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(minDate);
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setOpen(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setOpen(false);
    if (submitted) {
      setName('');
      setEmail('');
      setPhone('');
      setDeliveryDate(minDate);
      setMessage('');
      setImageUrl(null);
      setSubmitted(false);
      setError(null);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/custom-requests/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImageUrl(data.url);
    } catch {
      setError(t.customRequest.genericError);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/custom-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, deliveryDate, message, imageUrl }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
    } catch {
      setError(t.customRequest.genericError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-brand hover:bg-brand-hover text-white text-sm font-semibold pl-4 pr-5 py-3 rounded-full shadow-lg transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M12 3c1.5 2 1.5 4-.5 5.5C13.5 7 15.5 7 17 9c-2 .5-3 2-2.5 4M12 3c-1.5 2-1.5 4 .5 5.5C11 7 9 7 7.5 9c2 .5 3 2 2.5 4" />
          <path d="M12 21v-8" />
          <path d="M7 21c0-3 2-4 5-4s5 1 5 4" />
        </svg>
        {t.customRequest.floatingButton}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 backdrop-blur-sm"
          onClick={handleClose}
        >
          <div
            className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClose}
              aria-label={t.customRequest.close}
              className="absolute top-4 right-4 text-ink-light hover:text-ink"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            {submitted ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-3">🌸</p>
                <h3 className="font-display text-xl text-ink mb-2">{t.customRequest.successTitle}</h3>
                <p className="text-ink-light text-sm">{t.customRequest.successMessage}</p>
                <button
                  onClick={handleClose}
                  className="mt-6 bg-brand hover:bg-brand-hover text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-colors"
                >
                  {t.customRequest.close}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h3 className="font-display text-xl text-ink pr-6">{t.customRequest.title}</h3>
                <p className="mt-2 text-sm text-ink-light">{t.customRequest.intro}</p>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-ink-light mb-1">{t.customRequest.name}</label>
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-ink-lighter/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-light mb-1">{t.customRequest.email}</label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-ink-lighter/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-light mb-1">{t.customRequest.phone}</label>
                    <input
                      required
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-ink-lighter/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-light mb-1">{t.customRequest.deliveryDate}</label>
                    <input
                      required
                      type="date"
                      min={minDate}
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full rounded-xl border border-ink-lighter/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-light mb-1">{t.customRequest.message}</label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={t.customRequest.messagePlaceholder}
                      className="w-full rounded-xl border border-ink-lighter/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-light mb-1">{t.customRequest.photoLabel}</label>
                    {imageUrl ? (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-ink-lighter/30">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setImageUrl(null)}
                          className="absolute top-0.5 right-0.5 bg-white/90 rounded-full w-5 h-5 flex items-center justify-center text-xs text-ink-light hover:text-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label className="inline-flex items-center gap-2 text-sm text-brand hover:text-brand-hover cursor-pointer">
                        {uploading ? t.customRequest.uploading : t.customRequest.addPhoto}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUpload(file);
                          }}
                        />
                      </label>
                    )}
                    <p className="mt-1.5 text-xs text-ink-lighter">{t.customRequest.referencePhotoNote}</p>
                  </div>
                </div>

                {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

                <p className="mt-4 text-xs text-ink-lighter">{t.customRequest.priceNote}</p>

                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="mt-3 w-full bg-brand hover:bg-brand-hover disabled:opacity-60 text-white text-sm font-semibold py-3 rounded-full transition-colors"
                >
                  {submitting ? t.customRequest.submitting : t.customRequest.submit}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
