// Seller (provozovatel) details shown in the footer, terms of sale and privacy policy.
// Czech law (§ 435 OZ) requires the full official name + IČO on the website.
// ⚠️ Fill in the TODO values before publishing.

export const SELLER = {
  shopName: 'Navázáno by Klára',
  web: 'navazano.cz',
  legalName: 'Sebin Varghese', // full official name of the IČO holder
  ico: '23585081',
  dic: '', // not a VAT payer
  vatPayer: false,
  street: 'Pražská třída 1586/9',
  zip: '370 04',
  city: 'České Budějovice',
  email: 'navazanocz@gmail.com',
  phone: '+420 728 415 630',
} as const;

export const SELLER_ADDRESS = `${SELLER.street}, ${SELLER.zip} ${SELLER.city}`;

/** True while any required detail is still a placeholder — used by a guard test before deploy. */
export const SELLER_INCOMPLETE = Object.values(SELLER).some((v) => typeof v === 'string' && v.includes('TODO'));
