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
from sqlalchemy import text

# Import all models so Base.metadata is fully populated.
from app.models.user import User, Role  # noqa: F401
from app.models.asset import Asset, Category, AssignmentHistory  # noqa: F401
from app.models.employee import Employee  # noqa: F401
from app.models.supplier import Supplier  # noqa: F401
from app.models.warranty import Warranty  # noqa: F401
from app.models.component import Component, AssetComponentHistory  # noqa: F401
from app.models.fams import Vehicle, FuelLog  # noqa: F401

from migrations.add_supplier_id import migrate as migrate_add_supplier_id
from migrations.add_asset_model_usage_and_unassign_reason import migrate as migrate_add_asset_model_usage_and_unassign_reason
from migrations.add_asset_category_structure_and_auto_tag_prefix import migrate as migrate_add_asset_category_structure_and_auto_tag_prefix
from migrations.add_component_category_fk import migrate as migrate_add_component_category_fk
from migrations.add_employee_ip_address import migrate as migrate_add_employee_ip_address
from migrations.add_fams_unlimited_fuel_flag import migrate as migrate_add_fams_unlimited_fuel_flag
from migrations.add_vehicle_ownership_and_fuel_capacity import migrate as migrate_add_vehicle_ownership_and_fuel_capacity
from migrations.add_fuel_manager_role import migrate as migrate_add_fuel_manager_role
from migrations.add_fams_fuel_log_cancel_status import migrate as migrate_add_fams_fuel_log_cancel_status
from migrations.migrate_component_warranty_to_warranties import migrate as migrate_component_warranty_to_warranties


def _reseed_identity_if_needed() -> None:
    """
    Validate and fix IDENTITY values for critical tables.
    
    Problem: If IDENT_CURRENT > MAX(id), new inserts will use high id values (gap).
    Solution: Reseed IDENT_CURRENT to MAX(id) so next insert gets MAX(id) + 1.
    
    This prevents issues where identity values jump unexpectedly (e.g., 1004 instead of 4).
    """
    tables_to_check = ["assets", "employees", "users"]
    
    with engine.connect() as conn:
        for table_name in tables_to_check:
            try:
                # Get current MAX(id)
                max_result = conn.execute(text(f"SELECT COALESCE(MAX(id), 0) FROM {table_name}"))
                max_id = max_result.fetchone()[0]
                
                # Get current identity value
                ident_result = conn.execute(text(f"SELECT IDENT_CURRENT('{table_name}')"))
                current_ident = ident_result.fetchone()[0]
                
                if current_ident > max_id:
                    print(f"[bootstrap] Fixing {table_name} identity: IDENT_CURRENT={current_ident} > MAX(id)={max_id}")
                    conn.execute(text(f"DBCC CHECKIDENT ('{table_name}', RESEED, {max_id})"))
                    conn.commit()
                    print(f"[bootstrap] ✓ {table_name} identity reseeded to {max_id}")
            except Exception as e:
                print(f"[bootstrap] Warning: Could not check identity for {table_name}: {e}")


def run() -> None:
    print("[bootstrap] Creating missing tables (if any)...")
    Base.metadata.create_all(bind=engine)
    print("[bootstrap] Table creation check complete.")

    print("[bootstrap] Running idempotent column migrations...")
    migrate_add_supplier_id()
    migrate_add_asset_model_usage_and_unassign_reason()
    migrate_add_asset_category_structure_and_auto_tag_prefix()
    migrate_add_component_category_fk()
    migrate_add_employee_ip_address()
    migrate_add_fams_unlimited_fuel_flag()
    migrate_add_fams_fuel_log_cancel_status()
    migrate_add_vehicle_ownership_and_fuel_capacity()
    migrate_add_fuel_manager_role()
    migrate_component_warranty_to_warranties()
    print("[bootstrap] Column migration check complete.")

    print("[bootstrap] Validating and fixing IDENTITY sequences...")
    _reseed_identity_if_needed()

    print("[bootstrap] Schema bootstrap finished successfully.")


if __name__ == "__main__":
    run()
