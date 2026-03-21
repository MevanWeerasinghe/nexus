from dataclasses import dataclass
from typing import Callable, Sequence

from fastapi import APIRouter


ModelImportHook = Callable[[], None]


@dataclass(frozen=True)
class ModuleDefinition:
    """Describes a bounded module that participates in the monolith."""

    name: str
    routers: Sequence[APIRouter]
    import_models: ModelImportHook
