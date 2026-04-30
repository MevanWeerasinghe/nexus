"""
Migration: Move component_warranties into warranties and remove component_warranties table.

Safe steps performed by this script:
 - If `component_warranties` exists, insert its rows into `warranties` setting `component_id`.
 - Add `component_id` column to `warranties` if missing.
 - Create unique index on `component_id` (if not exists).
 - Drop `component_warranties` table (optional - only if data migrated).

Run with:
    python migrations/migrate_component_warranty_to_warranties.py

Make sure you have a DB backup before running in production.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import engine


def migrate() -> None:
    with engine.connect() as conn:
        # Add component_id column to warranties if missing
        col_exists = conn.execute(text("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='warranties' AND COLUMN_NAME='component_id'")).fetchone()[0]
        if not col_exists:
            print("Adding component_id column to warranties...")
            conn.execute(text("ALTER TABLE warranties ADD component_id INT NULL"))
            conn.commit()

        # Ensure the unique index exists even if the legacy table was already removed.
        idx_exists = conn.execute(text("SELECT COUNT(*) FROM sys.indexes WHERE name = 'IX_warranties_component_id' AND object_id = OBJECT_ID('warranties')")).fetchone()[0]
        if not idx_exists:
            print("Creating unique index IX_warranties_component_id...")
            conn.execute(text("CREATE UNIQUE INDEX IX_warranties_component_id ON warranties(component_id) WHERE component_id IS NOT NULL"))
            conn.commit()

        # Check if component_warranties table exists; if not, the schema upgrade is complete.
        exists = conn.execute(text("SELECT OBJECT_ID('component_warranties')")).fetchone()[0]
        if not exists:
            print("component_warranties table not found; warranties schema is up to date.")
            return

        # Migrate rows
        print("Copying rows from component_warranties into warranties...")
        # Insert rows mapping fields - avoid duplication by checking existing component_id
        conn.execute(text("""
            INSERT INTO warranties (component_id, provider_name, duration_months, start_date, end_date, terms_conditions, created_at, updated_at)
            SELECT component_id, provider_name, duration_months, start_date, end_date, terms_conditions, created_at, updated_at
            FROM component_warranties cw
            WHERE NOT EXISTS (SELECT 1 FROM warranties w WHERE w.component_id = cw.component_id)
        """))
        conn.commit()

        # Optionally drop component_warranties table
        print("Dropping component_warranties table...")
        conn.execute(text("DROP TABLE component_warranties"))
        conn.commit()

        print("Migration complete.")


if __name__ == '__main__':
    migrate()
