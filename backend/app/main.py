from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.config import settings
from app.routes import auth, assets, employees
from app.models.user import User
from app.models.asset import Asset, Category
from app.models.employee import Employee

# Create database tables - ensure all models are imported first
print("Creating database tables...")
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")
except Exception as e:
    print(f"Error creating tables: {e}")

# Initialize FastAPI app
app = FastAPI(
    title="IT Asset Management System",
    description="A simple IT Asset Management system with FastAPI",
    version="0.1.0"
)

# CORS middleware - origins loaded from config/environment
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(auth.router)
app.include_router(assets.router)
app.include_router(employees.router)


@app.get("/")
def read_root():
    """Root endpoint."""
    return {
        "message": "IT Asset Management System API",
        "version": "0.1.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/api/v1/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
