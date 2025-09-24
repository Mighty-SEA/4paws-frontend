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
      env: { NODE_ENV: "production" }
    }
  ]
};


