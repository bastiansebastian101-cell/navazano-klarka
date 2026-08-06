import QRCode from 'qrcode';
import { put } from '@vercel/blob';

// Czech "QR Platba" standard (SPD - Short Payment Descriptor).
// Spec: https://qr-platba.cz/pro-vyvojare/specifikace-formatu/

function buildSpdString(params: {
  iban: string;
  amountCzk: number; // haléře
  variableSymbol: number;
  message: string;
}): string {
  const amount = (params.amountCzk / 100).toFixed(2);
  const iban = params.iban.replace(/\s/g, '');
  // SPD fields are separated by '*'; MSG is limited/sanitized to avoid stray '*' or newlines.
  const message = params.message.replace(/[*\n\r]/g, ' ').slice(0, 60);
  return `SPD*1.0*ACC:${iban}*AM:${amount}*CC:CZK*X-VS:${params.variableSymbol}*MSG:${message}`;
}

export async function generatePaymentQrDataUrl(params: {
  amountCzk: number;
  variableSymbol: number;
  message: string;
}): Promise<string | null> {
  const iban = process.env.BANK_IBAN;
  if (!iban) return null;

  const spd = buildSpdString({ iban, amountCzk: params.amountCzk, variableSymbol: params.variableSymbol, message: params.message });
  return QRCode.toDataURL(spd, { errorCorrectionLevel: 'M', margin: 1, width: 240 });
}

// Most email clients (Gmail included) strip or refuse to render inline
// `data:` URI images for security reasons, so a QR code meant to be used in
// an email needs to be a real hosted image (for inline display) AND a real
// file attachment (so it's guaranteed openable even with images blocked).
export async function generatePaymentQrAsset(params: {
  amountCzk: number;
  variableSymbol: number;
  message: string;
}): Promise<{ buffer: Buffer; url: string } | null> {
  const iban = process.env.BANK_IBAN;
  if (!iban) return null;

  const spd = buildSpdString({ iban, amountCzk: params.amountCzk, variableSymbol: params.variableSymbol, message: params.message });
  const buffer = await QRCode.toBuffer(spd, { errorCorrectionLevel: 'M', margin: 1, width: 240 });
  const blob = await put(`payment-qr/${params.variableSymbol}.png`, buffer, {
    access: 'public',
    contentType: 'image/png',
    addRandomSuffix: true,
  });
  return { buffer, url: blob.url };
}

export function formatIbanForDisplay(iban: string): string {
  return iban.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
}
