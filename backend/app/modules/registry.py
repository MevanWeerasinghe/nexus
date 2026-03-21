from collections.abc import Iterable

from fastapi import FastAPI

from app.modules.auth.module import AUTH_MODULE
from app.modules.contracts import ModuleDefinition
from app.modules.itam.module import ITAM_MODULE


def get_modules() -> list[ModuleDefinition]:
    """Return all enabled modules in include order."""
    return [AUTH_MODULE, ITAM_MODULE]


def import_all_models(modules: Iterable[ModuleDefinition]) -> None:
    """Import models for all modules so SQLAlchemy metadata is complete."""
    for module in modules:
        module.import_models()


def include_all_routers(app: FastAPI, modules: Iterable[ModuleDefinition]) -> None:
    """Attach routers from all modules to the FastAPI app."""
    for module in modules:
        for router in module.routers:
            app.include_router(router)
