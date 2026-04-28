"""
Migration script to add cancellation status fields to fams_fuel_logs.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import engine


def _column_exists(table_name: str, column_name: str) -> bool:
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT COUNT(*)
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = :table_name AND COLUMN_NAME = :column_name
        """), {"table_name": table_name, "column_name": column_name})
        return result.fetchone()[0] > 0


def migrate() -> None:
    try:
        with engine.connect() as conn:
            if not _column_exists("fams_fuel_logs", "is_cancelled"):
                print("Adding is_cancelled column to fams_fuel_logs table...")
                conn.execute(text("ALTER TABLE fams_fuel_logs ADD is_cancelled BIT NULL"))
                conn.execute(text("UPDATE fams_fuel_logs SET is_cancelled = 0 WHERE is_cancelled IS NULL"))
                conn.execute(text("ALTER TABLE fams_fuel_logs ALTER COLUMN is_cancelled BIT NOT NULL"))
                conn.execute(text("""
                    IF NOT EXISTS (
                        SELECT 1 FROM sys.default_constraints dc
                        JOIN sys.columns c ON c.default_object_id = dc.object_id
                        JOIN sys.tables t ON t.object_id = c.object_id
                        WHERE t.name = 'fams_fuel_logs' AND c.name = 'is_cancelled'
                    )
                    ALTER TABLE fams_fuel_logs ADD CONSTRAINT DF_fams_fuel_logs_is_cancelled DEFAULT 0 FOR is_cancelled
                """))
                conn.commit()
                print("✓ is_cancelled column added.")
            else:
                print("✓ is_cancelled column already exists.")

            if not _column_exists("fams_fuel_logs", "cancelled_at"):
                print("Adding cancelled_at column to fams_fuel_logs table...")
                conn.execute(text("ALTER TABLE fams_fuel_logs ADD cancelled_at DATETIME NULL"))
                conn.commit()
                print("✓ cancelled_at column added.")
            else:
                print("✓ cancelled_at column already exists.")

        print("Migration completed successfully!")
    except Exception as e:
        print(f"Migration failed: {e}")
        raise


if __name__ == "__main__":
    migrate()
