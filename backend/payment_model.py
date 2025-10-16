from sqlalchemy import Column, String, Integer, DECIMAL, DateTime, Enum, ForeignKey, TIMESTAMP
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base

class PaymentStatus(enum.Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"
    refunded = "refunded"

class PaymentMode(enum.Enum):
    razorpay = "razorpay"
    upi = "upi"
    net_banking = "net_banking"
    credit_card = "credit_card"
    debit_card = "debit_card"

class Payment(Base):
    __tablename__ = "payment_records"
    
    payment_id = Column(String(50), primary_key=True)
    user_id = Column(Integer, nullable=False)
    user_email = Column(String(100), nullable=False)
    amount = Column(DECIMAL(10, 2), nullable=False)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.pending)
    payment_date = Column(DateTime)
    transaction_id = Column(String(100), unique=True)
    mode_of_payment = Column(Enum(PaymentMode), nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)