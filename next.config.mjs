/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Serve images from the Laravel backend directly instead of routing them
    // through Next.js's built-in optimizer/proxy. The backend already converts
    // every upload to compressed WebP, so there's nothing extra to gain from
    // Next re-optimizing them — and the proxy step is what was silently failing
    // to load images (a known local-dev gotcha where Next's server-side fetch
    // can't always reach "localhost" the same way the browser does).
    unoptimized: true,
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
