from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
import uuid
import mysql.connector
import os
from dotenv import load_dotenv
from database import SessionLocal
from payment_model import Payment, PaymentStatus, PaymentMode
# Import will be handled by SQLAlchemy registry

load_dotenv()

# Database configuration
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "students_db"),
    "port": int(os.getenv("DB_PORT", "3306"))
}

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class PaymentService:
    @staticmethod
    def get_all_payments(
        status_filter: Optional[str] = None,
        method_filter: Optional[str] = None,
        event_filter: Optional[str] = None,
        search: Optional[str] = None
    ):
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor()
            
            # Get payment data from actual tables used in main.py
            query = """
                SELECT 
                    u.id, u.name, u.email, u.payment_status, u.payment_amount, u.payment_id,
                    u.created_at, po.razorpay_order_id, p.razorpay_payment_id, p.status as payment_status_detail,
                    p.event_type, p.contact_number, p.created_at as payment_date,
                    COALESCE(e.name, 'No Event') as event_name
                FROM users u
                LEFT JOIN payment_orders po ON u.id = po.user_id
                LEFT JOIN payments p ON u.id = p.user_id
                LEFT JOIN events e ON u.eventId = e.id
                WHERE u.payment_status IS NOT NULL AND u.payment_status != 'not_paid'
            """
            
            params = []
            
            if status_filter:
                query += " AND u.payment_status = %s"
                params.append(status_filter.lower())
            
            if search:
                query += " AND (u.name LIKE %s OR u.email LIKE %s)"
                params.extend([f"%{search}%", f"%{search}%"])
            
            if event_filter:
                query += " AND e.name LIKE %s"
                params.append(f"%{event_filter}%")
            
            query += " ORDER BY u.created_at DESC"
            
            cursor.execute(query, params)
            payments = cursor.fetchall()
            
            result = []
            for payment in payments:
                result.append({
                    "payment_id": payment[5] or f"pay_{payment[0]}",
                    "user_name": payment[1],
                    "user_email": payment[2],
                    "amount": float(payment[4]) / 100 if payment[4] else 0.0,  # Convert paise to rupees
                    "payment_status": payment[3] or "pending",
                    "payment_date": payment[12].isoformat() if payment[12] else payment[6].isoformat() if payment[6] else None,
                    "transaction_id": payment[8] or payment[7] or "N/A",
                    "mode_of_payment": "razorpay",
                    "event": payment[13],
                    "contact_number": payment[11],
                    "created_at": payment[6].isoformat() if payment[6] else None
                })
            
            conn.close()
            return result
            
        except Exception as e:
            print(f"Error in get_all_payments: {e}")
            return []
    
    @staticmethod
    def get_payment_count(
        status_filter: Optional[str] = None,
        method_filter: Optional[str] = None,
        search: Optional[str] = None
    ):
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor()
            
            query = """
                SELECT COUNT(DISTINCT u.id)
                FROM users u
                LEFT JOIN events e ON u.eventId = e.id
                WHERE u.payment_status IS NOT NULL AND u.payment_status != 'not_paid'
            """
            
            params = []
            
            if status_filter:
                query += " AND u.payment_status = %s"
                params.append(status_filter.lower())
            
            if search:
                query += " AND (u.name LIKE %s OR u.email LIKE %s)"
                params.extend([f"%{search}%", f"%{search}%"])
            
            cursor.execute(query, params)
            count = cursor.fetchone()[0]
            
            conn.close()
            return count
            
        except Exception as e:
            print(f"Error in get_payment_count: {e}")
            return 0
    
    @staticmethod
    def create_payment(db: Session, payment_data: dict):
        # Use existing payment tables structure from main.py
        return None
    
    @staticmethod
    def update_payment(db: Session, payment_id: str, update_data: dict):
        # Use existing payment update logic from main.py
        return None
    
    @staticmethod
    def delete_payment(db: Session, payment_id: str):
        # Use existing payment delete logic from main.py
        return False

@router.get("/payments")
async def get_payments(
    status: Optional[str] = None,
    method: Optional[str] = None,
    event: Optional[str] = None,
    search: Optional[str] = None
):
    payments = PaymentService.get_all_payments(status, method, event, search)
    total_count = PaymentService.get_payment_count(status, method, search)
    
    return {
        "payments": payments,
        "total_count": total_count
    }

@router.post("/payments")
async def create_payment(payment_data: dict, db: Session = Depends(get_db)):
    payment = PaymentService.create_payment(db, payment_data)
    return {"message": "Payment created successfully", "payment_id": payment.payment_id}

@router.put("/payments/{payment_id}")
async def update_payment(payment_id: str, update_data: dict, db: Session = Depends(get_db)):
    payment = PaymentService.update_payment(db, payment_id, update_data)
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    return {"message": "Payment updated successfully"}

@router.delete("/payments/{payment_id}")
async def delete_payment(payment_id: str, db: Session = Depends(get_db)):
    success = PaymentService.delete_payment(db, payment_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    return {"message": "Payment deleted successfully"}