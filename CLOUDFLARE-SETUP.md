# Cloudflare Zero Trust Setup Guide

This guide explains how to set up Low Society with Cloudflare Zero Trust tunnels so players can connect from anywhere using subdomain URLs.

## What is Cloudflare Zero Trust?

Cloudflare Zero Trust allows you to securely expose your local applications to the internet without opening firewall ports or dealing with dynamic IPs. Perfect for sharing your game with friends over the internet!

## Prerequisites

1. A Cloudflare account (free tier works fine)
2. A domain name managed by Cloudflare
3. Cloudflare `cloudflared` CLI installed

## Step 0: Set Up Configuration

First, create your config file from the example:
```bash
# Copy the example config
cp config.example.js config.js
```

**Note:** The `config.js` file is ignored by git, so your personal domains and tunnel URLs won't be committed to version control.

## Step 1: Install Cloudflared

**Windows:**
```powershell
# Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
# Or use winget:
winget install --id Cloudflare.cloudflared
```

**Mac:**
```bash
brew install cloudflared
```

**Linux:**
```bash
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

## Step 2: Login to Cloudflare

```bash
cloudflared tunnel login
```

This will open your browser to authenticate.

## Step 3: Create a Tunnel

```bash
cloudflared tunnel create lowsociety
```

This creates a tunnel and gives you a Tunnel ID. **Save this ID!**

## Step 4: Configure DNS Records

Create two subdomains for your game:

**Option A: Using CLI**
```bash
# Server subdomain
cloudflared tunnel route dns lowsociety server.yourdomain.com

# Client subdomain
cloudflared tunnel route dns lowsociety game.yourdomain.com
```

**Option B: Using Cloudflare Dashboard**
1. Go to Cloudflare Dashboard → Your Domain → DNS
2. Add CNAME record:
   - Name: `server`
   - Target: `<TUNNEL-ID>.cfargotunnel.com`
   - Proxy: Enabled (orange cloud)
3. Add another CNAME record:
   - Name: `game`
   - Target: `<TUNNEL-ID>.cfargotunnel.com`
   - Proxy: Enabled (orange cloud)

## Step 5: Create Tunnel Configuration

Create a file: `~/.cloudflared/config.yml` (or `C:\Users\YourName\.cloudflared\config.yml` on Windows)

```yaml
tunnel: <YOUR_TUNNEL_ID>
credentials-file: C:\Users\YourName\.cloudflared\<YOUR_TUNNEL_ID>.json

# Route traffic to your local services
ingress:
  # Game Server (Backend)
  - hostname: server.yourdomain.com
    service: http://localhost:3003
    originRequest:
      noTLSVerify: true

  # Game Client (Frontend)
  - hostname: game.yourdomain.com
    service: http://localhost:3004
    originRequest:
      noTLSVerify: true

  # Catch-all rule (required)
  - service: http_status:404
```

Replace:
- `<YOUR_TUNNEL_ID>` with your actual tunnel ID
- `yourdomain.com` with your actual domain

## Step 6: Update Low Society Config

Edit `config.js` in the project root:

```javascript
module.exports = {
  server: {
    host: '0.0.0.0',
    port: 3003,
    corsOrigins: '*', // Or specify: ['https://game.yourdomain.com']
  },

  client: {
    port: 3004,
    serverUrl: 'https://server.yourdomain.com', // Your server subdomain
    exposeToNetwork: true,
  },

  cloudflare: {
    serverUrl: 'https://server.yourdomain.com',
    clientUrl: 'https://game.yourdomain.com',
  },
};
```

## Step 7: Set Environment Variable

**Windows (Command Prompt):**
```cmd
set VITE_SERVER_URL=https://server.yourdomain.com
```

**Windows (PowerShell):**
```powershell
$env:VITE_SERVER_URL="https://server.yourdomain.com"
```

**Mac/Linux:**
```bash
export VITE_SERVER_URL=https://server.yourdomain.com
```

Or create a `.env` file in the `client` directory:
```
VITE_SERVER_URL=https://server.yourdomain.com
```

## Step 8: Start Everything

**Terminal 1 - Start Cloudflare Tunnel:**
```bash
cloudflared tunnel run lowsociety
```

**Terminal 2 - Start Game Server:**
```bash
cd server
npm start
```

**Terminal 3 - Start Game Client:**
```bash
cd client
npm run dev -- --host
```

## Step 9: Share with Friends!

Players can now access your game from anywhere:
1. Open browser
2. Go to: `https://game.yourdomain.com`
3. Play!

