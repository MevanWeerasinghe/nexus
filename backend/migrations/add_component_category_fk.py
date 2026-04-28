"""
Migration script to move component categories from hardcoded text column to categories table references.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import engine


def _column_exists(table_name: str, column_name: str) -> bool:
    with engine.connect() as conn:
        result = conn.execute(
            text(
                """
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = :table_name AND COLUMN_NAME = :column_name
                """
            ),
            {"table_name": table_name, "column_name": column_name},
        )
        return result.fetchone()[0] > 0


def _normalize_prefix(raw: str) -> str:
    return re.sub(r"[^A-Za-z0-9]", "", (raw or "").upper())[:10]


def _choose_prefix(base_name: str, used: set[str]) -> str:
    candidate = _normalize_prefix(base_name)
    if len(candidate) >= 3:
        candidate = candidate[:3]
    elif not candidate:
        candidate = "CMP"

    if candidate not in used:
        return candidate

    suffix = 1
    while True:
        next_value = f"{candidate[:8]}{suffix}"
        if next_value not in used:
            return next_value
        suffix += 1


def _resolve_or_create_component_category(conn, category_name: str, used_short_names: set[str]) -> int:
    row = conn.execute(
        text("SELECT TOP 1 id FROM categories WHERE LOWER(name) = LOWER(:name)"),
        {"name": category_name},
    ).fetchone()
    if row:
        category_id = int(row[0])
        conn.execute(
            text("UPDATE categories SET category_type = 'component' WHERE id = :id"),
            {"id": category_id},
        )
        return category_id

    laptop = conn.execute(text("SELECT TOP 1 id FROM categories WHERE LOWER(name) = 'laptop'")) .fetchone()
    laptop_id = int(laptop[0]) if laptop and category_name.lower() in {"ram", "ssd", "battery"} else None

    prefix = _choose_prefix(category_name, used_short_names)
    used_short_names.add(prefix)

    created = conn.execute(
        text(
            """
            INSERT INTO categories (name, short_name, category_type, parent_category_id, description)
            OUTPUT INSERTED.id
            VALUES (:name, :short_name, 'component', :parent_category_id, :description)
            """
        ),
        {
            "name": category_name,
            "short_name": prefix,
            "parent_category_id": laptop_id,
            "description": f"{category_name} components",
        },
    ).fetchone()
    return int(created[0])


def migrate() -> None:
    try:
        with engine.connect() as conn:
            if not _column_exists("components", "category_id"):
                print("Adding category_id column to components table...")
                conn.execute(text("ALTER TABLE components ADD category_id INT NULL"))
                conn.commit()
                print("✓ category_id column added.")
            else:
                print("✓ category_id column already exists.")

            used_short_names = {
                str(row[0]).upper()
                for row in conn.execute(text("SELECT short_name FROM categories WHERE short_name IS NOT NULL")).fetchall()
            }

            has_legacy_category = _column_exists("components", "category")
            if has_legacy_category:
                component_rows = conn.execute(
                    text("SELECT id, category, category_id FROM components ORDER BY id")
                ).fetchall()

                for row in component_rows:
                    component_id = int(row[0])
                    legacy_name = (row[1] or "").strip() if len(row) > 1 else ""
                    current_category_id = row[2] if len(row) > 2 else None

                    if current_category_id:
                        continue

                    resolved_name = legacy_name or "Other Component"
                    resolved_id = _resolve_or_create_component_category(conn, resolved_name, used_short_names)
                    conn.execute(
                        text("UPDATE components SET category_id = :category_id WHERE id = :id"),
                        {"category_id": resolved_id, "id": component_id},
                    )

            null_count = conn.execute(
                text("SELECT COUNT(*) FROM components WHERE category_id IS NULL")
            ).scalar()

            if null_count and int(null_count) > 0:
                fallback_id = _resolve_or_create_component_category(conn, "Other Component", used_short_names)
                conn.execute(
                    text("UPDATE components SET category_id = :category_id WHERE category_id IS NULL"),
                    {"category_id": fallback_id},
                )

            conn.execute(
                text(
                    """
                    IF NOT EXISTS (
                        SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_components_category'
                    )
                    ALTER TABLE components
                    ADD CONSTRAINT FK_components_category
                    FOREIGN KEY (category_id) REFERENCES categories(id)
                    ON DELETE NO ACTION
                    """
                )
            )

            conn.execute(text("ALTER TABLE components ALTER COLUMN category_id INT NOT NULL"))

            conn.execute(
                text(
                    """
                    IF NOT EXISTS (
                        SELECT 1
                        FROM sys.indexes
                        WHERE name = 'IX_components_category_id' AND object_id = OBJECT_ID('components')
                    )
                    CREATE INDEX IX_components_category_id ON components(category_id)
                    """
                )
            )

            if has_legacy_category:
                conn.execute(
                    text(
                        """
                        IF EXISTS (
                            SELECT 1 FROM sys.indexes
                            WHERE name = 'ix_components_category' AND object_id = OBJECT_ID('components')
                        )
                        DROP INDEX ix_components_category ON components
                        """
                    )
                )
                conn.execute(
                    text(
                        """
                        IF EXISTS (
                            SELECT 1 FROM sys.indexes
                            WHERE name = 'IX_components_category' AND object_id = OBJECT_ID('components')
                        )
                        DROP INDEX IX_components_category ON components
                        """
                    )
                )
                conn.execute(text("ALTER TABLE components DROP COLUMN category"))
                print("✓ legacy category text column removed from components table.")

            conn.commit()

        print("Migration completed successfully!")
    except Exception as exc:
        print(f"Migration failed: {exc}")
        raise


if __name__ == "__main__":
    migrate()
