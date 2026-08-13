'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const DPH_RATE = 21; // %, fixed Czech standard VAT rate

const CHANNELS = [
  { key: 'website', commissionPercent: 0 },
  { key: 'foodora', commissionPercent: 21 },
  { key: 'wolt', commissionPercent: 24 },
  { key: 'bolt', commissionPercent: 30 },
] as const;

type ChannelKey = (typeof CHANNELS)[number]['key'];

function toNumber(value: string): number {
  const n = parseFloat(value.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function formatExact(amount: number): string {
  return `${amount.toLocaleString('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kč`;
}

export default function ProfitCalculatorPage() {
  const { t } = useLanguage();
  const [flowerCostInput, setFlowerCostInput] = useState('');
  const [wrapCostInput, setWrapCostInput] = useState('');
  const [salePriceInputs, setSalePriceInputs] = useState<Record<ChannelKey, string>>({
    website: '',
    foodora: '',
    wolt: '',
    bolt: '',
  });

  const flowerCost = toNumber(flowerCostInput);
  const wrapCost = toNumber(wrapCostInput);
  const totalCost = flowerCost + wrapCost;

  return (
    <div>
      <h1 className="font-display text-2xl text-ink mb-2">{t.admin.calculatorTitle}</h1>
      <p className="text-sm text-ink-light mb-6">{t.admin.calculatorIntro}</p>

      <div className="bg-white rounded-xl shadow-card p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
        <div>
          <label className="block text-sm text-ink-light mb-1">{t.admin.flowerCost}</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={flowerCostInput}
            onChange={(e) => setFlowerCostInput(e.target.value)}
            className="w-full border border-ink-lighter/30 rounded-lg px-4 py-2.5"
          />
        </div>
        <div>
          <label className="block text-sm text-ink-light mb-1">{t.admin.wrapCost}</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={wrapCostInput}
            onChange={(e) => setWrapCostInput(e.target.value)}
            className="w-full border border-ink-lighter/30 rounded-lg px-4 py-2.5"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CHANNELS.map((channel) => {
          const hasSalePrice = salePriceInputs[channel.key].trim() !== '';
          const salePrice = toNumber(salePriceInputs[channel.key]);
          const dph = (salePrice * DPH_RATE) / (100 + DPH_RATE);
          const commission = (salePrice * channel.commissionPercent) / 100;
          const profit = salePrice - dph - commission - totalCost;

          return (
            <div key={channel.key} className="bg-white rounded-xl shadow-card p-5">
              <h2 className="font-medium text-ink mb-1">{t.admin.channels[channel.key]}</h2>
              <p className="text-xs text-ink-lighter mb-3">
                {t.admin.commissionLabel}: {channel.commissionPercent}%
              </p>

              <label className="block text-xs text-ink-light mb-1">{t.admin.salePrice}</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={salePriceInputs[channel.key]}
                onChange={(e) =>
                  setSalePriceInputs((prev) => ({ ...prev, [channel.key]: e.target.value }))
                }
                className="w-full border border-ink-lighter/30 rounded-lg px-3 py-2 mb-3"
              />

              {!hasSalePrice && <p className="text-xs text-brand mb-3">{t.admin.enterSalePriceHint}</p>}

              <div className="space-y-1.5 text-sm text-ink-light border-t border-ink-lighter/15 pt-3">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="whitespace-nowrap">{t.admin.dphLabel}</span>
                  <span className="whitespace-nowrap">{hasSalePrice ? `−${formatExact(dph)}` : '—'}</span>
                </div>
                <div className="flex justify-between items-baseline gap-2">
                  <span className="whitespace-nowrap">
                    {t.admin.commissionAmountLabel} ({channel.commissionPercent}%)
                  </span>
                  <span className="whitespace-nowrap">{hasSalePrice ? `−${formatExact(commission)}` : '—'}</span>
                </div>
                <div className="flex justify-between items-baseline gap-2">
                  <span className="whitespace-nowrap">{t.admin.costLabel}</span>
                  <span className="whitespace-nowrap">−{formatExact(totalCost)}</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline gap-2 mt-3 pt-3 border-t border-ink-lighter/20">
                <span className="font-medium text-ink whitespace-nowrap">{t.admin.profitLabel}</span>
                <span className={`font-semibold whitespace-nowrap ${profit < 0 ? 'text-red-600' : 'text-sage-dark'}`}>
                  {hasSalePrice ? formatExact(profit) : `−${formatExact(totalCost)}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
