# User schemas
from app.schemas.user import (
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

__all__ = [
    # User
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
]
