# Configuration Guide

This document explains how to configure Low Society for different deployment scenarios.

## Quick Start

1. **Copy the example configuration:**
   ```bash
   cp config.example.js config.js
   ```

2. **Edit config.js** with your settings (see below for scenarios)

3. **Start the game** - your settings will be automatically loaded

## Why config.js is Gitignored

The `config.js` file is excluded from version control (`.gitignore`) because it contains personal settings:
- Your local IP address
- Your Cloudflare domain names
- Custom network configurations

This prevents accidentally committing personal information to the repository. Instead, we provide `config.example.js` as a template.

## Configuration Scenarios

### Localhost Development (Default)

For local testing on your own computer:

```javascript
// config.js
module.exports = {
  server: {
    host: 'localhost',  // Only accessible from your computer
    port: 3003,
    corsOrigins: '*',
  },
  client: {
    port: 3004,
    serverUrl: 'http://localhost:3003',
    exposeToNetwork: false,  // Don't expose to network
  },
};
```

### LAN Multiplayer

For playing with friends on the same network:

1. Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Update config.js:

```javascript
// config.js
module.exports = {
  server: {
    host: '0.0.0.0',  // Accept connections from network
    port: 3003,
    corsOrigins: '*',
  },
  client: {
    port: 3004,
    serverUrl: 'http://192.168.1.100:3003',  // Your actual IP
    exposeToNetwork: true,
  },
  network: {
    localIP: '192.168.1.100',  // Your actual IP
  },
};
```

3. Open firewall ports 3003 and 3004
4. Share `http://YOUR_IP:3004` with friends

**See [LAN-SETUP.md](LAN-SETUP.md) for detailed instructions.**

### Cloudflare Zero Trust (Remote Play)

For playing with friends over the internet using Cloudflare tunnels:

```javascript
// config.js
module.exports = {
  server: {
    host: '0.0.0.0',
    port: 3003,
    corsOrigins: '*',
  },
  client: {
    port: 3004,
    serverUrl: 'https://server.yourdomain.com',  // Your tunnel URL
    exposeToNetwork: true,
  },
  cloudflare: {
    serverUrl: 'https://server.yourdomain.com',
    clientUrl: 'https://game.yourdomain.com',
  },
};
```

**See [CLOUDFLARE-SETUP.md](CLOUDFLARE-SETUP.md) for detailed instructions.**

### Production Deployment

For hosting on a server:

```javascript
// config.js
module.exports = {
  server: {
    host: '0.0.0.0',
    port: process.env.PORT || 3003,
    corsOrigins: ['https://yourdomain.com'],  // Restrict to your domain
  },
  client: {
    serverUrl: 'https://yourdomain.com',
    exposeToNetwork: true,
  },
  game: {
    debug: false,  // Disable debug logging
  },
};
```

## Environment Variables

You can override configuration using environment variables:

### Server
- `PORT` - Server port (default: 3003)

### Client
- `VITE_SERVER_URL` - Server URL to connect to

**Example:**
```bash
# Windows PowerShell
$env:VITE_SERVER_URL="http://192.168.1.100:3003"

# Mac/Linux
export VITE_SERVER_URL="http://192.168.1.100:3003"

# Or create a .env file in client/
echo "VITE_SERVER_URL=http://192.168.1.100:3003" > client/.env
```

## Configuration Options

### Server Settings

| Option | Description | Default |
|--------|-------------|---------|
| `server.host` | Host to bind to | `'0.0.0.0'` |
| `server.port` | Port to listen on | `3003` |
| `server.corsOrigins` | Allowed CORS origins | `'*'` |

### Client Settings

| Option | Description | Default |
|--------|-------------|---------|
| `client.port` | Vite dev server port | `3004` |
| `client.serverUrl` | Game server URL | `'http://localhost:3003'` |
| `client.exposeToNetwork` | Expose to network | `false` |

### Game Settings

| Option | Description | Default |
|--------|-------------|---------|
| `game.minPlayers` | Minimum players | `3` |
| `game.maxPlayers` | Maximum players | `5` |
| `game.startingMoney` | Starting money | `40` |
| `game.deckSize` | Number of cards | `15` |
| `game.debug` | Debug logging | `false` |

## Troubleshooting

### "Could not load config.js"
- Make sure you copied `config.example.js` to `config.js`
- Check for syntax errors in your config.js

### Players can't connect
- Check firewall settings (ports 3003, 3004)
- Verify your IP address is correct
- Ensure `server.host` is `'0.0.0.0'` for network play
- Check `client.exposeToNetwork` is `true`

### CORS errors
- Set `server.corsOrigins` to `'*'` for development/LAN
- For production, specify exact domains: `['https://yourdomain.com']`

## Security Notes

### Development/LAN
- `corsOrigins: '*'` is safe for local networks
- Don't expose directly to internet without additional security

### Production
- Always specify exact CORS origins
- Use HTTPS (Cloudflare or proper SSL certificates)
- Consider adding authentication
- Enable rate limiting
- Keep dependencies updated

## Support Files

- **README.md** - Main project documentation
- **LAN-SETUP.md** - Detailed LAN setup instructions
- **CLOUDFLARE-SETUP.md** - Cloudflare tunnel setup
- **config.example.js** - Example configuration template
- **.env.example** - Environment variable template
- **client/.env.example** - Client environment variable template
