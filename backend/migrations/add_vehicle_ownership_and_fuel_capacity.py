"""
Migration script to add vehicle ownership type and fuel capacity columns.
Run this after deploying to update existing databases.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import engine


def migrate() -> None:
    try:
        with engine.connect() as conn:
            ownership_exists = conn.execute(
                text(
                    """
                    SELECT COUNT(*)
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = 'fams_vehicles' AND COLUMN_NAME = 'ownership_type'
                    """
                )
            ).fetchone()[0] > 0

            if not ownership_exists:
                print("Adding ownership_type column to fams_vehicles table...")
                conn.execute(
                    text(
                        """
                        ALTER TABLE fams_vehicles
                        ADD ownership_type NVARCHAR(50) NOT NULL
                        CONSTRAINT DF_fams_vehicles_ownership_type DEFAULT 'Office Vehicle'
                        """
                    )
                )
                conn.commit()
                print("✓ ownership_type column added.")
            else:
                print("✓ ownership_type column already exists.")

            capacity_exists = conn.execute(
                text(
                    """
                    SELECT COUNT(*)
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = 'fams_vehicles' AND COLUMN_NAME = 'fuel_capacity_liters'
                    """
                )
            ).fetchone()[0] > 0

            if not capacity_exists:
                print("Adding fuel_capacity_liters column to fams_vehicles table...")
                conn.execute(text("ALTER TABLE fams_vehicles ADD fuel_capacity_liters FLOAT NULL"))
                conn.commit()
                print("✓ fuel_capacity_liters column added.")
            else:
                print("✓ fuel_capacity_liters column already exists.")

        print("Migration completed successfully!")
    except Exception as e:
        print(f"Migration failed: {e}")
        raise


if __name__ == "__main__":
    migrate()