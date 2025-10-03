/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    // Temporary: keep console.log for debugging
    removeConsole: false, // Set to true after debugging
  },
  eslint: {
    ignoreDuringBuilds: true,
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
