'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';

export function ImageGallery({
  images,
  alt,
  size = 'card',
}: {
  images: string[];
  alt: string;
  size?: 'card' | 'detail';
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-5xl">🌸</div>
    );
  }

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(index);
  };

  const scrollToIndex = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
  };

  const showArrows = size === 'detail' && images.length > 1;

  return (
    <div className="relative w-full h-full group">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar w-full h-full"
      >
        {images.map((url, i) => (
          <div key={url} className="snap-center shrink-0 w-full h-full relative">
            <Image src={url} alt={`${alt} ${i + 1}`} fill className="object-cover" priority={i === 0} />
          </div>
        ))}
      </div>

      {showArrows && (
        <>
          {activeIndex > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                scrollToIndex(activeIndex - 1);
              }}
              aria-label="Předchozí fotka"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow-card flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ‹
            </button>
          )}
          {activeIndex < images.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                scrollToIndex(activeIndex + 1);
              }}
              aria-label="Další fotka"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow-card flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ›
            </button>
          )}
        </>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5 pointer-events-none">
          {images.map((url, i) => (
            <span
              key={url}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === activeIndex ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
