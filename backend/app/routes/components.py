from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.component import Component, AssetComponentHistory, ComponentStatus
from app.models.asset import Asset
from app.models.user import User
from app.schemas.component import (
    ComponentCreate, ComponentUpdate, ComponentResponse,
    InstallComponentRequest, AssetComponentHistoryResponse, RemoveComponentRequest
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/components", tags=["components"])


# ============== Component CRUD ==============

@router.get("/", response_model=List[ComponentResponse])
def get_components(
    search: str = Query(None, description="Search by component name"),
    category: str = Query(None, description="Filter by category"),
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
    if category:
        query = query.filter(Component.category == category)
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
    """Get list of unique component categories."""
    categories = db.query(Component.category).distinct().all()
    return [cat[0] for cat in categories if cat[0]]


@router.get("/available", response_model=List[ComponentResponse])
def get_available_components(
    category: str = Query(None, description="Filter by category"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all available (not installed) components."""
    query = db.query(Component).filter(Component.status == ComponentStatus.AVAILABLE.value)
    
    if category:
        query = query.filter(Component.category == category)
    
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
