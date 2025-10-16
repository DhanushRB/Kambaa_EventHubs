#!/usr/bin/env python3
"""
Database migration script to add missing branding columns to forms table
"""

import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

def migrate_forms_table():
    """Add missing branding columns to forms table"""
    
    # Load environment variables
    load_dotenv()
    
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not found in environment variables")
        return False
    
    try:
        # Create engine
        engine = create_engine(DATABASE_URL)
        
        # SQL to add missing columns
        migration_sql = """
        ALTER TABLE forms 
        ADD COLUMN IF NOT EXISTS banner_image VARCHAR(500) NULL,
        ADD COLUMN IF NOT EXISTS logo_image VARCHAR(500) NULL,
        ADD COLUMN IF NOT EXISTS footer_text VARCHAR(1000) NULL,
        ADD COLUMN IF NOT EXISTS brand_colors VARCHAR(500) NULL,
        ADD COLUMN IF NOT EXISTS qr_code_image VARCHAR(500) NULL;
        """
        
        # Execute migration
        with engine.connect() as connection:
            print("Executing migration to add branding columns to forms table...")
            connection.execute(text(migration_sql))
            connection.commit()
            print("Migration completed successfully!")
            
        return True
        
    except Exception as e:
        print(f"Migration failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = migrate_forms_table()
    sys.exit(0 if success else 1)