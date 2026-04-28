from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum
from typing import Optional


class ComponentStatus(str, enum.Enum):
    """Status enum for components."""
    AVAILABLE = "Available"
    INSTALLED = "Installed"
    DEFECTIVE = "Defective"
    DISPOSED = "Disposed"


class Component(Base):
    """Component model for hardware parts (RAM, SSD, batteries, etc.)."""
    
    __tablename__ = "components"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)  # e.g., "16GB DDR4 RAM"
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False, index=True)
    serial_number = Column(String(100), nullable=True, index=True)
    
    # Purchase info
    purchase_price = Column(Float, nullable=True)
    purchase_date = Column(DateTime, nullable=True)
    
    # Supplier relationship
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True)
    
    # Status
    status = Column(String(50), default=ComponentStatus.AVAILABLE.value, nullable=False, index=True)
    
    # Additional info
    specifications = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    category_ref = relationship("Category")
    supplier = relationship("Supplier", back_populates="components")
    installation_history = relationship("AssetComponentHistory", back_populates="component")
    warranty = relationship("ComponentWarranty", back_populates="component", uselist=False, cascade="all, delete-orphan")

    @property
    def category(self) -> Optional[str]:
        return self.category_ref.name if self.category_ref else None

    @property
    def category_short_name(self) -> Optional[str]:
        return self.category_ref.short_name if self.category_ref else None

    @property
    def category_type(self) -> Optional[str]:
        return self.category_ref.category_type if self.category_ref else None
    
    def __repr__(self):
        return f"<Component(id={self.id}, name='{self.name}', status='{self.status}')>"


class AssetComponentHistory(Base):
    """History table linking assets and components for tracking upgrades/repairs."""
    
    __tablename__ = "asset_component_history"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    component_id = Column(Integer, ForeignKey("components.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Installation info
    installed_date = Column(DateTime, server_default=func.now(), nullable=False)
    installed_by = Column(String(200), nullable=True)  # User/technician who installed
    
    # Removal info (if component was later removed)
    removed_date = Column(DateTime, nullable=True)
    removal_reason = Column(String(255), nullable=True)
    
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Relationships
    asset = relationship("Asset", back_populates="component_history")
    component = relationship("Component", back_populates="installation_history")
    
    def __repr__(self):
        return f"<AssetComponentHistory(id={self.id}, asset_id={self.asset_id}, component_id={self.component_id})>"
