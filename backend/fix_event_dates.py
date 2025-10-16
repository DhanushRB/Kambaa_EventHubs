#!/usr/bin/env python3
"""
Database migration script to fix event dates and add missing slug column
"""

import os
import sys
from datetime import datetime
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def fix_event_dates():
    """Fix event dates in the database"""
    
    # Get database URL
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL not found in environment variables")
        return False
    
    try:
        # Create engine
        engine = create_engine(database_url)
        
        with engine.connect() as conn:
            # Start transaction
            trans = conn.begin()
            
            try:
                # First, check if slug column exists, if not add it
                print("Checking if slug column exists...")
                result = conn.execute(text("""
                    SELECT COLUMN_NAME 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = DATABASE() 
                    AND TABLE_NAME = 'events' 
                    AND COLUMN_NAME = 'slug'
                """))
                
                if not result.fetchone():
                    print("Adding slug column to events table...")
                    conn.execute(text("ALTER TABLE events ADD COLUMN slug VARCHAR(255) UNIQUE"))
                    print("[OK] Slug column added")
                else:
                    print("[OK] Slug column already exists")
                
                # Check if event_date column is large enough
                print("Checking event_date column size...")
                result = conn.execute(text("""
                    SELECT CHARACTER_MAXIMUM_LENGTH 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = DATABASE() 
                    AND TABLE_NAME = 'events' 
                    AND COLUMN_NAME = 'event_date'
                """))
                
                column_length = result.fetchone()
                if column_length and column_length[0] < 50:
                    print(f"Expanding event_date column from {column_length[0]} to 50 characters...")
                    conn.execute(text("ALTER TABLE events MODIFY COLUMN event_date VARCHAR(50)"))
                    print("[OK] Event_date column expanded")
                else:
                    print("[OK] Event_date column size is adequate")
                
                # Get all events
                print("Fetching all events...")
                events = conn.execute(text("SELECT id, name, event_date, slug FROM events")).fetchall()
                
                print(f"Found {len(events)} events to process")
                
                for event in events:
                    event_id, name, event_date, slug = event
                    print(f"Processing event {event_id}: {name}")
                    
                    # Generate slug if missing
                    if not slug:
                        # Create slug from name
                        import re
                        slug = re.sub(r'[^a-zA-Z0-9\s-]', '', name.lower())
                        slug = re.sub(r'\s+', '-', slug.strip())
                        slug = slug[:50]  # Limit length
                        
                        # Ensure uniqueness
                        counter = 1
                        original_slug = slug
                        while True:
                            check_result = conn.execute(text("SELECT id FROM events WHERE slug = :slug AND id != :event_id"), 
                                                      {"slug": slug, "event_id": event_id})
                            if not check_result.fetchone():
                                break
                            slug = f"{original_slug}-{counter}"
                            counter += 1
                        
                        print(f"  Generated slug: {slug}")
                        conn.execute(text("UPDATE events SET slug = :slug WHERE id = :event_id"), 
                                   {"slug": slug, "event_id": event_id})
                    
                    # Fix event_date if it looks corrupted
                    if event_date:
                        original_date = event_date
                        
                        # Check if date looks corrupted (too short, invalid format, etc.)
                        if len(event_date) <= 10 and not event_date.count('-') == 2:
                            # Looks like corrupted date, set to a default
                            fixed_date = "2024-01-01 00:00:00"
                            print(f"  Fixed corrupted date '{original_date}' -> '{fixed_date}'")
                            conn.execute(text("UPDATE events SET event_date = :event_date WHERE id = :event_id"), 
                                       {"event_date": fixed_date, "event_id": event_id})
                        
                        elif len(event_date) == 10 and event_date.count('-') == 2:
                            # Date only, add time
                            fixed_date = f"{event_date} 00:00:00"
                            print(f"  Added time to date '{original_date}' -> '{fixed_date}'")
                            conn.execute(text("UPDATE events SET event_date = :event_date WHERE id = :event_id"), 
                                       {"event_date": fixed_date, "event_id": event_id})
                        
                        elif ' ' in event_date and len(event_date.split(' ')[1].split(':')) == 2:
                            # Has date and time but missing seconds
                            parts = event_date.split(' ')
                            fixed_date = f"{parts[0]} {parts[1]}:00"
                            print(f"  Added seconds to time '{original_date}' -> '{fixed_date}'")
                            conn.execute(text("UPDATE events SET event_date = :event_date WHERE id = :event_id"), 
                                       {"event_date": fixed_date, "event_id": event_id})
                        else:
                            print(f"  Date format looks good: {event_date}")
                    else:
                        # No date at all, set default
                        fixed_date = "2024-01-01 00:00:00"
                        print(f"  Set default date: {fixed_date}")
                        conn.execute(text("UPDATE events SET event_date = :event_date WHERE id = :event_id"), 
                                   {"event_date": fixed_date, "event_id": event_id})
                
                # Commit transaction
                trans.commit()
                print("[OK] All changes committed successfully")
                return True
                
            except Exception as e:
                # Rollback on error
                trans.rollback()
                print(f"ERROR during migration: {str(e)}")
                return False
                
    except Exception as e:
        print(f"ERROR connecting to database: {str(e)}")
        return False

if __name__ == "__main__":
    print("Starting event dates migration...")
    print("=" * 50)
    
    success = fix_event_dates()
    
    print("=" * 50)
    if success:
        print("[SUCCESS] Migration completed successfully!")
        print("You can now restart your application.")
    else:
        print("[ERROR] Migration failed!")
        print("Please check the error messages above and try again.")
    
    sys.exit(0 if success else 1)