## Troubleshooting

### Tunnel not connecting

```bash
# Check tunnel status
cloudflared tunnel info lowsociety

# Test tunnel connection
cloudflared tunnel run lowsociety --loglevel debug
```

### "Origin is unreachable" error

1. Make sure the game server is running on localhost:3003
2. Make sure the client is running on localhost:3004
3. Check the cloudflared logs for errors

### CORS errors

Update `config.js`:
```javascript
server: {
  corsOrigins: [
    'https://game.yourdomain.com',
    'https://server.yourdomain.com'
  ],
}
```

### WebSocket connection fails

Cloudflare tunnels support WebSockets by default, but check:
1. Game server is using Socket.IO correctly
2. No additional proxy is interfering
3. Cloudflare Dashboard → SSL/TLS → Edge Certificates → WebSockets is enabled

## Advanced: Run as Service

### Windows Service

```powershell
# Install as service
cloudflared service install

# Start service
Start-Service cloudflared
```

### Linux Systemd

```bash
# Install service
sudo cloudflared service install

# Start service
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

### Mac LaunchAgent

```bash
# Install service
sudo cloudflared service install

# Start service
sudo launchctl load /Library/LaunchDaemons/com.cloudflare.cloudflared.plist
```

## Security Best Practices

### 1. Add Access Controls

In Cloudflare Dashboard:
1. Go to Access → Applications
2. Create Application:
   - Application domain: `game.yourdomain.com`
   - Add policy: Allow emails → Enter friend's emails
3. Save

Now only authorized users can access the game!

### 2. Rate Limiting

Cloudflare Dashboard → Security → WAF → Rate limiting rules

Create a rule:
- If: Hostname equals `server.yourdomain.com`
- Then: Block for 10 seconds
- When: More than 100 requests per minute

### 3. Enable Bot Protection

Cloudflare Dashboard → Security → Bots
- Enable Bot Fight Mode

## Cost

**Free Tier Includes:**
- 1 active tunnel
- Unlimited bandwidth
- Basic DDoS protection
- Up to 50 users (with Access policies)

Perfect for gaming with friends!

## Quick Reference Commands

```bash
# Login to Cloudflare
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create <NAME>

# List tunnels
cloudflared tunnel list

# Add DNS route
cloudflared tunnel route dns <NAME> <SUBDOMAIN>

# Run tunnel
cloudflared tunnel run <NAME>

# Run with debug logs
cloudflared tunnel run <NAME> --loglevel debug

# Stop tunnel (Ctrl+C)

# Delete tunnel
cloudflared tunnel delete <NAME>
```

## Comparison: LAN vs Cloudflare

| Feature | LAN | Cloudflare ZeroTrust |
|---------|-----|----------------------|
| Setup Complexity | Easy | Medium |
| Internet Required | No | Yes |
| Firewall Setup | Required | Not Required |
| Port Forwarding | No | No |
| Security | Local only | Encrypted tunnel |
| Access | Same network | Anywhere |
| Custom Domain | No | Yes |
| HTTPS | No | Yes (automatic) |
| DDoS Protection | No | Yes |
| Cost | Free | Free (up to limits) |

## Support

**Cloudflare Documentation:**
- [Tunnel Guide](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Troubleshooting](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/troubleshooting/)

**Common Issues:**
1. **"Tunnel not found"**: Make sure you're using the correct tunnel ID
2. **"Origin unreachable"**: Check that local services are running
3. **"DNS record not found"**: Wait a few minutes for DNS propagation

---

**Happy Remote Gaming!** 🌐🎮
