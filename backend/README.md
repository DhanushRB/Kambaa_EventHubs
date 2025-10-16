# Backend Setup Instructions

## Prerequisites

1. Python 3.8 or higher
2. XAMPP with MySQL running
3. pip (Python package installer)

## Setup Steps

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Database Setup

1. Start XAMPP and ensure MySQL is running
2. Open phpMyAdmin (http://localhost/phpmyadmin)
3. Import the `setup_database.sql` file or run the SQL commands manually
4. This will create:
   - Database: `students_db`
   - Table: `admins`
   - Default admin user with credentials:
     - Username: `admin`
     - Password: `admin123`
     - Email: `admin@dashboard.com`

### 3. Environment Configuration

The `.env` file is already configured for local development:

- Database URL: `mysql+pymysql://root:@localhost:3306/students_db`
- JWT Secret: Change this in production
- Token expiry: 30 minutes

### 4. Start the Backend Server

```bash
python main.py
```

The API will be available at: http://localhost:8000

### 5. API Endpoints

- `POST /api/auth/login` - Login with username/password
- `GET /api/auth/me` - Get current user info (requires token)
- `POST /api/auth/create-admin` - Create new admin user

### 6. Test the Setup

You can test the login API using:

```bash
curl -X POST "http://localhost:8000/api/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"username": "admin", "password": "admin123"}'
```

## Default Admin Credentials

- **Username**: admin
- **Password**: admin123
- **Email**: admin@dashboard.com

## Frontend Integration

The React frontend is configured to connect to this backend at `http://localhost:8000`.
