from sqlalchemy import Boolean, Column, Integer, String, Float, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Vehicle(Base):
    """Fleet vehicle master record."""

    __tablename__ = "fams_vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_number = Column(String(50), unique=True, nullable=False, index=True)
    vehicle_type = Column(String(20), nullable=False)  # Car | Bike
    model = Column(String(100), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True, index=True)
    monthly_allocation = Column(Float, nullable=False)
    unlimited_fuel = Column(Boolean, nullable=False, server_default="0")
    fuel_type = Column(String(20), nullable=False)  # Petrol | Diesel
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    employee = relationship("Employee", back_populates="vehicles")
    fuel_logs = relationship(
        "FuelLog",
        back_populates="vehicle",
        cascade="all, delete-orphan",
        order_by="desc(FuelLog.issue_date)",
    )

    def __repr__(self) -> str:
        return f"<Vehicle(id={self.id}, vehicle_number='{self.vehicle_number}', fuel_type='{self.fuel_type}')>"


class FuelLog(Base):
    """Fuel issuance transaction log for a vehicle."""

    __tablename__ = "fams_fuel_logs"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("fams_vehicles.id", ondelete="CASCADE"), nullable=False, index=True)
    receipt_number = Column(String(100), nullable=False, index=True)
    liters_issued = Column(Float, nullable=False)
    fuel_grade = Column(String(50), nullable=False)
    price_per_liter_lkr = Column(Float, nullable=False)
    total_cost_lkr = Column(Float, nullable=False)
    issue_date = Column(DateTime, nullable=False, server_default=func.now(), index=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    vehicle = relationship("Vehicle", back_populates="fuel_logs")

    def __repr__(self) -> str:
        return f"<FuelLog(id={self.id}, vehicle_id={self.vehicle_id}, liters_issued={self.liters_issued})>"


class FuelPrice(Base):
    """Configured fuel prices per fuel grade for FAMS."""

    __tablename__ = "fams_fuel_prices"

    id = Column(Integer, primary_key=True, index=True)
    fuel_grade = Column(String(50), nullable=False, unique=True, index=True)
    price_per_liter_lkr = Column(Float, nullable=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self) -> str:
        return f"<FuelPrice(id={self.id}, fuel_grade='{self.fuel_grade}', price={self.price_per_liter_lkr})>"
