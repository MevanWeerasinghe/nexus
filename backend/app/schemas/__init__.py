# User schemas
from app.schemas.user import (
    UserRole,
    UserCreate,
    UserUpdate,
    UserResponse,
    LoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    TokenData,
    RoleResponse,
)

# Asset schemas
from app.schemas.asset import (
    CategoryBase,
    CategoryCreate,
    CategoryResponse,
    AssetBase,
    AssetCreate,
    AssetUpdate,
    AssetAssign,
    AssetResponse,
    AssetListResponse,
    DashboardMetrics,
    WarrantyAlert,
    EmployeeInfo,
)

# Employee schemas
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
    EmployeeListResponse,
)

# FAMS schemas
from app.schemas.fams import (
    VehicleCreate,
    VehicleUpdate,
    VehicleResponse,
    FuelLogCreate,
    FuelLogResponse,
    FuelUsageReportResponse,
)

__all__ = [
    # User
    "UserRole",
    "UserCreate",
    "UserResponse",
    "LoginRequest",
    "TokenResponse",
    "RefreshTokenRequest",
    "TokenData",
    # Asset
    "CategoryBase",
    "CategoryCreate",
    "CategoryResponse",
    "AssetBase",
    "AssetCreate",
    "AssetUpdate",
    "AssetAssign",
    "AssetResponse",
    "AssetListResponse",
    "DashboardMetrics",
    "WarrantyAlert",
    "EmployeeInfo",
    # Employee
    "EmployeeCreate",
    "EmployeeUpdate",
    "EmployeeResponse",
    "EmployeeListResponse",
    # FAMS
    "VehicleCreate",
    "VehicleUpdate",
    "VehicleResponse",
    "FuelLogCreate",
    "FuelLogResponse",
    "FuelUsageReportResponse",
]
