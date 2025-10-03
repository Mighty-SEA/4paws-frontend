/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimization: standalone output (smaller bundle)
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  
  compiler: {
    // Remove console in production for smaller bundle
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Build Optimization: Skip type checking during build (use separate typecheck script)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Build Optimization: Parallel compilation & faster builds
  experimental: {
    webpackBuildWorker: true,
    // optimizeCss: true, // Disabled - requires critters package
    optimizePackageImports: ['lucide-react', 'recharts', '@radix-ui/react-dropdown-menu'], // Tree-shake large packages
  },
  
  // Disable source maps in production (faster build)
  productionBrowserSourceMaps: false,
  
  // Webpack optimizations
  webpack: (config, { isServer, dev }) => {
    // Production optimizations
    if (!dev) {
      // Disable source maps for faster builds
      config.devtool = false;
      
      // Optimize bundle splitting
      if (!isServer) {
        config.optimization = {
          ...config.optimization,
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              default: false,
              vendors: false,
              // Vendor chunk for node_modules
              vendor: {
                name: 'vendor',
                chunks: 'all',
                test: /node_modules/,
                priority: 20,
              },
              // Commons chunk
              common: {
                minChunks: 2,
                priority: 10,
                reuseExistingChunk: true,
                enforce: true,
              },
            },
          },
        };
      }
    }
    
    return config;
  },
  
  // Force dynamic rendering for dashboard pages (prevent SSR slowness)
  // This makes pages render on client-side for faster perceived performance
  async headers() {
    return [
      {
        source: '/dashboard/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=0, stale-while-revalidate=59',
          },
        ],
      },
    ];
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
