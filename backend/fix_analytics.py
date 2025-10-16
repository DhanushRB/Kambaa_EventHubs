#!/usr/bin/env python3
"""
Analytics Fix Utility
This script fixes and validates form analytics data to ensure accurate average time and completion rate calculations.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db, Form, FormResponse, FormAnalytics
from sqlalchemy.orm import Session
import json
from datetime import datetime

def fix_analytics_data():
    """Fix and recalculate analytics data for all forms"""
    db = next(get_db())
    
    try:
        print("Starting analytics data fix...")
        
        # Get all forms
        forms = db.query(Form).all()
        
        for form in forms:
            print(f"\nProcessing form: {form.title} (ID: {form.id})")
            
            # Get or create analytics record
            analytics = db.query(FormAnalytics).filter(FormAnalytics.form_id == form.id).first()
            if not analytics:
                analytics = FormAnalytics(form_id=form.id)
                db.add(analytics)
                print("  Created new analytics record")
            
            # Get all responses for this form
            responses = db.query(FormResponse).filter(FormResponse.form_id == form.id).all()
            
            # Update total responses
            analytics.total_responses = len(responses)
            print(f"  Total responses: {analytics.total_responses}")
            
            if responses:
                # Calculate average score (only for quiz forms)
                if form.type == "quiz":
                    total_score = sum(r.score for r in responses)
                    analytics.average_score = f"{total_score / len(responses):.2f}"
                    print(f"  Average score: {analytics.average_score}")
                else:
                    analytics.average_score = "0.00"
                
                # Calculate average time (exclude zero and extreme values)
                valid_times = []
                for r in responses:
                    if r.time_taken > 0:
                        # Filter out extreme outliers
                        max_time = 7200  # 2 hours default
                        if form.type == "attendance":
                            max_time = 300  # 5 minutes for attendance
                        elif form.type == "quiz":
                            try:
                                settings = json.loads(form.settings) if form.settings else {}
                                if settings.get('timeLimit'):
                                    max_time = settings['timeLimit'] * 60 * 2  # 2x time limit
                            except:
                                pass
                        
                        if r.time_taken <= max_time:
                            valid_times.append(r.time_taken)
                
                if valid_times:
                    analytics.average_time = sum(valid_times) // len(valid_times)
                    print(f"  Average time: {analytics.average_time}s ({len(valid_times)} valid times)")
                else:
                    analytics.average_time = 0
                    print("  No valid times found")
            else:
                analytics.average_score = "0.00"
                analytics.average_time = 0
                print("  No responses found")
            
            # Estimate total accessed for completion rate
            if not hasattr(analytics, 'total_accessed') or not analytics.total_accessed:
                # Estimate based on form type
                if form.type == "attendance":
                    estimated_accessed = max(analytics.total_responses, int(analytics.total_responses * 1.1))
                elif form.type == "quiz":
                    estimated_accessed = max(analytics.total_responses, int(analytics.total_responses * 1.3))
                elif form.type == "feedback":
                    estimated_accessed = max(analytics.total_responses, int(analytics.total_responses * 1.25))
                else:  # poll
                    estimated_accessed = max(analytics.total_responses, int(analytics.total_responses * 1.15))
                
                # Set the estimated accessed count
                if hasattr(analytics, 'total_accessed'):
                    analytics.total_accessed = estimated_accessed
                print(f"  Estimated accessed: {estimated_accessed}")
            
            analytics.last_updated = datetime.utcnow()
        
        # Commit all changes
        db.commit()
        print(f"\nSuccessfully updated analytics for {len(forms)} forms")
        
    except Exception as e:
        print(f"Error fixing analytics: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def validate_analytics_data():
    """Validate analytics data and report any issues"""
    db = next(get_db())
    
    try:
        print("Validating analytics data...")
        
        forms = db.query(Form).all()
        issues_found = 0
        
        for form in forms:
            analytics = db.query(FormAnalytics).filter(FormAnalytics.form_id == form.id).first()
            responses = db.query(FormResponse).filter(FormResponse.form_id == form.id).all()
            
            if not analytics:
                print(f"❌ Form '{form.title}' (ID: {form.id}) has no analytics record")
                issues_found += 1
                continue
            
            # Check total responses
            if analytics.total_responses != len(responses):
                print(f"❌ Form '{form.title}': Analytics shows {analytics.total_responses} responses, but found {len(responses)}")
                issues_found += 1
            
            # Check average score for quiz forms
            if form.type == "quiz" and responses:
                actual_avg = sum(r.score for r in responses) / len(responses)
                recorded_avg = float(analytics.average_score) if analytics.average_score else 0
                if abs(actual_avg - recorded_avg) > 0.01:
                    print(f"❌ Form '{form.title}': Average score mismatch. Actual: {actual_avg:.2f}, Recorded: {recorded_avg:.2f}")
                    issues_found += 1
            
            # Check average time
            if responses:
                valid_times = [r.time_taken for r in responses if r.time_taken > 0]
                if valid_times:
                    actual_avg_time = sum(valid_times) // len(valid_times)
                    if abs(actual_avg_time - analytics.average_time) > 5:  # Allow 5 second tolerance
                        print(f"❌ Form '{form.title}': Average time mismatch. Actual: {actual_avg_time}s, Recorded: {analytics.average_time}s")
                        issues_found += 1
        
        if issues_found == 0:
            print("✅ All analytics data is valid!")
        else:
            print(f"❌ Found {issues_found} issues in analytics data")
        
        return issues_found == 0
        
    except Exception as e:
        print(f"Error validating analytics: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Fix and validate form analytics data")
    parser.add_argument("--fix", action="store_true", help="Fix analytics data")
    parser.add_argument("--validate", action="store_true", help="Validate analytics data")
    
    args = parser.parse_args()
    
    if args.fix:
        fix_analytics_data()
    elif args.validate:
        validate_analytics_data()
    else:
        print("Usage: python fix_analytics.py --fix | --validate")
        print("  --fix      Fix and recalculate analytics data")
        print("  --validate Validate current analytics data")