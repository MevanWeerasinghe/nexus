from app.models.asset import Asset, AssignmentHistory, Category
from app.models.component import AssetComponentHistory, Component, ComponentStatus
# ComponentWarranty model removed; component warranties now stored in `warranties` table via Warranty.model
from app.models.employee import Employee
from app.models.supplier import Supplier
from app.models.warranty import Warranty
from app.modules.contracts import ModuleDefinition
from app.routes import assets, components, employees, suppliers


def _import_itam_models() -> None:
    # Force SQLAlchemy model registration before metadata creation.
    _ = Asset
    _ = AssignmentHistory
    _ = Category
    _ = Employee
    _ = Supplier
    _ = Warranty
    _ = Component
    _ = AssetComponentHistory
    _ = ComponentStatus
    _ = Warranty


ITAM_MODULE = ModuleDefinition(
    name="itam",
    routers=[
        assets.router,
        employees.router,
        suppliers.router,
        components.router,
    ],
    import_models=_import_itam_models,
)
