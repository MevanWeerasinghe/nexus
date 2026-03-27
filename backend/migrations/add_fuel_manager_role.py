"""
Migration script to ensure fuel_manager role exists.
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
                    FROM roles
                    WHERE code = 'fuel_manager'
                    """
                )
            )
            exists = result.fetchone()[0] > 0

            if not exists:
                print("Adding fuel_manager role...")
                conn.execute(
                    text(
                        """
                        INSERT INTO roles (code, name, description)
                        VALUES ('fuel_manager', 'Fuel Manager', 'Access to Fleet & Allocation Management System module')
                        """
                    )
                )
                conn.commit()
                print("✓ fuel_manager role added.")
            else:
                print("✓ fuel_manager role already exists.")

        print("Migration completed successfully!")
    except Exception as e:
        print(f"Migration failed: {e}")
        raise


if __name__ == "__main__":
    migrate()
