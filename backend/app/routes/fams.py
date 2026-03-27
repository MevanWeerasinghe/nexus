from datetime import datetime, timedelta, date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import require_role
from app.models.employee import Employee
from app.models.fams import FuelLog, Vehicle
from app.models.user import User
from app.schemas.fams import (
    FuelLogCreate,
    FuelLogResponse,
    FuelUsageReportResponse,
    VehicleCreate,
    VehicleResponse,
    VehicleUpdate,
)

router = APIRouter(prefix="/api/v1/fams", tags=["fams"])


def _month_bounds(reference: Optional[datetime] = None) -> tuple[datetime, datetime]:
    now = reference or datetime.now()
    start = datetime(now.year, now.month, 1)
    if now.month == 12:
        end = datetime(now.year + 1, 1, 1)
    else:
        end = datetime(now.year, now.month + 1, 1)
    return start, end


def _remaining_for_vehicle(db: Session, vehicle: Vehicle, reference: Optional[datetime] = None) -> float:
    month_start, month_end = _month_bounds(reference)
    issued = (
        db.query(func.coalesce(func.sum(FuelLog.liters_issued), 0.0))
        .filter(
            FuelLog.vehicle_id == vehicle.id,
            FuelLog.issue_date >= month_start,
            FuelLog.issue_date < month_end,
        )
        .scalar()
    )
    issued_value = float(issued or 0.0)
    return round(vehicle.monthly_allocation - issued_value, 2)


def _vehicle_to_response(db: Session, vehicle: Vehicle) -> VehicleResponse:
    return VehicleResponse(
        id=vehicle.id,
        vehicle_number=vehicle.vehicle_number,
        vehicle_type=vehicle.vehicle_type,
        model=vehicle.model,
        employee_id=vehicle.employee_id,
        monthly_allocation=vehicle.monthly_allocation,
        fuel_type=vehicle.fuel_type,
        remaining_fuel=_remaining_for_vehicle(db, vehicle),
        created_at=vehicle.created_at,
        updated_at=vehicle.updated_at,
        employee=vehicle.employee,
    )


def _validate_grade_for_fuel_type(fuel_type: str, fuel_grade: str) -> None:
    if fuel_type == "Petrol" and fuel_grade not in {"92 Octane", "95 Octane"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid fuel grade for Petrol vehicle",
        )
    if fuel_type == "Diesel" and fuel_grade not in {"Auto Diesel", "Super Diesel 4 Star"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid fuel grade for Diesel vehicle",
        )


@router.get("/vehicles", response_model=List[VehicleResponse])
def get_vehicles(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("fuel_manager")),
):
    query = db.query(Vehicle).options(joinedload(Vehicle.employee))

    if search:
        pattern = f"%{search}%"
        query = query.outerjoin(Employee, Vehicle.employee_id == Employee.id).filter(
            Vehicle.vehicle_number.ilike(pattern)
            | Vehicle.model.ilike(pattern)
            | Employee.name.ilike(pattern)
            | Employee.email.ilike(pattern)
        )

    vehicles = query.order_by(Vehicle.vehicle_number).all()
    return [_vehicle_to_response(db, vehicle) for vehicle in vehicles]


@router.post("/vehicles", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    payload: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("fuel_manager")),
):
    existing = db.query(Vehicle).filter(Vehicle.vehicle_number == payload.vehicle_number).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Vehicle number already exists")

    if payload.employee_id is not None:
        employee = db.query(Employee).filter(Employee.id == payload.employee_id).first()
        if not employee:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    vehicle = Vehicle(**payload.model_dump())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)

    vehicle = db.query(Vehicle).options(joinedload(Vehicle.employee)).filter(Vehicle.id == vehicle.id).first()
    return _vehicle_to_response(db, vehicle)


@router.get("/vehicles/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("fuel_manager")),
):
    vehicle = (
        db.query(Vehicle)
        .options(joinedload(Vehicle.employee))
        .filter(Vehicle.id == vehicle_id)
        .first()
    )
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    return _vehicle_to_response(db, vehicle)


@router.put("/vehicles/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(
    vehicle_id: int,
    payload: VehicleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("fuel_manager")),
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    update_data = payload.model_dump(exclude_unset=True)

    if "vehicle_number" in update_data:
        existing = (
            db.query(Vehicle)
            .filter(Vehicle.vehicle_number == update_data["vehicle_number"], Vehicle.id != vehicle_id)
            .first()
        )
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Vehicle number already exists")

    if "employee_id" in update_data and update_data["employee_id"] is not None:
        employee = db.query(Employee).filter(Employee.id == update_data["employee_id"]).first()
        if not employee:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    for field, value in update_data.items():
        setattr(vehicle, field, value)

    db.commit()
    db.refresh(vehicle)

    vehicle = db.query(Vehicle).options(joinedload(Vehicle.employee)).filter(Vehicle.id == vehicle.id).first()
    return _vehicle_to_response(db, vehicle)


@router.delete("/vehicles/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("fuel_manager")),
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    db.delete(vehicle)
    db.commit()
    return None


@router.get("/vehicles/{vehicle_id}/fuel-logs", response_model=List[FuelLogResponse])
def get_vehicle_fuel_logs(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("fuel_manager")),
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    logs = db.query(FuelLog).filter(FuelLog.vehicle_id == vehicle_id).order_by(FuelLog.issue_date.desc()).all()
    return logs


@router.post("/vehicles/{vehicle_id}/fuel-logs", response_model=FuelLogResponse, status_code=status.HTTP_201_CREATED)
def create_fuel_log(
    vehicle_id: int,
    payload: FuelLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("fuel_manager")),
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    _validate_grade_for_fuel_type(vehicle.fuel_type, payload.fuel_grade)

    issue_date = payload.issue_date or datetime.now()
    remaining = _remaining_for_vehicle(db, vehicle, reference=issue_date)
    if payload.liters_issued > remaining:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient remaining allocation. Remaining for month: {remaining:.2f}L",
        )

    total_cost_lkr = round(payload.liters_issued * payload.price_per_liter_lkr, 2)
    log = FuelLog(
        vehicle_id=vehicle_id,
        receipt_number=payload.receipt_number.strip(),
        liters_issued=payload.liters_issued,
        fuel_grade=payload.fuel_grade,
        price_per_liter_lkr=payload.price_per_liter_lkr,
        total_cost_lkr=total_cost_lkr,
        issue_date=issue_date,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/vehicles/{vehicle_id}/report", response_model=FuelUsageReportResponse)
def get_vehicle_fuel_usage_report(
    vehicle_id: int,
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("fuel_manager")),
):
    if start_date > end_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="start_date must be before end_date")

    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    start_dt = datetime.combine(start_date, datetime.min.time())
    end_dt = datetime.combine(end_date + timedelta(days=1), datetime.min.time())

    logs = (
        db.query(FuelLog)
        .filter(FuelLog.vehicle_id == vehicle_id, FuelLog.issue_date >= start_dt, FuelLog.issue_date < end_dt)
        .order_by(FuelLog.issue_date.desc())
        .all()
    )

    total_liters = round(sum(log.liters_issued for log in logs), 2)
    total_cost = round(sum(log.total_cost_lkr for log in logs), 2)

    return FuelUsageReportResponse(
        vehicle_id=vehicle.id,
        vehicle_number=vehicle.vehicle_number,
        fuel_type=vehicle.fuel_type,
        start_date=start_date,
        end_date=end_date,
        total_liters_issued=total_liters,
        total_cost_lkr=total_cost,
        transactions=logs,
    )
