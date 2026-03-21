"""
Migration script to add model_number and usage_type columns to assets,
and unassign_reason column to assignment_history.
Run this after deploying to update existing databases.
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
            if not _column_exists("assets", "model_number"):
                print("Adding model_number column to assets table...")
                conn.execute(text("ALTER TABLE assets ADD model_number VARCHAR(100) NULL"))
                conn.commit()
                print("✓ model_number column added.")
            else:
                print("✓ model_number column already exists.")

            if not _column_exists("assets", "usage_type"):
                print("Adding usage_type column to assets table...")
                conn.execute(text("ALTER TABLE assets ADD usage_type VARCHAR(50) NULL"))
                conn.execute(text("UPDATE assets SET usage_type = 'Office' WHERE usage_type IS NULL"))
                conn.execute(text("ALTER TABLE assets ALTER COLUMN usage_type VARCHAR(50) NOT NULL"))
                conn.execute(text("""
                    IF NOT EXISTS (
                        SELECT 1 FROM sys.default_constraints dc
                        JOIN sys.columns c ON c.default_object_id = dc.object_id
                        JOIN sys.tables t ON t.object_id = c.object_id
                        WHERE t.name = 'assets' AND c.name = 'usage_type'
                    )
                    ALTER TABLE assets ADD CONSTRAINT DF_assets_usage_type DEFAULT 'Office' FOR usage_type
                """))
                conn.commit()
                print("✓ usage_type column added.")
            else:
                print("✓ usage_type column already exists.")

            if not _column_exists("assignment_history", "unassign_reason"):
                print("Adding unassign_reason column to assignment_history table...")
                conn.execute(text("ALTER TABLE assignment_history ADD unassign_reason VARCHAR(500) NULL"))
                conn.commit()
                print("✓ unassign_reason column added.")
            else:
                print("✓ unassign_reason column already exists.")

        print("Migration completed successfully!")
    except Exception as e:
        print(f"Migration failed: {e}")
        raise


if __name__ == "__main__":
    migrate()
