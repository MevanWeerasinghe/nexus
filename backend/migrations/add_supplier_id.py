"""
Migration script to add supplier_id column to assets table.
Run this after deploying to add the new column to existing databases.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import engine

def migrate():
    """Add supplier_id column to assets table if it doesn't exist."""
    
    try:
        with engine.connect() as conn:
            # Check if supplier_id column exists
            result = conn.execute(text("""
                SELECT COUNT(*) 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'assets' AND COLUMN_NAME = 'supplier_id'
            """))
            exists = result.fetchone()[0] > 0
            
            if not exists:
                print("Adding supplier_id column to assets table...")
                conn.execute(text("""
                    ALTER TABLE assets 
                    ADD supplier_id INT NULL
                    CONSTRAINT FK_assets_supplier 
                    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) 
                    ON DELETE SET NULL
                """))
                conn.commit()
                print("✓ supplier_id column added successfully!")
            else:
                print("✓ supplier_id column already exists.")
        
        print("Migration completed successfully!")
        
    except Exception as e:
        print(f"Migration failed: {e}")
        raise

if __name__ == "__main__":
    migrate()
