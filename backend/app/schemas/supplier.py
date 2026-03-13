from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SupplierBase(BaseModel):
    """Base schema for Supplier."""
    name: str = Field(..., min_length=1, max_length=200)
    contact_email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = None


class SupplierCreate(SupplierBase):
    """Schema for creating a new supplier."""
    pass


class SupplierUpdate(BaseModel):
    """Schema for updating a supplier."""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    contact_email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = None


class SupplierResponse(SupplierBase):
    """Schema for supplier response."""
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
