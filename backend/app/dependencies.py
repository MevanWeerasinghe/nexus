from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import get_db
from app.auth import decode_token
from app.models.user import User
from sqlalchemy.orm import Session

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user from JWT token.
    Raises HTTPException if token is invalid or user not found.
    """
    token = credentials.credentials
    token_data = decode_token(token)
    
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if token_data.type == "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cannot use refresh token for API access",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.username == token_data.sub).first()
    
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


def require_role(*allowed_role_codes: str):
    """
    Dependency factory to ensure user has one of the required roles.
    Admin role always has access.
    
    Usage: @router.get("/itam", dependencies=[Depends(require_role("itam_manager"))])
    """
    async def role_checker(current_user: User = Depends(get_current_user)):
        # Admin has access to everything
        if current_user.is_admin:
            return current_user
        
        # Check if user has any of the allowed roles
        user_role_codes = current_user.role_codes
        if not any(role in user_role_codes for role in allowed_role_codes):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    
    return role_checker
