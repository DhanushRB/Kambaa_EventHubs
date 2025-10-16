from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from database import Base

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String(255))
    user_name = Column(String(255))
    user_department = Column(String(255))
    user_year = Column(String(100))
    user_college = Column(String(255))
    question = Column(Text)
    status = Column(String(20), default='pending')  # pending, approved, rejected
    answer = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class Poll(Base):
    __tablename__ = "polls"
    
    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text)
    options = Column(JSON)  # Store as JSON array
    responses = Column(JSON, default=list)  # Store responses as JSON
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class PollResult(Base):
    __tablename__ = "poll_results"
    
    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text)
    options = Column(JSON)  # [{option: str, vote_count: int}]
    total_votes = Column(Integer)
    created_at = Column(DateTime)
    completed_at = Column(DateTime, default=datetime.utcnow)

class ChatAdmin(Base):
    __tablename__ = "chat_admins"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True)
    password_hash = Column(String(255))
    role = Column(String(50))  # admin, manager, superadmin
    created_at = Column(DateTime, default=datetime.utcnow)