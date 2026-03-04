# Frontend Deployment Guide for Windows Server

## Prerequisites
- Node.js 18+ installed
- IIS with URL Rewrite module (optional, for reverse proxy)
- Port 3000 open (or your chosen port)

## Option 1: Standalone Node.js Deployment

### 1. Clone or copy the frontend folder to the server
```powershell
# Example: Copy to C:\Apps\nexus-frontend
```

### 2. Install dependencies
```powershell
cd C:\Apps\nexus-frontend
npm install
```

### 3. Configure environment
```powershell
# Create .env.local with production API URL
Copy-Item .env.example .env.local
# Edit .env.local:
# NEXT_PUBLIC_API_URL=http://your-server-ip:8000
```

### 4. Build for production
```powershell
npm run build
```

### 5. Test the production build
```powershell
npm start
# Or with specific port:
$env:PORT=3000; npm start
```

### 6. Install as Windows Service (using NSSM)

#### Download NSSM
Download from https://nssm.cc/download and extract to C:\Tools\nssm

#### Install the service
```powershell
nssm install NexusFrontend "C:\Program Files\nodejs\node.exe" "node_modules\.bin\next start -p 3000"
nssm set NexusFrontend AppDirectory "C:\Apps\nexus-frontend"
nssm set NexusFrontend DisplayName "Nexus ITAM Frontend"
nssm set NexusFrontend Description "IT Asset Management System Frontend"
nssm set NexusFrontend Start SERVICE_AUTO_START
nssm start NexusFrontend
```

## Option 2: Static Export + IIS (Recommended for Windows Server)

### 1. Update next.config.js for static export
Add to next.config.js:
```javascript
output: 'standalone'
```

### 2. Build for production
```powershell
npm run build
```

### 3. Deploy to IIS

1. Create a new IIS Site pointing to `C:\Apps\nexus-frontend\.next\standalone`
2. Copy the `public` folder to standalone folder
3. Copy `.next\static` to `standalone\.next\static`
4. Add web.config for Node.js (see web.config below)

### IIS web.config for Node.js
```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode" />
    </handlers>
    <rewrite>
      <rules>
        <rule name="NextJS">
          <match url="/*" />
          <action type="Rewrite" url="server.js" />
        </rule>
      </rules>
    </rewrite>
    <iisnode node_env="production" />
  </system.webServer>
</configuration>
```

## Option 3: IIS Reverse Proxy to Node.js

### 1. Install IIS modules
- URL Rewrite
- Application Request Routing (ARR)

### 2. Enable ARR Proxy
In IIS Manager:
- Server > Application Request Routing Cache > Server Proxy Settings
- Enable proxy

### 3. Create IIS Site with Reverse Proxy
Create web.config in an empty IIS site folder:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="ReverseProxyToNode" stopProcessing="true">
          <match url="(.*)" />
          <action type="Rewrite" url="http://localhost:3000/{R:1}" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

## Service Management
```powershell
# Start service
nssm start NexusFrontend

# Stop service
nssm stop NexusFrontend

# Restart service
nssm restart NexusFrontend

# Check status
nssm status NexusFrontend
```

## Security Checklist
- [ ] Set correct NEXT_PUBLIC_API_URL for production
- [ ] Use HTTPS in production
- [ ] Configure firewall rules
- [ ] Remove development dependencies if not needed
