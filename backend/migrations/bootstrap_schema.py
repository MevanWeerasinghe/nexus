"""
One-time schema bootstrap for deployed environments.

What it does:
1. Imports all SQLAlchemy models so metadata is complete.
2. Creates any missing tables.
3. Runs idempotent column migration(s) for existing tables.

Usage:
    python migrations/bootstrap_schema.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base, engine

# Import all models so Base.metadata is fully populated.
from app.models.user import User, Role  # noqa: F401
from app.models.asset import Asset, Category, AssignmentHistory  # noqa: F401
from app.models.employee import Employee  # noqa: F401
from app.models.supplier import Supplier  # noqa: F401
from app.models.warranty import Warranty  # noqa: F401
from app.models.component import Component, AssetComponentHistory  # noqa: F401
from app.models.component_warranty import ComponentWarranty  # noqa: F401

from migrations.add_supplier_id import migrate as migrate_add_supplier_id


def run() -> None:
    print("[bootstrap] Creating missing tables (if any)...")
    Base.metadata.create_all(bind=engine)
    print("[bootstrap] Table creation check complete.")

    print("[bootstrap] Running idempotent column migrations...")
    migrate_add_supplier_id()
    print("[bootstrap] Column migration check complete.")

    print("[bootstrap] Schema bootstrap finished successfully.")


if __name__ == "__main__":
    run()
