'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCzk } from '@/lib/format';

const DPH_RATE = 21; // %, fixed Czech standard VAT rate

const CHANNELS = [
  { key: 'website', commissionPercent: 0 },
  { key: 'foodora', commissionPercent: 21 },
  { key: 'wolt', commissionPercent: 24 },
  { key: 'bolt', commissionPercent: 30 },
] as const;

type ChannelKey = (typeof CHANNELS)[number]['key'];

export default function ProfitCalculatorPage() {
  const { t } = useLanguage();
  const [flowerCost, setFlowerCost] = useState(0);
  const [wrapCost, setWrapCost] = useState(0);
  const [salePrices, setSalePrices] = useState<Record<ChannelKey, number>>({
    website: 0,
    foodora: 0,
    wolt: 0,
    bolt: 0,
  });

  const totalCost = flowerCost + wrapCost;

  return (
    <div>
      <h1 className="font-display text-2xl text-ink mb-2">{t.admin.calculatorTitle}</h1>
      <p className="text-sm text-ink-light mb-6">{t.admin.calculatorIntro}</p>

      <div className="bg-white rounded-xl shadow-card p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
        <div>
          <label className="block text-sm text-ink-light mb-1">{t.admin.flowerCost}</label>
          <input
            type="number"
            min={0}
            value={flowerCost}
            onChange={(e) => setFlowerCost(Math.max(0, Number(e.target.value) || 0))}
            className="w-full border border-ink-lighter/30 rounded-lg px-4 py-2.5"
          />
        </div>
        <div>
          <label className="block text-sm text-ink-light mb-1">{t.admin.wrapCost}</label>
          <input
            type="number"
            min={0}
            value={wrapCost}
            onChange={(e) => setWrapCost(Math.max(0, Number(e.target.value) || 0))}
            className="w-full border border-ink-lighter/30 rounded-lg px-4 py-2.5"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CHANNELS.map((channel) => {
          const salePrice = salePrices[channel.key];
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
                type="number"
                min={0}
                value={salePrice}
                onChange={(e) =>
                  setSalePrices((prev) => ({ ...prev, [channel.key]: Math.max(0, Number(e.target.value) || 0) }))
                }
                className="w-full border border-ink-lighter/30 rounded-lg px-3 py-2 mb-3"
              />

              <div className="space-y-1 text-sm text-ink-light border-t border-ink-lighter/15 pt-3">
                <div className="flex justify-between">
                  <span>{t.admin.dphLabel}</span>
                  <span>−{formatCzk(dph * 100)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.admin.commissionAmountLabel}</span>
                  <span>−{formatCzk(commission * 100)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.admin.costLabel}</span>
                  <span>−{formatCzk(totalCost * 100)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mt-3 pt-3 border-t border-ink-lighter/20">
                <span className="font-medium text-ink">{t.admin.profitLabel}</span>
                <span className={`font-semibold ${profit < 0 ? 'text-red-600' : 'text-sage-dark'}`}>
                  {formatCzk(profit * 100)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
