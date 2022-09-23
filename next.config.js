/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /**
   * TODO Turn back on once this issue is fixed https://github.com/chartjs/Chart.js/issues/10673
   * This does not change any behavior, but makes minifying faster, hence faster builds.
   */
  swcMinify: false,
}

module.exports = nextConfig
