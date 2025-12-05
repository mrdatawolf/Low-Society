# LAN Multiplayer Setup Guide

This guide explains how to set up Low Society for multiplayer gaming on your local network (LAN).

## Quick Setup (4 Steps)

### Step 0: Set Up Configuration

First, create your config file from the example:
```bash
# Copy the example config
cp config.example.js config.js
```

**Note:** The `config.js` file is ignored by git, so your personal settings (IP addresses, domains) won't be committed to version control.

### Step 1: Find Your Local IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually something like `192.168.1.100`)

**Mac/Linux:**
```bash
ifconfig
# or
ip addr
```
Look for "inet" address (usually starts with `192.168.` or `10.0.`)

### Step 2: Configure the Game

Edit `config.js` in the root directory:

```javascript
// Change this to your local IP address
network: {
  localIP: '192.168.1.100', // <- Your IP here
},

// Use the LAN profile
server: {
  host: '0.0.0.0',  // Accept connections from network
  port: 3003,
  corsOrigins: '*',
},

client: {
  serverUrl: 'http://192.168.1.100:3003', // <- Your IP here
  exposeToNetwork: true,
},
```

**OR** use environment variables (create a `.env` file in the `client` directory):
```bash
# client/.env
VITE_SERVER_URL=http://192.168.1.100:3003
```

Or set environment variables in your terminal:
```bash
# Windows (Command Prompt)
set VITE_SERVER_URL=http://192.168.1.100:3003

# Windows (PowerShell)
$env:VITE_SERVER_URL="http://192.168.1.100:3003"

# Mac/Linux
export VITE_SERVER_URL=http://192.168.1.100:3003
```

### Step 3: Open Firewall Ports

**Windows:**
1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Enter ports: `3003, 3004`
6. Allow the connection
7. Apply to all profiles
8. Name it "Low Society Game"

**Mac:**
1. System Preferences → Security & Privacy
2. Firewall → Firewall Options
3. Click "+" to add Node.js
4. Allow incoming connections

**Linux (UFW):**
```bash
sudo ufw allow 3003/tcp
sudo ufw allow 3004/tcp
```

## Running the Game

### On the Host Computer (Server)

1. **Start the server:**
```bash
cd server
npm start
```

2. **Start the client:**
```bash
cd client
npm run dev -- --host
```

The `--host` flag exposes the client to the network.

### On Other Computers (Players)

1. Open a web browser
2. Navigate to: `http://HOST_IP:3004`
   - Replace `HOST_IP` with the host's IP address
   - Example: `http://192.168.1.100:3004`

3. Enter your name and join the game!

## Troubleshooting

### Players can't connect

**Check 1: Verify the server is running**
```bash
# On the host computer
curl http://localhost:3003
# Should return "Low Society Server Running"
```

**Check 2: Test network connectivity**
```bash
# From another computer
ping 192.168.1.100
# Should get responses
```

**Check 3: Verify firewall**
- Temporarily disable firewall to test
- If it works, re-enable and add proper rules

**Check 4: Check if ports are listening**
```bash
# Windows
netstat -ano | findstr :3003
netstat -ano | findstr :3004

# Mac/Linux
netstat -an | grep 3003
netstat -an | grep 3004
```

### Connection drops or lag

1. **Reduce network load:** Close other applications using bandwidth
2. **Check WiFi signal:** Players should have strong WiFi signal
3. **Use wired connection:** Ethernet is more stable than WiFi
4. **Reduce player count:** Try with fewer players first

### "CORS Error" in browser console

Update `config.js`:
```javascript
server: {
  corsOrigins: '*', // Allow all origins for LAN
}
```

### Server shows "EADDRINUSE"

Port is already in use. Either:
1. Close the other application using the port
2. Change the port in `config.js`

## Advanced Configuration

### Using Different Ports

Edit `config.js`:
```javascript
server: {
  port: 8080, // Change server port
},
client: {
  port: 8081, // Change client port
  serverUrl: 'http://192.168.1.100:8080',
}
```

### Running Multiple Games

You can run multiple game instances on different ports:

**Game 1:**
- Server: Port 3003
- Client: Port 3004

**Game 2:**
- Server: Port 3005
- Client: Port 3006

Just make sure to update the config for each instance.

### Using a Reverse Proxy (Advanced)

For production or advanced setups, use nginx or Apache:

```nginx
# nginx example
server {
  listen 80;
  server_name lowsociety.local;

  location / {
    proxy_pass http://localhost:3004;
  }

  location /socket.io/ {
    proxy_pass http://localhost:3003;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

## Performance Tips

1. **Host Requirements:**
   - Any modern computer (last 5 years)
   - At least 2GB free RAM
   - Stable network connection

2. **Network Requirements:**
   - Router supporting 5+ devices
   - 100 Mbps+ network speed (most home routers are fine)
   - Low latency (< 50ms ping between devices)

3. **Browser Recommendations:**
   - Chrome, Firefox, or Edge (latest versions)
   - Enable hardware acceleration
   - Close other browser tabs

## Security Notes

**For LAN play:**
- Only devices on your local network can connect
- No internet access required
- Game data stays on your network

**For internet play (not recommended without additional security):**
- Use a VPN (Tailscale, ZeroTier, etc.)
- Or deploy to a proper hosting service with HTTPS
- Never expose ports directly to the internet without security measures

## Quick Reference

| Setting | Localhost | LAN | Production |
|---------|-----------|-----|------------|
| Server Host | `localhost` | `0.0.0.0` | `0.0.0.0` |
| Server Port | `3003` | `3003` | `80/443` |
| CORS Origins | `*` | `*` | Specific domains |
| Client Server URL | `http://localhost:3003` | `http://YOUR_IP:3003` | `https://domain.com` |
| Expose Network | `false` | `true` | `true` |
| Firewall | Not needed | Open ports | Configured |

## Support

If you encounter issues:
1. Check the server logs in the console
2. Check browser console for errors (F12)
3. Verify all steps in this guide
4. Try with fewer players first
5. Test on localhost first, then LAN

---

**Happy Gaming!** 🎮🃏
