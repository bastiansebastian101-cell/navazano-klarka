// Google Ads account tag and the "Objednávka – potvrzeno" purchase conversion.
// These IDs are public (every visitor's browser sees them). Env vars override them.
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || 'AW-18550148978';
export const GOOGLE_ADS_PURCHASE_LABEL =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL || 'KlsvCJTfjLodEPKes41F';
