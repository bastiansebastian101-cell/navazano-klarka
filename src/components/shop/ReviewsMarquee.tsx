'use client';

import type { Review } from '@prisma/client';
import { useLanguage } from '@/contexts/LanguageContext';

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="shrink-0 w-72 bg-white rounded-2xl shadow-card p-5 mx-3">
      <div className="text-brand text-sm mb-2" aria-hidden="true">
        {'★'.repeat(review.rating)}
        <span className="text-ink-lighter/40">{'★'.repeat(5 - review.rating)}</span>
      </div>
      <p className="text-sm text-ink-light line-clamp-4">{review.comment}</p>
      <p className="mt-3 text-sm font-semibold text-ink">{review.customerName}</p>
    </div>
  );
}

export function ReviewsMarquee({ reviews }: { reviews: Review[] }) {
  const { t } = useLanguage();
  if (reviews.length === 0) return null;

  return (
    <section className="py-16 overflow-hidden">
      <h2 className="font-display text-2xl text-ink text-center mb-8">{t.reviews.title}</h2>
      <div className="flex w-max animate-marquee">
        <div className="flex">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
        <div className="flex" aria-hidden="true">
          {reviews.map((review) => (
            <ReviewCard key={`dup-${review.id}`} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
}
