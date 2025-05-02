/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `zlib-sync` module
    // discord.js uses this optionally
    // Apply fallback universally (client and server)
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'zlib-sync': false, // Tells Webpack to ignore 'zlib-sync' import
    };

    return config;
  },
};

export default nextConfig;
