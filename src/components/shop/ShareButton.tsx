'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

async function copyToClipboard(text: string) {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

export function ShareButton({
  productId,
  variant = 'icon',
  className,
}: {
  productId: string;
  variant?: 'icon' | 'labeled';
  className?: string;
}) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/produkt/${productId}`;
    await copyToClipboard(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const icon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.6" y1="10.6" x2="15.4" y2="6.4" />
      <line x1="8.6" y1="13.4" x2="15.4" y2="17.6" />
    </svg>
  );

  if (variant === 'labeled') {
    return (
      <button
        type="button"
        onClick={handleShare}
        className={
          className ??
          'inline-flex items-center gap-2 text-sm font-semibold text-ink-light hover:text-brand transition-colors'
        }
      >
        {icon}
        {copied ? t.product.linkCopied : t.product.share}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={t.product.share}
      title={copied ? t.product.linkCopied : t.product.share}
      className={className ?? 'text-ink-light hover:text-brand transition-colors'}
    >
      {icon}
    </button>
  );
}
