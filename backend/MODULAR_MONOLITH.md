# Modular Monolith Architecture

This backend now uses a modular monolith structure.

## Goals

- Keep one deployable backend process.
- Isolate business areas into bounded modules.
- Make adding new modules predictable (for example, Maintenance).

## Current Modules

- `auth`: authentication and authorization concerns.
- `itam`: asset, employee, supplier, and component concerns.

## Core Composition Files

- `app/modules/contracts.py`: shared module contract (`ModuleDefinition`).
- `app/modules/registry.py`: enabled module registry and startup composition helpers.
- `app/main.py`: app bootstrap that imports models and includes routers through the registry.

## Module Shape

Each module provides:

- module metadata (`name`)
- routers to include in API
- a model-import hook to register SQLAlchemy models before `Base.metadata.create_all`

See:

- `app/modules/auth/module.py`
- `app/modules/itam/module.py`

## Adding the Maintenance Module

1. Create module package: `app/modules/maintenance/`.
2. Create `module.py` with a `MAINTENANCE_MODULE` value of `ModuleDefinition`.
3. Add maintenance routes under `app/routes/maintenance*.py` (or move to a module-local routes package if preferred).
4. Add model imports in the module hook so DB metadata is complete at startup.
5. Register the module in `app/modules/registry.py` include order.

## Notes

- This refactor does not change API paths.
- Existing auth and ITAM behavior remains the same; only composition changed.
