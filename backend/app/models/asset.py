from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class AssignmentHistory(Base):
    """Assignment history model to track all past owners of an asset."""
    
    __tablename__ = "assignment_history"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    employee_name = Column(String(255), nullable=False)  # Store name in case employee is deleted
    employee_email = Column(String(255), nullable=True)
    employee_department = Column(String(255), nullable=True)
    
    # Assignment timestamps
    assigned_at = Column(DateTime, nullable=False, server_default=func.now())
    unassigned_at = Column(DateTime, nullable=True)
    unassign_reason = Column(String(500), nullable=True)
    
    # Relationships
    asset = relationship("Asset", back_populates="assignment_history")
    employee = relationship("Employee", back_populates="assignment_history")
    
    def __repr__(self):
        return f"<AssignmentHistory(id={self.id}, asset_id={self.asset_id}, employee_name='{self.employee_name}')>"


class Category(Base):
    """Category model for asset classification."""
    
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Relationship to assets
    assets = relationship("Asset", back_populates="category")
    
    def __repr__(self):
        return f"<Category(id={self.id}, name='{self.name}')>"


class Asset(Base):
    """Asset model for IT Asset Management."""
    
    __tablename__ = "assets"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_tag = Column(String(50), unique=True, nullable=False, index=True)
    serial_number = Column(String(100), nullable=True, index=True)
    
    # Foreign key to category
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    
    # Foreign key to employee (who holds the asset)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    
    # Foreign key to supplier
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True)
    
    # Asset details
    manufacturer = Column(String(100), nullable=False)
    model_name = Column(String(100), nullable=False)
    model_number = Column(String(100), nullable=True)
    usage_type = Column(String(50), nullable=False, default="Office")
    
    # Purchase information
    purchase_date = Column(Date, nullable=True)
    purchase_price = Column(Float, nullable=True)
    
    # Legacy warranty fields (kept for backward compatibility, warranty in separate table)
    warranty_months = Column(Integer, nullable=True, default=12)
    warranty_expiry_date = Column(Date, nullable=True)
    
    # Status: Available, Deployed, In Maintenance, Retired, Disposed
    status = Column(String(50), default="Available", nullable=False, index=True)
    
    # Assignment (for future use)
    assigned_to = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    notes = Column(String(500), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationship to category
    category = relationship("Category", back_populates="assets")
    
    # Relationship to employee
    employee = relationship("Employee", back_populates="assets")
    
    # Relationship to supplier
    supplier = relationship("Supplier", back_populates="assets")
    
    # Relationship to warranty (one-to-one)
    warranty = relationship("Warranty", back_populates="asset", uselist=False, cascade="all, delete-orphan")
    
    # Relationship to assignment history
    assignment_history = relationship("AssignmentHistory", back_populates="asset", order_by="desc(AssignmentHistory.assigned_at)")
    
    # Relationship to component history
    component_history = relationship("AssetComponentHistory", back_populates="asset", order_by="desc(AssetComponentHistory.installed_date)")
    
    def __repr__(self):
        return f"<Asset(id={self.id}, asset_tag='{self.asset_tag}', status='{self.status}')>"
