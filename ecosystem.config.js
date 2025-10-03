module.exports = {
  apps: [
    {
      name: "4paws-frontend",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3100",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      autorestart: true,
      max_memory_restart: "300M",
      env_file: ".env.production",
      env: {
        NODE_ENV: "production",
        PORT: "3100",
        BACKEND_API_URL: "http://127.0.0.1:3200",
        NEXT_PUBLIC_API_BASE_URL: "/api",
        // COOKIE_SAME_SITE: "lax",
        // COOKIE_SECURE: "false"
      }
    }
  ]
};


