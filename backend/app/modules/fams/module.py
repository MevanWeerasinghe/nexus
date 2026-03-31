from app.models.fams import FuelLog, FuelPrice, Vehicle
from app.modules.contracts import ModuleDefinition
from app.routes import fams


def _import_fams_models() -> None:
    # Force SQLAlchemy model registration before metadata creation.
    _ = Vehicle
    _ = FuelLog
    _ = FuelPrice


FAMS_MODULE = ModuleDefinition(
    name="fams",
    routers=[fams.router],
    import_models=_import_fams_models,
)
