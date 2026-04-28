from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, date, timedelta

from app.database import get_db
from app.models.component import Component, AssetComponentHistory, ComponentStatus
from app.models.component_warranty import ComponentWarranty
from app.models.asset import Asset, Category
from app.models.user import User
from app.schemas.component import (
    ComponentCreate, ComponentUpdate, ComponentResponse,
    InstallComponentRequest, AssetComponentHistoryResponse, RemoveComponentRequest,
    ComponentWarrantyCreate, ComponentWarrantyResponse
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/components", tags=["components"])


# ============== Component CRUD ==============

@router.get("/", response_model=List[ComponentResponse])
def get_components(
    search: str = Query(None, description="Search by component name"),
    category: str = Query(None, description="Filter by category name"),
    category_id: int = Query(None, description="Filter by category id"),
    status: str = Query(None, description="Filter by status"),
    supplier_id: int = Query(None, description="Filter by supplier"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all components with optional filtering."""
    query = db.query(Component)
    
    if search:
        query = query.filter(Component.name.ilike(f"%{search}%"))
    if category_id:
        query = query.filter(Component.category_id == category_id)
    elif category:
        category_row = db.query(Category).filter(func.lower(Category.name) == category.lower()).first()
        if category_row:
            query = query.filter(Component.category_id == category_row.id)
        else:
            return []
    if status:
        query = query.filter(Component.status == status)
    if supplier_id:
        query = query.filter(Component.supplier_id == supplier_id)
    
    components = query.order_by(Component.created_at.desc()).offset(skip).limit(limit).all()
    return components


@router.get("/categories", response_model=List[str])
def get_component_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of component category names from category registry."""
    categories = (
        db.query(Category.name)
        .filter(Category.category_type == "component")
        .order_by(Category.name.asc())
        .all()
    )
    return [cat[0] for cat in categories if cat[0]]


@router.get("/available", response_model=List[ComponentResponse])
def get_available_components(
    category: str = Query(None, description="Filter by category name"),
    category_id: int = Query(None, description="Filter by category id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all available (not installed) components."""
    query = db.query(Component).filter(Component.status == ComponentStatus.AVAILABLE.value)
    
    if category_id:
        query = query.filter(Component.category_id == category_id)
    elif category:
        category_row = db.query(Category).filter(func.lower(Category.name) == category.lower()).first()
        if category_row:
            query = query.filter(Component.category_id == category_row.id)
        else:
            return []
    
    components = query.order_by(Component.name).all()
    return components


@router.get("/{component_id}", response_model=ComponentResponse)
def get_component(
    component_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single component by ID."""
    component = db.query(Component).filter(Component.id == component_id).first()
    
    if not component:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Component not found"
        )
    
    return component


@router.post("/", response_model=ComponentResponse, status_code=status.HTTP_201_CREATED)
def create_component(
    component_data: ComponentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new component."""
    category = db.query(Category).filter(Category.id == component_data.category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    if category.category_type != "component":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Components must use a component category")

    db_component = Component(
        **component_data.model_dump(),
        status=ComponentStatus.AVAILABLE.value
    )
    db.add(db_component)
    db.commit()
    db.refresh(db_component)
    
    return db_component


@router.put("/{component_id}", response_model=ComponentResponse)
def update_component(
    component_id: int,
    component_data: ComponentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing component."""
    component = db.query(Component).filter(Component.id == component_id).first()
    
    if not component:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Component not found"
        )
    
    update_data = component_data.model_dump(exclude_unset=True)
    next_category_id = update_data.get("category_id")
    if next_category_id is not None:
        category = db.query(Category).filter(Category.id == next_category_id).first()
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        if category.category_type != "component":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Components must use a component category")

    for key, value in update_data.items():
        setattr(component, key, value)
    
    db.commit()
    db.refresh(component)
    
    return component


@router.delete("/{component_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_component(
    component_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a component."""
    component = db.query(Component).filter(Component.id == component_id).first()
    
    if not component:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Component not found"
        )
    
    # Don't allow deletion of installed components
    if component.status == ComponentStatus.INSTALLED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a component that is currently installed in an asset"
        )
    
    db.delete(component)
    db.commit()
    
    return None


# ============== Component Installation ==============

@router.get("/{component_id}/history", response_model=List[AssetComponentHistoryResponse])
def get_component_history(
    component_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get installation history for a component."""
    component = db.query(Component).filter(Component.id == component_id).first()
    
    if not component:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Component not found"
        )
    
    history = db.query(AssetComponentHistory).filter(
        AssetComponentHistory.component_id == component_id
    ).order_by(AssetComponentHistory.installed_date.desc()).all()
    
    return history


# ============== Component Warranty ==============

@router.post("/{component_id}/warranty", response_model=ComponentWarrantyResponse, status_code=status.HTTP_201_CREATED)
def add_component_warranty(
    component_id: int,
    warranty_data: ComponentWarrantyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add warranty to a component."""
    component = db.query(Component).filter(Component.id == component_id).first()
    
    if not component:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Component not found"
        )
    
    # Check if warranty already exists
    existing_warranty = db.query(ComponentWarranty).filter(
        ComponentWarranty.component_id == component_id
    ).first()
    
    if existing_warranty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Component already has a warranty. Use PUT to update it."
        )
    
    # Calculate end_date
    end_date = warranty_data.start_date + timedelta(days=warranty_data.duration_months * 30)
    
    db_warranty = ComponentWarranty(
        component_id=component_id,
        provider_name=warranty_data.provider_name,
        duration_months=warranty_data.duration_months,
        start_date=warranty_data.start_date,
        end_date=end_date,
        terms_conditions=warranty_data.terms_conditions
    )
    
    db.add(db_warranty)
    db.commit()
    db.refresh(db_warranty)
    
    return db_warranty


@router.put("/{component_id}/warranty", response_model=ComponentWarrantyResponse)
def update_component_warranty(
    component_id: int,
    warranty_data: ComponentWarrantyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update warranty for a component."""
    component = db.query(Component).filter(Component.id == component_id).first()
    
    if not component:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Component not found"
        )
    
    warranty = db.query(ComponentWarranty).filter(
        ComponentWarranty.component_id == component_id
    ).first()
    
    if not warranty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Component warranty not found"
        )
    
    # Calculate end_date
    end_date = warranty_data.start_date + timedelta(days=warranty_data.duration_months * 30)
    
    warranty.provider_name = warranty_data.provider_name
    warranty.duration_months = warranty_data.duration_months
    warranty.start_date = warranty_data.start_date
    warranty.end_date = end_date
    warranty.terms_conditions = warranty_data.terms_conditions
    
    db.commit()
    db.refresh(warranty)
    
    return warranty


@router.delete("/{component_id}/warranty", status_code=status.HTTP_204_NO_CONTENT)
def delete_component_warranty(
    component_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete warranty from a component."""
    component = db.query(Component).filter(Component.id == component_id).first()
    
    if not component:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Component not found"
        )
    
    warranty = db.query(ComponentWarranty).filter(
        ComponentWarranty.component_id == component_id
    ).first()
    
    if not warranty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Component warranty not found"
        )
    
    db.delete(warranty)
    db.commit()
    
    return None


@router.get("/{component_id}/warranty", response_model=ComponentWarrantyResponse)
def get_component_warranty(
    component_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get warranty for a component."""
    component = db.query(Component).filter(Component.id == component_id).first()
    
    if not component:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Component not found"
        )
    
    warranty = db.query(ComponentWarranty).filter(
        ComponentWarranty.component_id == component_id
    ).first()
    
    if not warranty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Component warranty not found"
        )
    
    return warranty
