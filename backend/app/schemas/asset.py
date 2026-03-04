from pydantic import BaseModel, Field, computed_field
from typing import Optional, List, TYPE_CHECKING
from datetime import date, datetime

# Forward reference for EmployeeResponse
if TYPE_CHECKING:
    from app.schemas.employee import EmployeeResponse


# ============== Category Schemas ==============

class CategoryBase(BaseModel):
    """Base schema for Category."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=255)


class CategoryCreate(CategoryBase):
    """Schema for creating a new category."""
    pass


class CategoryResponse(CategoryBase):
    """Schema for category response."""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============== Asset Schemas ==============

class AssetBase(BaseModel):
    """Base schema for Asset."""
    asset_tag: str = Field(..., min_length=1, max_length=50)
    serial_number: Optional[str] = Field(None, max_length=100)
    category_id: int
    manufacturer: str = Field(..., min_length=1, max_length=100)
    model_name: str = Field(..., min_length=1, max_length=100)
    purchase_date: Optional[date] = None
    purchase_price: Optional[float] = Field(None, ge=0)
    warranty_months: Optional[int] = Field(12, ge=0)
    status: str = Field("Available", max_length=50)
    assigned_to: Optional[str] = Field(None, max_length=255)
    location: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = Field(None, max_length=500)


class AssetCreate(BaseModel):
    """Schema for creating a new asset."""
    asset_tag: str = Field(..., min_length=1, max_length=50)
    serial_number: Optional[str] = Field(None, max_length=100)
    category_id: int
    manufacturer: str = Field(..., min_length=1, max_length=100)
    model_name: str = Field(..., min_length=1, max_length=100)
    purchase_date: Optional[date] = None
    purchase_price: Optional[float] = Field(None, ge=0)
    warranty_months: Optional[int] = Field(12, ge=0)
    status: Optional[str] = Field("Available", max_length=50)
    assigned_to: Optional[str] = Field(None, max_length=255)
    location: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = Field(None, max_length=500)


class AssetUpdate(BaseModel):
    """Schema for updating an asset."""
    asset_tag: Optional[str] = Field(None, min_length=1, max_length=50)
    serial_number: Optional[str] = Field(None, max_length=100)
    category_id: Optional[int] = None
    manufacturer: Optional[str] = Field(None, min_length=1, max_length=100)
    model_name: Optional[str] = Field(None, min_length=1, max_length=100)
    purchase_date: Optional[date] = None
    purchase_price: Optional[float] = Field(None, ge=0)
    warranty_months: Optional[int] = Field(None, ge=0)
    status: Optional[str] = Field(None, max_length=50)
    assigned_to: Optional[str] = Field(None, max_length=255)
    location: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = Field(None, max_length=500)


class AssetAssign(BaseModel):
    """Schema for assigning/unassigning an asset to an employee."""
    employee_id: Optional[int] = Field(None, description="Employee ID to assign. Set to null to unassign.")


class EmployeeInfo(BaseModel):
    """Minimal employee info for embedding in asset response."""
    id: int
    name: str
    email: str
    department: Optional[str] = None
    
    class Config:
        from_attributes = True


class AssetResponse(BaseModel):
    """Schema for asset response with computed fields."""
    id: int
    asset_tag: str
    serial_number: Optional[str]
    category_id: int
    employee_id: Optional[int] = None
    manufacturer: str
    model_name: str
    purchase_date: Optional[date]
    purchase_price: Optional[float]
    warranty_months: Optional[int]
    warranty_expiry_date: Optional[date]
    status: str
    assigned_to: Optional[str]
    location: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    # Include category details
    category: Optional[CategoryResponse] = None
    
    # Include employee details (who holds the asset)
    employee: Optional[EmployeeInfo] = None
    
    @computed_field
    @property
    def is_warranty_active(self) -> bool:
        """Check if warranty is still active."""
        if self.warranty_expiry_date is None:
            return False
        return self.warranty_expiry_date >= date.today()
    
    @computed_field
    @property
    def days_until_warranty_expiry(self) -> Optional[int]:
        """Calculate days until warranty expires."""
        if self.warranty_expiry_date is None:
            return None
        delta = self.warranty_expiry_date - date.today()
        return delta.days
    
    class Config:
        from_attributes = True


class AssetListResponse(BaseModel):
    """Schema for paginated asset list response."""
    items: List[AssetResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ============== Dashboard Schemas ==============

class DashboardMetrics(BaseModel):
    """Schema for dashboard metrics."""
    total_assets: int
    deployed: int
    available: int
    in_maintenance: int
    retired: int


class WarrantyAlert(BaseModel):
    """Schema for warranty alert."""
    id: int
    asset_tag: str
    model_name: str
    manufacturer: str
    warranty_expiry_date: date
    days_remaining: int
    status: str
    
    class Config:
        from_attributes = True
