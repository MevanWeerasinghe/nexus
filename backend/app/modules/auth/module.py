from app.models.user import Role, User
from app.modules.contracts import ModuleDefinition
from app.routes import auth


def _import_auth_models() -> None:
    # Force SQLAlchemy model registration before metadata creation.
    _ = User
    _ = Role


AUTH_MODULE = ModuleDefinition(
    name="auth",
    routers=[auth.router],
    import_models=_import_auth_models,
)
