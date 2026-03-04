# Backend Deployment Guide for Windows Server

## Prerequisites
- Python 3.12 installed
- SQL Server instance accessible
- Port 8000 open (or your chosen port)

## Deployment Steps

### 1. Clone or copy the backend folder to the server
```powershell
# Example: Copy to C:\Apps\nexus-backend
```

### 2. Create virtual environment
```powershell
cd C:\Apps\nexus-backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 3. Configure environment variables
```powershell
# Copy and edit the .env file
Copy-Item .env.example .env
# Edit .env with production values (see below)
```

### 4. Production .env settings
```
DATABASE_URL=mssql+pyodbc://username:password@server/database?driver=ODBC+Driver+17+for+SQL+Server
SECRET_KEY=your-production-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 5. Test the application
```powershell
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 6. Install as Windows Service (using NSSM)

#### Download NSSM
Download from https://nssm.cc/download and extract to C:\Tools\nssm

#### Install the service
```powershell
C:\Tools\nssm\win64\nssm.exe install NexusBackend
```

In the NSSM GUI:
- **Path**: `C:\Apps\nexus-backend\venv\Scripts\python.exe`
- **Startup directory**: `C:\Apps\nexus-backend`
- **Arguments**: `-m uvicorn app.main:app --host 0.0.0.0 --port 8000`

Or via command line:
```powershell
nssm install NexusBackend "C:\Apps\nexus-backend\venv\Scripts\python.exe" "-m uvicorn app.main:app --host 0.0.0.0 --port 8000"
nssm set NexusBackend AppDirectory "C:\Apps\nexus-backend"
nssm set NexusBackend DisplayName "Nexus ITAM Backend"
nssm set NexusBackend Description "IT Asset Management System Backend API"
nssm set NexusBackend Start SERVICE_AUTO_START
nssm start NexusBackend
```

### 7. Configure IIS as Reverse Proxy (Optional)

If you want to use IIS in front of the API:

1. Install URL Rewrite and ARR modules
2. Create a new site pointing to an empty folder
3. Add web.config with reverse proxy rules (see web.config.example)

### 8. Service Management
```powershell
# Start service
nssm start NexusBackend

# Stop service
nssm stop NexusBackend

# Restart service
nssm restart NexusBackend

# Check status
nssm status NexusBackend

# View logs
Get-Content C:\Apps\nexus-backend\logs\app.log -Tail 50
```

## Security Checklist
- [ ] Change SECRET_KEY to a strong random value
- [ ] Use HTTPS in production (via IIS or nginx)
- [ ] Restrict CORS origins to your frontend domain
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Enable Windows Firewall exception for port 8000
