from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime


# ============== Employee Schemas ==============

class EmployeeBase(BaseModel):
    """Base schema for Employee."""
    name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., min_length=1, max_length=255)
    department: Optional[str] = Field(None, max_length=100)
    ip_address: Optional[str] = Field(None, max_length=45)


class EmployeeCreate(BaseModel):
    """Schema for creating a new employee."""
    name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., min_length=1, max_length=255)
    department: Optional[str] = Field(None, max_length=100)
    ip_address: Optional[str] = Field(None, max_length=45)


class EmployeeUpdate(BaseModel):
    """Schema for updating an employee."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[str] = Field(None, min_length=1, max_length=255)
    department: Optional[str] = Field(None, max_length=100)
    ip_address: Optional[str] = Field(None, max_length=45)


class EmployeeResponse(BaseModel):
    """Schema for employee response."""
    id: int
    name: str
    email: str
    department: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class EmployeeListResponse(BaseModel):
    """Schema for paginated employee list response."""
    items: List[EmployeeResponse]
    total: int
