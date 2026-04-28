"""
Migration script to add category metadata fields used for auto-generated asset tags.
"""
import os
import re
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


def _normalize_prefix(raw: str) -> str:
    value = re.sub(r"[^A-Za-z0-9]", "", (raw or "").upper())
    return value[:10]


def _default_prefix(name: str, category_id: int) -> str:
    normalized = _normalize_prefix(name)
    if len(normalized) >= 3:
        return normalized[:3]
    if normalized:
        return normalized
    return f"CAT{category_id}"


def migrate() -> None:
    try:
        with engine.connect() as conn:
            if not _column_exists("categories", "short_name"):
                print("Adding short_name column to categories table...")
                conn.execute(text("ALTER TABLE categories ADD short_name VARCHAR(10) NULL"))
                conn.commit()
                print("✓ short_name column added.")
            else:
                print("✓ short_name column already exists.")

            if not _column_exists("categories", "category_type"):
                print("Adding category_type column to categories table...")
                conn.execute(text("ALTER TABLE categories ADD category_type VARCHAR(20) NULL"))
                conn.commit()
                print("✓ category_type column added.")
            else:
                print("✓ category_type column already exists.")

            if not _column_exists("categories", "parent_category_id"):
                print("Adding parent_category_id column to categories table...")
                conn.execute(text("ALTER TABLE categories ADD parent_category_id INT NULL"))
                conn.execute(text("""
                    IF NOT EXISTS (
                        SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_categories_parent_category'
                    )
                    ALTER TABLE categories
                    ADD CONSTRAINT FK_categories_parent_category
                    FOREIGN KEY (parent_category_id) REFERENCES categories(id)
                    ON DELETE NO ACTION
                """))
                conn.commit()
                print("✓ parent_category_id column added.")
            else:
                print("✓ parent_category_id column already exists.")
                conn.execute(text("""
                    IF NOT EXISTS (
                        SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_categories_parent_category'
                    )
                    ALTER TABLE categories
                    ADD CONSTRAINT FK_categories_parent_category
                    FOREIGN KEY (parent_category_id) REFERENCES categories(id)
                    ON DELETE NO ACTION
                """))
                conn.commit()
                print("✓ parent_category_id foreign key checked.")

            rows = conn.execute(text("SELECT id, name, short_name FROM categories ORDER BY id")).fetchall()

            seen = set()
            for row in rows:
                category_id = row[0]
                name = row[1]
                current_short = row[2]

                base = _normalize_prefix(current_short or _default_prefix(name, category_id))
                if not base:
                    base = f"CAT{category_id}"

                candidate = base
                suffix = 1
                while candidate in seen:
                    suffix += 1
                    candidate = f"{base[:8]}{suffix}"

                seen.add(candidate)
                conn.execute(
                    text("UPDATE categories SET short_name = :short_name WHERE id = :id"),
                    {"short_name": candidate, "id": category_id},
                )

            conn.execute(text("UPDATE categories SET category_type = 'standalone' WHERE category_type IS NULL OR category_type = ''"))
            conn.execute(text("ALTER TABLE categories ALTER COLUMN short_name VARCHAR(10) NOT NULL"))
            conn.execute(text("ALTER TABLE categories ALTER COLUMN category_type VARCHAR(20) NOT NULL"))

            conn.execute(text("""
                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.indexes
                    WHERE name = 'IX_categories_short_name' AND object_id = OBJECT_ID('categories')
                )
                CREATE UNIQUE INDEX IX_categories_short_name ON categories(short_name)
            """))

            # Seed expected categories for the redesigned ITAMS flow.
            existing_rows = conn.execute(
                text("SELECT id, name, short_name, category_type, parent_category_id FROM categories ORDER BY id")
            ).fetchall()
            existing_by_name = {row[1].lower(): row for row in existing_rows}
            used_shorts = {str(row[2]).upper() for row in existing_rows if row[2]}

            def ensure_unique_short_name(base_short: str) -> str:
                candidate = _normalize_prefix(base_short) or "CAT"
                candidate = candidate[:10]
                if candidate not in used_shorts:
                    return candidate

                suffix = 1
                while True:
                    next_value = f"{candidate[:8]}{suffix}"
                    if next_value not in used_shorts:
                        return next_value
                    suffix += 1

            standalone_seed = [
                {"name": "Laptop", "short_name": "LAP"},
                {"name": "Desktop", "short_name": "DST"},
                {"name": "Monitor", "short_name": "MNT"},
                {"name": "Mobile", "short_name": "MBL"},
                {"name": "Printer", "short_name": "PRN"},
                {"name": "Other", "short_name": "OTH"},
            ]

            for item in standalone_seed:
                key = item["name"].lower()
                if key in existing_by_name:
                    continue

                short_name = ensure_unique_short_name(item["short_name"])
                conn.execute(
                    text(
                        """
                        INSERT INTO categories (name, short_name, category_type, parent_category_id, description)
                        VALUES (:name, :short_name, 'standalone', NULL, :description)
                        """
                    ),
                    {
                        "name": item["name"],
                        "short_name": short_name,
                        "description": f"{item['name']} category",
                    },
                )
                used_shorts.add(short_name)

            existing_rows = conn.execute(
                text("SELECT id, name, short_name, category_type, parent_category_id FROM categories ORDER BY id")
            ).fetchall()
            existing_by_name = {row[1].lower(): row for row in existing_rows}
            laptop = existing_by_name.get("laptop")

            component_seed = [
                {"name": "RAM", "short_name": "RAM"},
                {"name": "SSD", "short_name": "SSD"},
                {"name": "Battery", "short_name": "BAT"},
            ]

            if laptop:
                laptop_id = laptop[0]
                for item in component_seed:
                    key = item["name"].lower()
                    existing = existing_by_name.get(key)

                    if not existing:
                        short_name = ensure_unique_short_name(item["short_name"])
                        conn.execute(
                            text(
                                """
                                INSERT INTO categories (name, short_name, category_type, parent_category_id, description)
                                VALUES (:name, :short_name, 'component', :parent_category_id, :description)
                                """
                            ),
                            {
                                "name": item["name"],
                                "short_name": short_name,
                                "parent_category_id": laptop_id,
                                "description": f"{item['name']} components",
                            },
                        )
                        used_shorts.add(short_name)
                    else:
                        conn.execute(
                            text(
                                """
                                UPDATE categories
                                SET category_type = 'component', parent_category_id = :parent_category_id
                                WHERE id = :id
                                """
                            ),
                            {"parent_category_id": laptop_id, "id": existing[0]},
                        )

            conn.commit()
            print("✓ categories short_name/category_type data backfilled.")

        print("Migration completed successfully!")
    except Exception as exc:
        print(f"Migration failed: {exc}")
        raise


if __name__ == "__main__":
    migrate()
