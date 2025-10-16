from sqlalchemy import create_engine

DATABASE_URL = "mysql+pymysql://root@localhost:3306/students_db"

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print("✅ Database connection successful!")
except Exception as e:
    print("❌ Database connection failed:", e)
