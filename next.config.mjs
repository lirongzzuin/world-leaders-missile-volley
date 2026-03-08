/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      // @apps-in-toss/web-framework is injected at runtime by the Toss shell.
      // Mark it as external so webpack never tries to bundle it.
      config.externals = config.externals || [];
      config.externals.push('@apps-in-toss/web-framework');
    }
    return config;
  },
};

export default nextConfig;
