from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPBasicCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import requests
import json
from datetime import datetime, timedelta

from database import get_db
from chat_models import Question, Poll, PollResult, ChatAdmin
from auth import verify_password, get_password_hash, create_access_token

router = APIRouter()

# Pydantic models
class ChatLoginRequest(BaseModel):
    email: str
    password: Optional[str] = None

class ChatAdminLoginRequest(BaseModel):
    username: str
    password: str

class QuestionCreate(BaseModel):
    user_email: str
    question: str

class PollCreate(BaseModel):
    question: str
    options: List[str]

class PollResponse(BaseModel):
    poll_id: int
    user_email: str
    selected_option: str

def get_chat_admin_by_email(email: str, db: Session):
    from database import Admin
    return db.query(Admin).filter(Admin.email == email).first()

def get_chat_admin_by_username(username: str, db: Session):
    from database import Admin
    return db.query(Admin).filter(Admin.username == username).first()

def verify_user_with_external_api(email: str):
    try:
        response = requests.post(
            'https://leads.kambaaincorporation.in/api/query',
            json={"email": email},
            headers={
                'Content-Type': 'application/json',
                'Authorization': 'Basic cHJhdmVlbkBrYW1iYWEuY29tOjEyMzQ1Njc4'
            }
        )
        if response.status_code == 200:
            return {"success": True, "data": response.json()}
        return {"success": False, "error": "User not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.post("/chat/login")
def chat_login(login_data: ChatLoginRequest, db: Session = Depends(get_db)):
    email = login_data.email
    
    # Check if it's a chat admin in database
    admin = get_chat_admin_by_email(email, db)
    if admin:
        if not login_data.password:
            raise HTTPException(status_code=400, detail="Password required for admin login")
        
        if not verify_password(login_data.password, admin.hashed_password):
            raise HTTPException(status_code=401, detail="Incorrect username or password")
        
        # Determine role based on email
        role = "admin" if "admin" in email else "manager" if "manager" in email else "superadmin"
        
        # Create access token
        access_token = create_access_token(data={"sub": email, "role": role})
        return {
            "success": True,
            "role": role,
            "email": email,
            "access_token": access_token,
            "token_type": "bearer"
        }
    
    # For regular users, verify with external API
    api_result = verify_user_with_external_api(email)
    if not api_result["success"]:
        raise HTTPException(status_code=401, detail="User verification failed")
    
    return {
        "success": True,
        "role": "user",
        "email": email,
        "student": api_result["data"].get("data", {})
    }

@router.post("/chat/admin-login")
def chat_admin_login(login_data: ChatAdminLoginRequest, db: Session = Depends(get_db)):
    # Check if it's a chat admin in database by username
    admin = get_chat_admin_by_username(login_data.username, db)
    if not admin:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    if not verify_password(login_data.password, admin.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    # Determine role based on username/email
    role = "admin" if "admin" in admin.username else "manager" if "manager" in admin.username else "superadmin"
    
    # Create access token
    access_token = create_access_token(data={"sub": admin.email, "role": role})
    return {
        "success": True,
        "role": role,
        "email": admin.email,
        "username": admin.username,
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.get("/chat/questions")
def get_questions(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Question)
    if status:
        query = query.filter(Question.status == status)
    questions = query.order_by(Question.created_at.desc()).all()
    return questions

@router.post("/chat/questions")
def create_question(question_data: QuestionCreate, db: Session = Depends(get_db)):
    # Verify user with external API
    api_result = verify_user_with_external_api(question_data.user_email)
    user_data = api_result["data"].get("data", {}) if api_result["success"] else {}
    
    new_question = Question(
        user_email=question_data.user_email,
        user_name=user_data.get("name", ""),
        user_department=user_data.get("custom_fields", {}).get("course", ""),
        user_year=user_data.get("custom_fields", {}).get("yearSemester", ""),
        user_college=user_data.get("custom_fields", {}).get("collegeName", ""),
        question=question_data.question,
        status="pending"
    )
    
    db.add(new_question)
    db.commit()
    db.refresh(new_question)
    return new_question

@router.put("/chat/questions/{question_id}/status")
def update_question_status(question_id: int, status: str, db: Session = Depends(get_db)):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    question.status = status
    db.commit()
    return {"message": f"Question {status} successfully"}

@router.get("/chat/polls")
def get_active_polls(db: Session = Depends(get_db)):
    polls = db.query(Poll).filter(Poll.is_active == True).order_by(Poll.created_at.desc()).all()
    return polls

@router.post("/chat/polls")
def create_poll(poll_data: PollCreate, db: Session = Depends(get_db)):
    new_poll = Poll(
        question=poll_data.question,
        options=poll_data.options,
        responses=[],
        is_active=True
    )
    
    db.add(new_poll)
    db.commit()
    db.refresh(new_poll)
    return new_poll

@router.post("/chat/polls/respond")
def respond_to_poll(response_data: PollResponse, db: Session = Depends(get_db)):
    poll = db.query(Poll).filter(Poll.id == response_data.poll_id).first()
    if not poll or not poll.is_active:
        raise HTTPException(status_code=404, detail="Poll not found or inactive")
    
    # Check if user already voted
    responses = poll.responses or []
    has_voted = any(r.get("userEmail") == response_data.user_email for r in responses)
    
    if has_voted:
        raise HTTPException(status_code=400, detail="You have already voted on this poll")
    
    # Add response
    new_response = {
        "userEmail": response_data.user_email,
        "selectedOption": response_data.selected_option,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    responses.append(new_response)
    poll.responses = responses
    db.commit()
    
    return {"message": "Vote recorded successfully"}

@router.get("/chat/polls/{poll_id}/results")
def get_poll_results(poll_id: int, db: Session = Depends(get_db)):
    poll = db.query(Poll).filter(Poll.id == poll_id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    # Calculate vote counts
    vote_counts = {option: 0 for option in poll.options}
    for response in (poll.responses or []):
        option = response.get("selectedOption")
        if option in vote_counts:
            vote_counts[option] += 1
    
    return {
        "poll_id": poll_id,
        "question": poll.question,
        "vote_counts": vote_counts,
        "total_votes": len(poll.responses or [])
    }