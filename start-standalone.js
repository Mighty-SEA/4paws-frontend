// Standalone server starter with custom host and port
const { spawn } = require('child_process');
const path = require('path');

const PORT = process.env.PORT || 3100;
const HOST = process.env.HOST || '0.0.0.0';

// Set environment variables for Next.js standalone server
process.env.PORT = PORT;
process.env.HOSTNAME = HOST;

console.log(`Starting Next.js standalone server...`);
console.log(`Host: ${HOST}`);
console.log(`Port: ${PORT}`);
console.log(`Access via: http://${HOST === '0.0.0.0' ? '10.49.241.99' : HOST}:${PORT}`);
console.log('');

// Start the standalone server
const serverPath = path.join(__dirname, '.next', 'standalone', 'server.js');
const child = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: process.env
});

child.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code);
});

