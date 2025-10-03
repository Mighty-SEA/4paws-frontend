/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build Optimization: Output standalone for faster builds & smaller bundles
  output: 'standalone',
  
  compiler: {
    // Temporary: keep console.log for debugging
    removeConsole: false, // Set to true after debugging
  },
  
  // Build Optimization: Skip type checking during build (use separate typecheck script)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Build Optimization: Parallel compilation
  experimental: {
    webpackBuildWorker: true,
  },
  
  // Allow dev server to accept requests from production domain (for testing)
  allowedDevOrigins: ["https://habiburrahman.my.id", "http://habiburrahman.my.id"],
  
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/dashboard/owners",
        permanent: false,
      },
    ];
  },
}

export default nextConfig
