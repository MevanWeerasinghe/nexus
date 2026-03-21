"""
Migration script to add ip_address column to employees table.
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
            result = conn.execute(text("""
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'employees' AND COLUMN_NAME = 'ip_address'
            """))
            exists = result.fetchone()[0] > 0

            if not exists:
                print("Adding ip_address column to employees table...")
                conn.execute(text("ALTER TABLE employees ADD ip_address VARCHAR(45) NULL"))
                conn.commit()
                print("✓ ip_address column added.")
            else:
                print("✓ ip_address column already exists.")

        print("Migration completed successfully!")
    except Exception as e:
        print(f"Migration failed: {e}")
        raise


if __name__ == "__main__":
    migrate()
