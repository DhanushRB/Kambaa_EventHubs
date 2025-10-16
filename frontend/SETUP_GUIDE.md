# Material Dashboard with Authentication - Setup Guide

## Project Overview

This project combines a React Material Dashboard frontend with a FastAPI backend for authentication.

## Quick Start

### 1. Database Setup (XAMPP)

1. Start XAMPP and ensure MySQL is running
2. Open phpMyAdmin (http://localhost/phpmyadmin)
3. Run the SQL commands from `backend/setup_database.sql`:
   ```sql
   CREATE DATABASE IF NOT EXISTS students_db;
   USE students_db;
   CREATE TABLE IF NOT EXISTS admins (
       id INT AUTO_INCREMENT PRIMARY KEY,
       username VARCHAR(50) UNIQUE NOT NULL,
       email VARCHAR(100) UNIQUE NOT NULL,
       hashed_password VARCHAR(255) NOT NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   INSERT INTO admins (username, email, hashed_password)
   VALUES ('admin', 'admin@dashboard.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXwtO5S5vy/S');
   ```

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
python main.py
```

Backend will run on: http://localhost:8000

### 3. Frontend Setup

```bash
# In the root directory
npm install
npm start
```

Frontend will run on: http://localhost:3000

## Default Login Credentials

- **Username**: admin
- **Password**: admin123

## Features Implemented

### Authentication Flow

1. **Login Required**: Users must login before accessing the dashboard
2. **Protected Routes**: All dashboard routes are protected
3. **JWT Authentication**: Secure token-based authentication
4. **Auto Redirect**: Unauthenticated users are redirected to login
5. **Logout Functionality**: Users can logout from the navbar

### Frontend Changes

- ✅ Removed Sign In/Sign Up from sidebar navigation
- ✅ Added authentication context for state management
- ✅ Implemented protected routes
- ✅ Updated login page with real authentication
- ✅ Added logout functionality to navbar
- ✅ Login page appears first, then redirects to dashboard

### Backend Features

- ✅ FastAPI with JWT authentication
- ✅ MySQL database integration
- ✅ Password hashing with bcrypt
- ✅ CORS enabled for React frontend
- ✅ Admin user management
- ✅ Token validation middleware

## File Structure

```
├── backend/
│   ├── main.py              # FastAPI application
│   ├── database.py          # Database models and connection
│   ├── auth.py              # Authentication utilities
│   ├── requirements.txt     # Python dependencies
│   ├── .env                 # Environment variables
│   ├── setup_database.sql   # Database setup script
│   └── start_server.bat     # Windows startup script
├── src/
│   ├── context/
│   │   └── AuthContext.js   # Authentication context
│   ├── components/
│   │   └── ProtectedRoute.js # Route protection component
│   ├── layouts/
│   │   └── authentication/
│   │       └── sign-in/     # Updated login page
│   └── App.js               # Updated with auth integration
└── package.json
```

## API Endpoints

- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/create-admin` - Create admin user

## Next Steps

1. Start XAMPP MySQL
2. Run the database setup script
3. Start the backend server
4. Start the React frontend
5. Login with admin/admin123
6. Access the dashboard

## Troubleshooting

- Ensure XAMPP MySQL is running on port 3306
- Check that both servers are running (backend:8000, frontend:3000)
- Verify database connection in backend/.env
- Check browser console for any CORS or network errors
