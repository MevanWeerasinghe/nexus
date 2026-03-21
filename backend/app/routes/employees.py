from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import ipaddress

from app.database import get_db
from app.models.employee import Employee
from app.models.asset import Asset
from app.models.user import User
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse
from app.schemas.asset import AssetResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/employees", tags=["employees"])


def _normalize_ip(ip_value: str | None) -> str | None:
    if ip_value is None:
        return None
    candidate = ip_value.strip()
    if not candidate:
        return None
    try:
        return str(ipaddress.ip_address(candidate))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid IP address format"
        )


@router.get("/", response_model=List[EmployeeResponse])
def get_employees(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all employees."""
    employees = db.query(Employee).order_by(Employee.name).all()
    return employees


@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single employee by ID."""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    return employee


@router.post("/", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    employee_data: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new employee."""
    # Check if email already exists
    existing = db.query(Employee).filter(Employee.email == employee_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An employee with this email already exists"
        )

    normalized_ip = _normalize_ip(employee_data.ip_address)
    if normalized_ip:
        existing_ip = db.query(Employee).filter(Employee.ip_address == normalized_ip).first()
        if existing_ip:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An employee with this IP address already exists"
            )

    payload = employee_data.model_dump()
    payload["ip_address"] = normalized_ip
    db_employee = Employee(**payload)
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee


@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: int,
    employee_data: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an employee."""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    # Check email uniqueness if being updated
    if employee_data.email and employee_data.email != employee.email:
        existing = db.query(Employee).filter(Employee.email == employee_data.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An employee with this email already exists"
            )

    normalized_ip = _normalize_ip(employee_data.ip_address) if employee_data.ip_address is not None else None
    if employee_data.ip_address is not None and normalized_ip:
        existing_ip = db.query(Employee).filter(
            Employee.ip_address == normalized_ip,
            Employee.id != employee_id,
        ).first()
        if existing_ip:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An employee with this IP address already exists"
            )
    
    # Update only provided fields
    update_data = employee_data.model_dump(exclude_unset=True)
    if "ip_address" in update_data:
        update_data["ip_address"] = normalized_ip
    for field, value in update_data.items():
        setattr(employee, field, value)
    
    db.commit()
    db.refresh(employee)
    return employee


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an employee. Will unassign all their assets first."""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    # Unassign all assets from this employee
    db.query(Asset).filter(Asset.employee_id == employee_id).update({
        "employee_id": None,
        "status": "Available"
    })
    
    db.delete(employee)
    db.commit()
    return None


@router.get("/{employee_id}/assets", response_model=List[AssetResponse])
def get_employee_assets(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all assets assigned to a specific employee."""
    # First verify employee exists
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    assets = db.query(Asset).filter(Asset.employee_id == employee_id).all()
    return assets
