import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensures the openGraph and twitter image URLs in the root layout
  // resolve to the public deployment domain instead of the internal
  // Next.js dev server. The value is a build-time constant for the
  // hosted demo; local dev still works because the metadataBase
  // is only used for absolute URL generation, not for routing.
  env: {
    NEXT_PUBLIC_SITE_URL:
      process.env.VERCEL_ENV === "production"
        ? "https://launchlens-ai-two.vercel.app"
        : "http://localhost:3000",
  },
};

export default nextConfig;
