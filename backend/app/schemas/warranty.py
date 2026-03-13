from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime


class WarrantyBase(BaseModel):
    """Base schema for Warranty."""
    provider_name: str = Field(..., min_length=1, max_length=200)
    duration_months: int = Field(..., ge=1)
    start_date: date
    terms_conditions: Optional[str] = None


class WarrantyCreate(WarrantyBase):
    """Schema for creating warranty (used when creating asset with warranty)."""
    pass


class WarrantyUpdate(BaseModel):
    """Schema for updating warranty."""
    provider_name: Optional[str] = Field(None, min_length=1, max_length=200)
    duration_months: Optional[int] = Field(None, ge=1)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    terms_conditions: Optional[str] = None


class WarrantyResponse(BaseModel):
    """Schema for warranty response."""
    id: int
    asset_id: int
    provider_name: str
    duration_months: int
    start_date: date
    end_date: date
    terms_conditions: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
