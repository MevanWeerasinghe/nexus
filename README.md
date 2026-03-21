# IT Asset Management (ITAM) System

A lightweight, full-stack IT Asset Management system built with FastAPI (Python) and Next.js (React).

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or: venv\Scripts\activate (Windows)
pip install -r requirements.txt

# Copy .env.example to .env and update with your settings
cp .env.example .env

# Run the server
python -m uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install

# Create .env.local with:
# NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev
```

## Access Points

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Login:** http://localhost:3000/login

## Tech Stack

### Backend
- FastAPI
- SQLAlchemy with MS SQL Server (or SQLite)
- JWT Authentication with python-jose
- Pydantic for validation

### Frontend
- Next.js 14 with TypeScript
- React Hook Form + Zod validation
- Shadcn UI components
- Tailwind CSS
- Axios for API calls

## Features

- User authentication with JWT tokens
- Role-based access control (Admin, Manager, User)
- IT Asset management dashboard
- Asset search and filtering
- Warranty alert tracking
- Responsive UI with Shadcn components

## Default Test User

Create with this curl command after starting the backend:

```bash
curl -X POST "http://localhost:8000/api/v1/auth/create-user" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "securepassword123",
    "role": "admin"
  }'
```

Then login with: `admin` / `securepassword123`

## Documentation

See [SETUP_AND_RUN_GUIDE.md](./SETUP_AND_RUN_GUIDE.md) for detailed setup instructions.

## Project Structure

```
project-root/
├── backend/          # FastAPI application
│   └── app/modules/  # Modular monolith composition (auth, itam, future maintenance)
├── frontend/         # Next.js application
└── SETUP_AND_RUN_GUIDE.md
```

See [backend/MODULAR_MONOLITH.md](./backend/MODULAR_MONOLITH.md) for backend module composition details.

## License

Proprietary - Internal Use Only
