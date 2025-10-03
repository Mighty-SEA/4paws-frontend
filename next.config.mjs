/** @type {import('next').NextConfig} */
const nextConfig = {
  // Note: 'output: standalone' disabled due to Windows symlink permission issues with pnpm
  // output: 'standalone',
  
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
  
  // Image Optimization Configuration
  images: {
    formats: ['image/webp', 'image/avif'], // Use modern formats
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60, // Cache optimized images for 60 seconds
    qualities: [50, 75, 85, 90, 95, 100], // Configure allowed quality values
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
