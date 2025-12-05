/**
 * Low Society Game Configuration - EXAMPLE FILE
 *
 * Copy this file to config.js and edit the values for your setup.
 * DO NOT commit config.js to version control - it may contain personal URLs/IPs!
 *
 * Quick Setup:
 *   1. Copy this file: cp config.example.js config.js
 *   2. Edit config.js with your settings
 *   3. Start the server and client
 */

module.exports = {
  // ===================================
  // SERVER CONFIGURATION
  // ===================================
  server: {
    // Port the game server runs on
    port: 3003,

    // Host to bind to
    // Use '0.0.0.0' to accept connections from any network interface (required for LAN)
    // Use 'localhost' or '127.0.0.1' for local-only connections
    host: '0.0.0.0',

    // CORS origins - domains allowed to connect to the server
    // For LAN play, use '*' to allow all origins
    // For production, specify exact domains: ['http://192.168.1.100:3004', 'http://example.com']
    corsOrigins: '*',
  },

  // ===================================
  // CLIENT CONFIGURATION
  // ===================================
  client: {
    // Port the client dev server runs on
    port: 3004,

    // Server URL the client should connect to
    // For localhost: 'http://localhost:3003'
    // For LAN: 'http://YOUR_LOCAL_IP:3003' (e.g., 'http://192.168.1.100:3003')
    // For Cloudflare ZeroTrust: 'https://server.your-domain.com'
    // The client will use this to connect to the game server
    serverUrl: process.env.VITE_SERVER_URL || 'http://localhost:3003',

    // Whether to expose the client on the network
    // Set to true for LAN/remote multiplayer so other devices can access the game
    // Set to false for localhost-only development
    exposeToNetwork: false,
  },

  // ===================================
  // GAME SETTINGS
  // ===================================
  game: {
    // Minimum players required to start a game
    minPlayers: 3,

    // Maximum players allowed in a game
    maxPlayers: 5,

    // Starting money for each player
    startingMoney: 40,

    // Number of cards in the deck
    deckSize: 15,

    // Enable debug logging
    debug: false,
  },

  // ===================================
  // NETWORK CONFIGURATION (LAN SETUP)
  // ===================================
  network: {
    // Your computer's local IP address on the LAN
    // To find your IP:
    //   Windows: Run 'ipconfig' and look for 'IPv4 Address'
    //   Mac/Linux: Run 'ifconfig' or 'ip addr' and look for 'inet'
    // Example: '192.168.1.100'
    localIP: null, // Set this to your local IP for LAN play

    // Firewall note:
    // Make sure ports 3003 (server) and 3004 (client) are open in your firewall
    // Windows Firewall: Control Panel > System and Security > Windows Defender Firewall > Allow an app
    // Mac: System Preferences > Security & Privacy > Firewall > Firewall Options
  },

  // ===================================
  // QUICK SETUP PROFILES
  // ===================================
  profiles: {
    // Development (localhost only)
    development: {
      server: { host: 'localhost', port: 3003, corsOrigins: '*' },
      client: { serverUrl: 'http://localhost:3003', exposeToNetwork: false },
    },

    // LAN Multiplayer (local network)
    // Replace 192.168.1.100 with your actual local IP
    lan: {
      server: { host: '0.0.0.0', port: 3003, corsOrigins: '*' },
      client: { serverUrl: 'http://192.168.1.100:3003', exposeToNetwork: true },
    },

    // Cloudflare ZeroTrust (tunneled subdomain access)
    // Replace with your actual Cloudflare tunnel URLs
    cloudflare: {
      server: { host: '0.0.0.0', port: 3003, corsOrigins: '*' },
      client: {
        serverUrl: 'https://server.yourdomain.com',
        exposeToNetwork: true
      },
    },

    // Production (deployed to server)
    production: {
      server: { host: '0.0.0.0', port: 3003, corsOrigins: ['https://yourdomain.com'] },
      client: { serverUrl: 'https://yourdomain.com', exposeToNetwork: true },
    },
  },

  // ===================================
  // CLOUDFLARE ZEROTRUST CONFIGURATION
  // ===================================
  cloudflare: {
    // Cloudflare tunnel configuration
    // After setting up Cloudflare Zero Trust tunnels, update these URLs

    // Server tunnel URL (backend/API)
    // Example: 'https://lowsociety-server.yourdomain.com'
    serverUrl: null,

    // Client tunnel URL (frontend)
    // Example: 'https://lowsociety-client.yourdomain.com'
    clientUrl: null,

    // Note: Make sure your tunnel is configured to forward to:
    // - Server tunnel → localhost:3003
    // - Client tunnel → localhost:3004
  },
};
