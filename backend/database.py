from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv
import pymysql

# Install PyMySQL as MySQLdb
pymysql.install_as_MySQLdb()

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Admin(Base):
    __tablename__ = "admins"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True)
    role = Column(String(20), default="admin")  # admin or manager
    hashed_password = Column(String(255))
    created_at = Column(DateTime, default=datetime.now)

class Event(Base):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255))
    slug = Column(String(255), unique=True)
    event_date = Column(String(50))
    qa_active = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.now)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255))
    first_name = Column(String(255))
    last_name = Column(String(255))
    email = Column(String(255))
    phone_number = Column(String(20))
    primary_email = Column(String(255))
    college_name = Column(String(255))
    year_semester = Column(String(100))
    course = Column(String(255))
    specify_course = Column(String(255))
    how_did_you_hear = Column(String(255))
    referral_email = Column(String(255))
    user_type = Column(String(50))
    is_current_student = Column(String(10))
    registration_id = Column(String(100))
    gender = Column(String(20))
    agree_to_terms = Column(String(10))
    project = Column(String(255))
    form_name = Column(String(255))
    email_verified = Column(Integer)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    eventId = Column(Integer)
    utm_source = Column(String(255))

class Student(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255))
    email = Column(String(255))
    phone = Column(String(20))
    college = Column(String(255))
    event_id = Column(Integer)
    registered_at = Column(DateTime, default=datetime.now)

class EmailSettings(Base):
    __tablename__ = "email_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    smtp_server = Column(String(255))
    smtp_port = Column(Integer)
    smtp_username = Column(String(255))
    smtp_password = Column(String(255))
    from_email = Column(String(255))
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

class EmailTemplate(Base):
    __tablename__ = "email_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255))
    subject = Column(String(255))
    content = Column(String(10000))
    created_at = Column(DateTime, default=datetime.now)
    created_by = Column(String(50))

class Form(Base):
    __tablename__ = "forms"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255))
    description = Column(String(1000))
    type = Column(String(20))  # quiz, poll, feedback, attendance
    event_id = Column(Integer)
    settings = Column(String(2000))  # JSON string
    register_link = Column(String(500))  # Registration link for attendance forms
    is_active = Column(Integer, default=1)
    created_by = Column(String(50))
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

class FormQuestion(Base):
    __tablename__ = "form_questions"
    
    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer)
    question_text = Column(String(1000))
    question_type = Column(String(50))  # multiple_choice, single_choice, text, rating, yes_no
    options = Column(String(2000))  # JSON string
    is_required = Column(Integer, default=0)
    points = Column(Integer, default=0)
    correct_answer = Column(String(255))
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.now)

class FormResponse(Base):
    __tablename__ = "form_responses"
    
    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer)
    user_email = Column(String(255))
    user_name = Column(String(255))
    responses = Column(String(5000))  # JSON string
    score = Column(Integer, default=0)
    time_taken = Column(Integer, default=0)
    submitted_at = Column(DateTime, default=datetime.now)

class FormAnalytics(Base):
    __tablename__ = "form_analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer)
    total_responses = Column(Integer, default=0)
    average_score = Column(String(10), default="0.00")
    average_time = Column(Integer, default=0)
    completion_rate = Column(String(10), default="0.00")
    last_updated = Column(DateTime, default=datetime.now, onupdate=datetime.now)

class QAQuestion(Base):
    __tablename__ = "qa_questions"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer)
    user_email = Column(String(255))
    user_name = Column(String(255))
    registration_id = Column(String(100))
    question = Column(String(2000))
    status = Column(String(20), default="pending")  # pending, manager_approved, answered, skipped, rejected
    manager_approved_at = Column(DateTime)
    admin_action = Column(String(20))  # answered, skipped, rejected
    admin_response = Column(String(2000))
    admin_action_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.now)

class UserQuestionCount(Base):
    __tablename__ = "user_question_counts"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer)
    user_email = Column(String(255))
    user_name = Column(String(255))
    approved_questions = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

class OTP(Base):
    __tablename__ = "otps"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255))
    otp_code = Column(String(6))
    expires_at = Column(DateTime)
    is_used = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.now)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String(255))
    user_name = Column(String(255))
    user_role = Column(String(20))  # admin, manager
    action = Column(String(100))  # create_form, edit_form, delete_form, view_form, etc.
    resource_type = Column(String(50))  # form, event, user, email_template, etc.
    resource_id = Column(String(100))  # ID of the affected resource
    details = Column(String(2000))  # JSON string with additional details
    ip_address = Column(String(45))
    created_at = Column(DateTime, default=datetime.now)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    # Import Payment model to ensure it's included in table creation
    from payment_model import Payment
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")