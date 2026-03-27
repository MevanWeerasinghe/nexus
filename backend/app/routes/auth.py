from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List

from app.database import get_db
from app.models.user import User, Role
from app.schemas import (
    UserCreate, UserUpdate, UserResponse, LoginRequest, TokenResponse, 
    RefreshTokenRequest, TokenData, RoleResponse
)
from app.auth import (
    hash_password, verify_password, create_access_token,
    create_refresh_token, decode_token
)
from app.config import settings
from app.dependencies import get_current_user, require_role

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


# ============== Role Management ==============

@router.get("/roles", response_model=List[RoleResponse])
def get_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    """Get all available roles. Admin only."""
    roles = db.query(Role).order_by(Role.code).all()
    return roles


@router.post("/seed-roles", response_model=List[RoleResponse])
def seed_roles(db: Session = Depends(get_db)):
    """Seed default roles. Development helper."""
    default_roles = [
        {"code": "admin", "name": "Administrator", "description": "Full access to all modules"},
        {"code": "itam_manager", "name": "ITAM Manager", "description": "Access to IT Asset Management module"},
        {"code": "fuel_manager", "name": "Fuel Manager", "description": "Access to Fleet & Allocation Management System module"},
    ]
    
    created_roles = []
    for role_data in default_roles:
        existing = db.query(Role).filter(Role.code == role_data["code"]).first()
        if not existing:
            role = Role(**role_data)
            db.add(role)
            db.commit()
            db.refresh(role)
            created_roles.append(role)
        else:
            created_roles.append(existing)
    
    return created_roles


# ============== User Management ==============

@router.post("/create-user", response_model=UserResponse)
def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user with specified roles.
    """
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.username == user_data.username) | (User.email == user_data.email)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )
    
    # Get roles
    role_codes = [str(role_code.value if hasattr(role_code, "value") else role_code) for role_code in user_data.role_codes]
    roles = db.query(Role).filter(Role.code.in_(role_codes)).all()
    if not roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid roles specified"
        )
    
    # Hash password and create user
    hashed_password = hash_password(user_data.password)
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        is_active=True
    )
    db_user.roles = roles
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user


@router.get("/users", response_model=List[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    """Get all users. Admin only."""
    users = db.query(User).order_by(User.username).all()
    return users


@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    """Update a user. Admin only."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user_data.email is not None:
        user.email = user_data.email
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
    if user_data.role_codes is not None:
        role_codes = [str(role_code.value if hasattr(role_code, "value") else role_code) for role_code in user_data.role_codes]
        roles = db.query(Role).filter(Role.code.in_(role_codes)).all()
        user.roles = roles
    
    db.commit()
    db.refresh(user)
    return user


# ============== Authentication ==============

@router.post("/login", response_model=TokenResponse)
def login(
    credentials: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Login endpoint. Returns access_token and refresh_token.
    """
    # Find user by username
    user = db.query(User).filter(User.username == credentials.username).first()
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Create tokens with user claims (roles as list)
    token_data = {"sub": user.username, "roles": user.role_codes}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=TokenResponse)
def refresh_access_token(
    request: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token.
    """
    token_data = decode_token(request.refresh_token)
    
    if token_data is None or token_data.type != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify user still exists and is active
    user = db.query(User).filter(User.username == token_data.sub).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Create new tokens with current roles (in case roles changed)
    new_token_data = {"sub": user.username, "roles": user.role_codes}
    access_token = create_access_token(new_token_data)
    refresh_token = create_refresh_token(new_token_data)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user info."""
    return current_user
