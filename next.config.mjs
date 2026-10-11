/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" }
    ]
  },
  experimental: {
    serverActions: { bodySizeLimit: "10mb" }
  },
  async rewrites() {
    return [
      // Next treats folders starting with "." as private, so /.well-known must be
      // routed to an API handler. Android requires this exact path for Digital
      // Asset Links (Trusted Web Activity verification for the Android app).
      { source: "/.well-known/assetlinks.json", destination: "/api/assetlinks" }
    ];
  },
  async headers() {
    return [
      {
        // The worker and manifest must never be served stale, otherwise an
        // installed PWA keeps running an old shell after a deploy.
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }]
      },
      {
        source: "/manifest.webmanifest",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }]
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
        ]
      }
    ];
  }
};

export default nextConfig;
