const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: process.env.NEXT_OUTPUT_MODE,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
    domains: [
      "omo-oss-image.thefastimg.com",
      // Add any other domains you use for images here
    ],
  },
  // Ensure native Node.js addons and heavy server-only deps are not bundled by webpack
  experimental: {
    // Treat these packages as external in server builds (App Router / RSC)
    serverComponentsExternalPackages: [
      '@napi-rs/canvas',
      'tesseract.js',
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Keep the native module external so Node can load the .node binary at runtime
      const externalHandler = ({ request }, callback) => {
        if (request === '@napi-rs/canvas') {
          return callback(null, 'commonjs @napi-rs/canvas');
        }
        return callback();
      };

      if (Array.isArray(config.externals)) {
        config.externals.push(externalHandler);
      } else if (typeof config.externals === 'function') {
        const prev = config.externals;
        config.externals = async (ctx, cb) => {
          externalHandler(ctx, (err, res) => {
            if (res) return cb(err, res);
            return prev(ctx, cb);
          });
        };
      }
    }
    return config;
  },
};

module.exports = nextConfig;