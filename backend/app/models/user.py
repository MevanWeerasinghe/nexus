from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


# Junction table for many-to-many relationship between users and roles
user_roles = Table(
    'user_roles',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Column('role_id', Integer, ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True)
)


class Role(Base):
    """Role model for permission management.
    
    Predefined roles:
    - admin: Full access to all modules
    - itam_manager: Access to IT Asset Management module
    """
    
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)  # e.g., 'admin', 'itam_manager'
    name = Column(String(100), nullable=False)  # e.g., 'Administrator', 'ITAM Manager'
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Relationship to users
    users = relationship("User", secondary=user_roles, back_populates="roles")
    
    def __repr__(self):
        return f"<Role(id={self.id}, code='{self.code}')>"


class User(Base):
    """User model for system access."""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Many-to-many relationship with roles
    roles = relationship("Role", secondary=user_roles, back_populates="users")
    
    @property
    def role_codes(self) -> list:
        """Get list of role codes for this user."""
        return [role.code for role in self.roles]
    
    @property
    def is_admin(self) -> bool:
        """Check if user has admin role."""
        return 'admin' in self.role_codes
    
    def has_role(self, role_code: str) -> bool:
        """Check if user has a specific role."""
        return role_code in self.role_codes or self.is_admin
    
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}')>"
