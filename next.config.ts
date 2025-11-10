import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_FAKE_EMAIL_DOMAIN: process.env.SUPABASE_FAKE_EMAIL_DOMAIN,
  },
  async redirects() {
    return [
      {
        source: '/admin/dashboard',
        destination: '/admin/schedule',
        permanent: false,
      },
    ]
  },
};

export default nextConfig;
