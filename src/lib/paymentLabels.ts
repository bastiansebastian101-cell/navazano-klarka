/** Czech label for a stored paymentMethod value (emails, admin). */
export function paymentLabelCs(method: string): string {
  if (method === 'bank_transfer') return 'Bankovní převod';
  if (method === 'gopay') return 'Kartou / Google Pay (GoPay)';
  return 'Platba při doručení';
}
