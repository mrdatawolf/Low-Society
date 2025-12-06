import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load config
const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = join(__dirname, '..', 'config.js');
let config;
try {
  const configContent = readFileSync(configPath, 'utf8');
  const match = configContent.match(/module\.exports\s*=\s*(\{[\s\S]*\});/);
  if (match) {
    config = eval('(' + match[1] + ')');
  } else {
    config = { client: { port: 3004 }, server: { port: 3003 } };
  }
} catch (error) {
  console.warn('Could not load config.js, using defaults');
  config = { client: { port: 3004 }, server: { port: 3003 } };
}

// Get server URL for proxy (for API calls)
const serverUrl = process.env.VITE_SERVER_URL || config.client?.serverUrl || 'https://lss.ztmoon.com';
console.log('Vite config - Server URL:', serverUrl);

// Build allowedHosts list from config
const allowedHosts = ['localhost'];
if (config.cloudflare?.allowedDomain) {
  allowedHosts.push(config.cloudflare.allowedDomain);
}
if (config.cloudflare?.clientUrl) {
  try {
    allowedHosts.push(new URL(config.cloudflare.clientUrl).hostname);
  } catch (e) {
    console.warn('Invalid clientUrl in config:', config.cloudflare.clientUrl);
  }
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: config.client?.port || 3004,
    host: config.client?.exposeToNetwork ? '0.0.0.0' : 'localhost',
    // Allow access through Cloudflare tunnels and custom domains
    allowedHosts: allowedHosts,
    proxy: {
      '/api': {
        target: serverUrl,
        changeOrigin: true
      }
    }
  }
});
