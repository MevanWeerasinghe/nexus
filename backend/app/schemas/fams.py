from datetime import datetime, date
from typing import Optional, Literal, List

from pydantic import BaseModel, Field

from app.schemas.employee import EmployeeResponse


VehicleType = Literal["Car", "Bike"]
FuelType = Literal["Petrol", "Diesel"]
PetrolGrade = Literal["92 Octane", "95 Octane"]
DieselGrade = Literal["Auto Diesel", "Super Diesel 4 Star"]
FuelGrade = Literal["92 Octane", "95 Octane", "Auto Diesel", "Super Diesel 4 Star"]


class VehicleBase(BaseModel):
    vehicle_number: str = Field(..., min_length=1, max_length=50)
    vehicle_type: VehicleType
    model: str = Field(..., min_length=1, max_length=100)
    employee_id: Optional[int] = None
    monthly_allocation: float = Field(..., gt=0)
    fuel_type: FuelType


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    vehicle_number: Optional[str] = Field(None, min_length=1, max_length=50)
    vehicle_type: Optional[VehicleType] = None
    model: Optional[str] = Field(None, min_length=1, max_length=100)
    employee_id: Optional[int] = None
    monthly_allocation: Optional[float] = Field(None, gt=0)
    fuel_type: Optional[FuelType] = None


class VehicleResponse(BaseModel):
    id: int
    vehicle_number: str
    vehicle_type: VehicleType
    model: str
    employee_id: Optional[int] = None
    monthly_allocation: float
    fuel_type: FuelType
    remaining_fuel: float
    created_at: datetime
    updated_at: datetime
    employee: Optional[EmployeeResponse] = None

    class Config:
        from_attributes = True


class FuelLogCreate(BaseModel):
    receipt_number: str = Field(..., min_length=1, max_length=100)
    liters_issued: float = Field(..., gt=0)
    fuel_grade: FuelGrade
    price_per_liter_lkr: float = Field(..., gt=0)
    issue_date: Optional[datetime] = None


class FuelLogResponse(BaseModel):
    id: int
    vehicle_id: int
    receipt_number: str
    liters_issued: float
    fuel_grade: FuelGrade
    price_per_liter_lkr: float
    total_cost_lkr: float
    issue_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class FuelUsageReportResponse(BaseModel):
    vehicle_id: int
    vehicle_number: str
    fuel_type: FuelType
    start_date: date
    end_date: date
    total_liters_issued: float
    total_cost_lkr: float
    transactions: List[FuelLogResponse]
