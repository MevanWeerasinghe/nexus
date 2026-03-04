from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta

from app.database import get_db
from app.models.asset import Asset, Category
from app.models.employee import Employee
from app.models.user import User
from app.schemas.asset import (
    AssetCreate, AssetUpdate, AssetAssign, AssetResponse, AssetListResponse,
    CategoryCreate, CategoryResponse,
    DashboardMetrics, WarrantyAlert
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/assets", tags=["assets"])


# ============== Category Endpoints ==============

@router.get("/categories", response_model=List[CategoryResponse])
def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all categories for dropdown selection."""
    categories = db.query(Category).order_by(Category.name).all()
    return categories


@router.post("/categories", response_model=CategoryResponse)
def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new category."""
    # Check if category already exists
    existing = db.query(Category).filter(Category.name == category_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this name already exists"
        )
    
    db_category = Category(**category_data.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


# ============== Dashboard Endpoints ==============

@router.get("/dashboard/metrics", response_model=DashboardMetrics)
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get dashboard metrics for asset counts by status."""
    total = db.query(func.count(Asset.id)).scalar() or 0
    deployed = db.query(func.count(Asset.id)).filter(Asset.status == "Deployed").scalar() or 0
    available = db.query(func.count(Asset.id)).filter(Asset.status == "Available").scalar() or 0
    in_maintenance = db.query(func.count(Asset.id)).filter(Asset.status == "In Maintenance").scalar() or 0
    retired = db.query(func.count(Asset.id)).filter(Asset.status == "Retired").scalar() or 0
    
    return DashboardMetrics(
        total_assets=total,
        deployed=deployed,
        available=available,
        in_maintenance=in_maintenance,
        retired=retired
    )


@router.get("/dashboard/expiring-warranties", response_model=List[WarrantyAlert])
def get_expiring_warranties(
    days: int = Query(30, ge=1, le=365, description="Number of days to look ahead"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get assets with warranties expiring within the specified number of days."""
    today = date.today()
    future_date = today + timedelta(days=days)
    
    assets = db.query(Asset).filter(
        Asset.warranty_expiry_date != None,
        Asset.warranty_expiry_date >= today,
        Asset.warranty_expiry_date <= future_date,
        Asset.status != "Retired",
        Asset.status != "Disposed"
    ).order_by(Asset.warranty_expiry_date).all()
    
    alerts = []
    for asset in assets:
        days_remaining = (asset.warranty_expiry_date - today).days
        alerts.append(WarrantyAlert(
            id=asset.id,
            asset_tag=asset.asset_tag,
            model_name=asset.model_name,
            manufacturer=asset.manufacturer,
            warranty_expiry_date=asset.warranty_expiry_date,
            days_remaining=days_remaining,
            status=asset.status
        ))
    
    return alerts


# ============== Asset CRUD Endpoints ==============

@router.get("/", response_model=List[AssetResponse])
def get_assets(
    status: Optional[str] = Query(None, description="Filter by status"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    search: Optional[str] = Query(None, description="Search by asset tag or serial number"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all assets with optional filtering.
    
    - **status**: Filter by asset status (Available, Deployed, In Maintenance, Retired, Disposed)
    - **category_id**: Filter by category
    - **search**: Search by asset tag or serial number
    """
    query = db.query(Asset).join(Category)
    
    # Apply filters
    if status:
        query = query.filter(Asset.status == status)
    if category_id:
        query = query.filter(Asset.category_id == category_id)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Asset.asset_tag.ilike(search_term)) |
            (Asset.serial_number.ilike(search_term))
        )
    
    # Order by created date descending
    query = query.order_by(Asset.created_at.desc())
    
    # Execute with pagination
    assets = query.offset(skip).limit(limit).all()
    
    return assets


@router.post("/", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
def create_asset(
    asset_data: AssetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new asset.
    
    The warranty_expiry_date is automatically calculated by adding warranty_months to purchase_date.
    """
    # Check if asset tag already exists
    existing = db.query(Asset).filter(Asset.asset_tag == asset_data.asset_tag).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Asset with this asset tag already exists"
        )
    
    # Verify category exists
    category = db.query(Category).filter(Category.id == asset_data.category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Calculate warranty expiry date
    warranty_expiry_date = None
    if asset_data.purchase_date and asset_data.warranty_months:
        warranty_expiry_date = asset_data.purchase_date + relativedelta(months=asset_data.warranty_months)
    
    # Create asset
    db_asset = Asset(
        **asset_data.model_dump(),
        warranty_expiry_date=warranty_expiry_date
    )
    
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    
    return db_asset


@router.get("/{asset_id}", response_model=AssetResponse)
def get_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single asset by ID."""
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    
    return asset


@router.put("/{asset_id}", response_model=AssetResponse)
def update_asset(
    asset_id: int,
    asset_data: AssetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing asset."""
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    
    # Check for duplicate asset tag if being updated
    if asset_data.asset_tag and asset_data.asset_tag != asset.asset_tag:
        existing = db.query(Asset).filter(Asset.asset_tag == asset_data.asset_tag).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Asset with this asset tag already exists"
            )
    
    # Update fields
    update_data = asset_data.model_dump(exclude_unset=True)
    
    # If status is changing to Available, Retired, or Disposed, auto-unassign employee
    new_status = update_data.get('status')
    if new_status in ['Available', 'Retired', 'Disposed'] and asset.employee_id is not None:
        update_data['employee_id'] = None
        update_data['assigned_to'] = None
    
    # Recalculate warranty expiry date if purchase_date or warranty_months changed
    purchase_date = update_data.get('purchase_date', asset.purchase_date)
    warranty_months = update_data.get('warranty_months', asset.warranty_months)
    
    if 'purchase_date' in update_data or 'warranty_months' in update_data:
        if purchase_date and warranty_months:
            update_data['warranty_expiry_date'] = purchase_date + relativedelta(months=warranty_months)
    
    for key, value in update_data.items():
        setattr(asset, key, value)
    
    db.commit()
    db.refresh(asset)
    
    return asset


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an asset."""
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    
    db.delete(asset)
    db.commit()
    
    return None


# ============== Asset Assignment ==============

@router.post("/{asset_id}/assign", response_model=AssetResponse)
def assign_asset(
    asset_id: int,
    assignment: AssetAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Assign or unassign an asset to an employee.
    
    - If employee_id is provided, assigns the asset to that employee and sets status to "Deployed"
    - If employee_id is null/None, unassigns the asset and sets status to "Available"
    """
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    
    if assignment.employee_id is not None:
        # Assigning to an employee
        employee = db.query(Employee).filter(Employee.id == assignment.employee_id).first()
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        asset.employee_id = assignment.employee_id
        asset.assigned_to = employee.name  # Store employee name for reference
        asset.status = "Deployed"
    else:
        # Unassigning - set employee_id to None and status to Available
        asset.employee_id = None
        asset.assigned_to = None
        asset.status = "Available"
    
    db.commit()
    db.refresh(asset)
    
    return asset


# ============== Seed Categories (Development Helper) ==============

@router.post("/seed-categories", response_model=List[CategoryResponse])
def seed_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Seed default categories (for development/setup)."""
    default_categories = [
        {"name": "Laptop", "description": "Portable computers"},
        {"name": "Desktop", "description": "Desktop computers and workstations"},
        {"name": "Monitor", "description": "Display monitors"},
        {"name": "Printer", "description": "Printers and multifunction devices"},
        {"name": "Router", "description": "Network routers"},
        {"name": "Switch", "description": "Network switches"},
        {"name": "Server", "description": "Servers and storage"},
        {"name": "Scanner", "description": "Document scanners"},
        {"name": "Keyboard", "description": "Keyboards and input devices"},
        {"name": "Mouse", "description": "Mice and pointing devices"},
        {"name": "Headset", "description": "Headsets and audio devices"},
        {"name": "Other", "description": "Other IT equipment"},
    ]
    
    created_categories = []
    for cat_data in default_categories:
        existing = db.query(Category).filter(Category.name == cat_data["name"]).first()
        if not existing:
            category = Category(**cat_data)
            db.add(category)
            db.commit()
            db.refresh(category)
            created_categories.append(category)
        else:
            created_categories.append(existing)
    
    return created_categories
