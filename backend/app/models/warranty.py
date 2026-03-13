from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Warranty(Base):
    """Warranty model for tracking asset warranties (one-to-one with Asset)."""
    
    __tablename__ = "warranties"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    
    provider_name = Column(String(200), nullable=False)
    duration_months = Column(Integer, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    terms_conditions = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationship
    asset = relationship("Asset", back_populates="warranty")
    
    def __repr__(self):
        return f"<Warranty(id={self.id}, asset_id={self.asset_id}, provider='{self.provider_name}')>"
