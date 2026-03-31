"""
Migration script to add unlimited_fuel column to fams_vehicles table.
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
            result = conn.execute(
                text(
                    """
                    SELECT COUNT(*)
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = 'fams_vehicles' AND COLUMN_NAME = 'unlimited_fuel'
                    """
                )
            )
            exists = result.fetchone()[0] > 0

            if not exists:
                print("Adding unlimited_fuel column to fams_vehicles table...")
                conn.execute(
                    text(
                        """
                        ALTER TABLE fams_vehicles
                        ADD unlimited_fuel BIT NOT NULL
                        CONSTRAINT DF_fams_vehicles_unlimited_fuel DEFAULT 0
                        """
                    )
                )
                conn.commit()
                print("✓ unlimited_fuel column added.")
            else:
                print("✓ unlimited_fuel column already exists.")

        print("Migration completed successfully!")
    except Exception as e:
        print(f"Migration failed: {e}")
        raise


if __name__ == "__main__":
    migrate()
