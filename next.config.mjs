/** @type {import('next').NextConfig} */

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
];

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    return [
      // Proxies the separate bouquet-stock app (its own repo/Vercel project)
      // under navazano.cz/stock. That app is configured with basePath: '/stock'
      // so its own routes/assets already live at this same prefix — see
      // project_bouquet_stock_calculator memory for the full setup.
      {
        source: '/stock/:path*',
        destination: 'https://bouquet-stock.vercel.app/stock/:path*',
      },
    ];
  },
  images: {
    remotePatterns: [{ hostname: '*.public.blob.vercel-storage.com' }],
  },
};

export default nextConfig;
