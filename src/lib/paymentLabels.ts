/** Czech label for a stored paymentMethod value (emails, admin). */
export function paymentLabelCs(method: string): string {
  if (method === 'bank_transfer') return 'Bankovní převod';
  if (method === 'card') return 'Kartou / Google Pay / Apple Pay';
  return 'Platba při doručení';
}
