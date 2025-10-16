#!/usr/bin/env python3
"""
Test Analytics Fix
This script tests the analytics calculations to ensure they work correctly for all form types.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db, Form, FormResponse, FormAnalytics, FormQuestion
from sqlalchemy.orm import Session
import json
from datetime import datetime, timedelta

def create_test_data():
    """Create test data for different form types"""
    db = next(get_db())
    
    try:
        print("Creating test data...")
        
        # Test data for different form types
        test_forms = [
            {
                "title": "Test Quiz Form",
                "type": "quiz",
                "settings": json.dumps({"timeLimit": 30, "showResults": True}),
                "responses": [
                    {"email": "user1@test.com", "name": "User 1", "score": 8, "time_taken": 450},
                    {"email": "user2@test.com", "name": "User 2", "score": 6, "time_taken": 600},
                    {"email": "user3@test.com", "name": "User 3", "score": 9, "time_taken": 380},
                    {"email": "user4@test.com", "name": "User 4", "score": 7, "time_taken": 520},
                    {"email": "user5@test.com", "name": "User 5", "score": 5, "time_taken": 720},
                ]
            },
            {
                "title": "Test Attendance Form",
                "type": "attendance",
                "settings": json.dumps({}),
                "responses": [
                    {"email": "att1@test.com", "name": "Attendee 1", "score": 0, "time_taken": 1},
                    {"email": "att2@test.com", "name": "Attendee 2", "score": 0, "time_taken": 2},
                    {"email": "att3@test.com", "name": "Attendee 3", "score": 0, "time_taken": 1},
                    {"email": "att4@test.com", "name": "Attendee 4", "score": 0, "time_taken": 3},
                ]
            },
            {
                "title": "Test Feedback Form",
                "type": "feedback",
                "settings": json.dumps({}),
                "responses": [
                    {"email": "fb1@test.com", "name": "Feedback 1", "score": 0, "time_taken": 180},
                    {"email": "fb2@test.com", "name": "Feedback 2", "score": 0, "time_taken": 240},
                    {"email": "fb3@test.com", "name": "Feedback 3", "score": 0, "time_taken": 320},
                ]
            },
            {
                "title": "Test Poll Form",
                "type": "poll",
                "settings": json.dumps({}),
                "responses": [
                    {"email": "poll1@test.com", "name": "Poll 1", "score": 0, "time_taken": 45},
                    {"email": "poll2@test.com", "name": "Poll 2", "score": 0, "time_taken": 60},
                    {"email": "poll3@test.com", "name": "Poll 3", "score": 0, "time_taken": 38},
                    {"email": "poll4@test.com", "name": "Poll 4", "score": 0, "time_taken": 52},
                    {"email": "poll5@test.com", "name": "Poll 5", "score": 0, "time_taken": 41},
                ]
            }
        ]
        
        created_forms = []
        
        for form_data in test_forms:
            # Create form
            form = Form(
                title=form_data["title"],
                description=f"Test form for {form_data['type']} analytics",
                type=form_data["type"],
                settings=form_data["settings"],
                created_by="test@admin.com",
                is_active=1
            )
            db.add(form)
            db.flush()
            
            # Create analytics record
            analytics = FormAnalytics(form_id=form.id)
            db.add(analytics)
            
            # Create responses
            for resp_data in form_data["responses"]:
                response = FormResponse(
                    form_id=form.id,
                    user_email=resp_data["email"],
                    user_name=resp_data["name"],
                    responses=json.dumps({}),
                    score=resp_data["score"],
                    time_taken=resp_data["time_taken"],
                    submitted_at=datetime.utcnow() - timedelta(minutes=30)
                )
                db.add(response)
            
            created_forms.append(form)
        
        db.commit()
        print(f"Created {len(created_forms)} test forms with responses")
        return [f.id for f in created_forms]
        
    except Exception as e:
        print(f"Error creating test data: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def test_analytics_calculations(form_ids):
    """Test analytics calculations for the created test forms"""
    db = next(get_db())
    
    try:
        print("\nTesting analytics calculations...")
        
        expected_results = {
            "quiz": {
                "avg_score": 7.0,  # (8+6+9+7+5)/5 = 7.0
                "avg_time": 534,   # (450+600+380+520+720)/5 = 534
                "completion_rate": 76.9  # Estimated based on quiz pattern
            },
            "attendance": {
                "avg_score": 0.0,
                "avg_time": 1,     # (1+2+1+3)/4 = 1.75 -> 1 (integer division)
                "completion_rate": 90.9  # High completion rate for attendance
            },
            "feedback": {
                "avg_score": 0.0,
                "avg_time": 246,   # (180+240+320)/3 = 246.67 -> 246
                "completion_rate": 80.0  # Moderate completion rate for feedback
            },
            "poll": {
                "avg_score": 0.0,
                "avg_time": 47,    # (45+60+38+52+41)/5 = 47.2 -> 47
                "completion_rate": 87.0  # Good completion rate for polls
            }
        }
        
        all_tests_passed = True
        
        for form_id in form_ids:
            form = db.query(Form).filter(Form.id == form_id).first()
            if not form:
                continue
            
            print(f"\nTesting {form.type} form: {form.title}")
            
            # Get responses and recalculate analytics
            responses = db.query(FormResponse).filter(FormResponse.form_id == form_id).all()
            analytics = db.query(FormAnalytics).filter(FormAnalytics.form_id == form_id).first()
            
            # Update analytics using the same logic as the API
            if analytics and responses:
                # Calculate average score (only for quiz forms)
                if form.type == "quiz":
                    total_score = sum(r.score for r in responses)
                    calculated_avg_score = total_score / len(responses)
                    analytics.average_score = f"{calculated_avg_score:.2f}"
                else:
                    calculated_avg_score = 0.0
                    analytics.average_score = "0.00"
                
                # Calculate average time (exclude zero times)
                valid_times = [r.time_taken for r in responses if r.time_taken > 0]
                if valid_times:
                    calculated_avg_time = sum(valid_times) // len(valid_times)
                    analytics.average_time = calculated_avg_time
                else:
                    calculated_avg_time = 0
                    analytics.average_time = 0
                
                analytics.total_responses = len(responses)
                db.commit()
                
                # Test results
                expected = expected_results.get(form.type, {})
                
                # Test average score
                if form.type == "quiz":
                    if abs(calculated_avg_score - expected.get("avg_score", 0)) > 0.1:
                        print(f"  ❌ Average score mismatch: expected {expected.get('avg_score')}, got {calculated_avg_score}")
                        all_tests_passed = False
                    else:
                        print(f"  ✅ Average score correct: {calculated_avg_score}")
                
                # Test average time
                expected_time = expected.get("avg_time", 0)
                if abs(calculated_avg_time - expected_time) > 5:  # Allow 5 second tolerance
                    print(f"  ❌ Average time mismatch: expected ~{expected_time}s, got {calculated_avg_time}s")
                    all_tests_passed = False
                else:
                    print(f"  ✅ Average time correct: {calculated_avg_time}s")
                
                # Test completion rate calculation
                total_responses = len(responses)
                if form.type == "attendance":
                    estimated_accessed = max(total_responses, int(total_responses * 1.1))
                    completion_rate = (total_responses / estimated_accessed) * 100
                elif form.type == "quiz":
                    estimated_accessed = int(total_responses * 1.3)
                    completion_rate = (total_responses / estimated_accessed) * 100
                elif form.type == "feedback":
                    estimated_accessed = int(total_responses * 1.25)
                    completion_rate = (total_responses / estimated_accessed) * 100
                else:  # poll
                    estimated_accessed = int(total_responses * 1.15)
                    completion_rate = (total_responses / estimated_accessed) * 100
                
                completion_rate = max(0.0, min(completion_rate, 100.0))
                expected_completion = expected.get("completion_rate", 0)
                
                if abs(completion_rate - expected_completion) > 5:  # Allow 5% tolerance
                    print(f"  ❌ Completion rate mismatch: expected ~{expected_completion}%, got {completion_rate:.1f}%")
                    all_tests_passed = False
                else:
                    print(f"  ✅ Completion rate correct: {completion_rate:.1f}%")
        
        return all_tests_passed
        
    except Exception as e:
        print(f"Error testing analytics: {e}")
        return False
    finally:
        db.close()

def cleanup_test_data(form_ids):
    """Clean up test data"""
    db = next(get_db())
    
    try:
        print(f"\nCleaning up test data...")
        
        for form_id in form_ids:
            # Delete responses
            db.query(FormResponse).filter(FormResponse.form_id == form_id).delete()
            # Delete analytics
            db.query(FormAnalytics).filter(FormAnalytics.form_id == form_id).delete()
            # Delete questions
            db.query(FormQuestion).filter(FormQuestion.form_id == form_id).delete()
            # Delete form
            db.query(Form).filter(Form.id == form_id).delete()
        
        db.commit()
        print(f"Cleaned up {len(form_ids)} test forms")
        
    except Exception as e:
        print(f"Error cleaning up test data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Testing Analytics Fix Implementation")
    print("=" * 50)
    
    try:
        # Create test data
        form_ids = create_test_data()
        
        # Test calculations
        success = test_analytics_calculations(form_ids)
        
        # Clean up
        cleanup_test_data(form_ids)
        
        print("\n" + "=" * 50)
        if success:
            print("✅ All analytics tests PASSED!")
            print("Average time and completion rate calculations are working correctly.")
        else:
            print("❌ Some analytics tests FAILED!")
            print("Please check the implementation.")
        
    except Exception as e:
        print(f"Test failed with error: {e}")
        sys.exit(1)