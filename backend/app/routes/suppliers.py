from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.supplier import Supplier
from app.models.user import User
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/suppliers", tags=["suppliers"])


@router.get("/", response_model=List[SupplierResponse])
def get_suppliers(
    search: str = Query(None, description="Search by supplier name"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all suppliers with optional search."""
    query = db.query(Supplier)
    
    if search:
        query = query.filter(Supplier.name.ilike(f"%{search}%"))
    
    suppliers = query.order_by(Supplier.name).offset(skip).limit(limit).all()
    return suppliers


@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single supplier by ID."""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    
    return supplier


@router.post("/", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(
    supplier_data: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new supplier."""
    # Check if supplier with same name already exists
    existing = db.query(Supplier).filter(Supplier.name == supplier_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supplier with this name already exists"
        )
    
    db_supplier = Supplier(**supplier_data.model_dump())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    
    return db_supplier


@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: int,
    supplier_data: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing supplier."""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    
    # Check for duplicate name if being updated
    if supplier_data.name and supplier_data.name != supplier.name:
        existing = db.query(Supplier).filter(Supplier.name == supplier_data.name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supplier with this name already exists"
            )
    
    update_data = supplier_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(supplier, key, value)
    
    db.commit()
    db.refresh(supplier)
    
    return supplier


@router.delete("/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a supplier."""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    
    db.delete(supplier)
    db.commit()
    
    return None
