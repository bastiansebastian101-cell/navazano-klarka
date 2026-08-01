import QRCode from 'qrcode';

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

export function formatIbanForDisplay(iban: string): string {
  return iban.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
}
