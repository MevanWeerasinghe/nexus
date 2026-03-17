from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date

from app.schemas.supplier import SupplierResponse


class ComponentWarrantyBase(BaseModel):
    """Base schema for ComponentWarranty."""
    provider_name: str = Field(..., min_length=1, max_length=200)
    duration_months: int = Field(..., ge=1)
    start_date: date
    terms_conditions: Optional[str] = None


class ComponentWarrantyCreate(ComponentWarrantyBase):
    """Schema for creating component warranty."""
    pass


class ComponentWarrantyResponse(ComponentWarrantyBase):
    """Schema for component warranty response."""
    id: int
    component_id: int
    end_date: date
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ComponentBase(BaseModel):
    """Base schema for Component."""
    name: str = Field(..., min_length=1, max_length=200)
    category: str = Field(..., min_length=1, max_length=100)  # RAM, SSD, Battery, etc.
    serial_number: Optional[str] = Field(None, max_length=100)
    purchase_price: Optional[float] = Field(None, ge=0)
    purchase_date: Optional[datetime] = None
    supplier_id: Optional[int] = None
    specifications: Optional[str] = None
    notes: Optional[str] = None


class ComponentCreate(ComponentBase):
    """Schema for creating a new component."""
    pass


class ComponentUpdate(BaseModel):
    """Schema for updating a component."""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    serial_number: Optional[str] = Field(None, max_length=100)
    purchase_price: Optional[float] = Field(None, ge=0)
    purchase_date: Optional[datetime] = None
    supplier_id: Optional[int] = None
    status: Optional[str] = None
    specifications: Optional[str] = None
    notes: Optional[str] = None


class ComponentResponse(ComponentBase):
    """Schema for component response."""
    id: int
    status: str
    created_at: datetime
    updated_at: datetime
    supplier: Optional[SupplierResponse] = None
    warranty: Optional[ComponentWarrantyResponse] = None
    
    class Config:
        from_attributes = True


class InstallComponentRequest(BaseModel):
    """Schema for installing a component into an asset."""
    component_id: int
    notes: Optional[str] = None
    installed_by: Optional[str] = None


class AssetComponentHistoryResponse(BaseModel):
    """Schema for asset component history response."""
    id: int
    asset_id: int
    component_id: int
    installed_date: datetime
    installed_by: Optional[str] = None
    removed_date: Optional[datetime] = None
    removal_reason: Optional[str] = None
    notes: Optional[str] = None
    component: Optional[ComponentResponse] = None
    
    class Config:
        from_attributes = True


class RemoveComponentRequest(BaseModel):
    """Schema for removing a component from an asset."""
    removal_reason: Optional[str] = None
