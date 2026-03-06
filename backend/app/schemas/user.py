from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


class RoleResponse(BaseModel):
    """Schema for role response."""
    id: int
    code: str
    name: str
    description: Optional[str] = None
    
    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    """Schema for creating a new user."""
    username: str = Field(..., min_length=3, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role_codes: List[str] = Field(default=["itam_manager"], description="List of role codes to assign")


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    role_codes: Optional[List[str]] = None


class UserResponse(BaseModel):
    """Schema for user response."""
    id: int
    username: str
    email: str
    is_active: bool
    roles: List[RoleResponse]
    created_at: datetime
    
    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    """Schema for login request."""
    username: str
    password: str


class TokenResponse(BaseModel):
    """Schema for token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    """Schema for refresh token request."""
    refresh_token: str


class TokenData(BaseModel):
    """Schema for JWT token data."""
    sub: str  # username
    roles: List[str]  # list of role codes
    exp: Optional[int] = None
    type: str = "access"  # "access" or "refresh"
