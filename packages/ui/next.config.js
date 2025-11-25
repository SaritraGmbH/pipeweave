/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@pipeweave/shared'],
  reactStrictMode: true,
  poweredByHeader: false,
};

module.exports = nextConfig;
