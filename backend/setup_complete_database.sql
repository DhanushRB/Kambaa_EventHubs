-- Create database
CREATE DATABASE IF NOT EXISTS students_db;

-- Use the database
USE students_db;

-- Create admins table with role column
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    hashed_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create events table with qa_active column
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    event_date VARCHAR(50) NOT NULL,
    qa_active INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    primary_email VARCHAR(255),
    college_name VARCHAR(255),
    year_semester VARCHAR(100),
    course VARCHAR(255),
    specify_course VARCHAR(255),
    how_did_you_hear VARCHAR(255),
    referral_email VARCHAR(255),
    user_type VARCHAR(50),
    is_current_student VARCHAR(10),
    registration_id VARCHAR(100),
    gender VARCHAR(20),
    agree_to_terms VARCHAR(10),
    project VARCHAR(255),
    form_name VARCHAR(255),
    email_verified INT DEFAULT 0,
    eventId INT,
    utm_source VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    college VARCHAR(255),
    event_id INT,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create email settings table
CREATE TABLE IF NOT EXISTS email_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    smtp_server VARCHAR(255),
    smtp_port INT,
    smtp_username VARCHAR(255),
    smtp_password VARCHAR(255),
    from_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create email templates table
CREATE TABLE IF NOT EXISTS email_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content TEXT,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create forms table
CREATE TABLE IF NOT EXISTS forms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL,
    event_id INT,
    settings VARCHAR(2000),
    register_link VARCHAR(500),
    is_active INT DEFAULT 1,
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create form questions table
CREATE TABLE IF NOT EXISTS form_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    form_id INT NOT NULL,
    question_text VARCHAR(1000) NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    options VARCHAR(2000),
    is_required INT DEFAULT 0,
    points INT DEFAULT 0,
    correct_answer VARCHAR(255),
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create form responses table
CREATE TABLE IF NOT EXISTS form_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    form_id INT NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    responses VARCHAR(5000) NOT NULL,
    score INT DEFAULT 0,
    time_taken INT DEFAULT 0,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create form analytics table
CREATE TABLE IF NOT EXISTS form_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    form_id INT NOT NULL,
    total_responses INT DEFAULT 0,
    average_score VARCHAR(10) DEFAULT '0.00',
    average_time INT DEFAULT 0,
    completion_rate VARCHAR(10) DEFAULT '0.00',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create QA questions table
CREATE TABLE IF NOT EXISTS qa_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT,
    user_email VARCHAR(255),
    user_name VARCHAR(255),
    registration_id VARCHAR(100),
    question VARCHAR(2000),
    status VARCHAR(20) DEFAULT 'pending',
    manager_approved_at DATETIME,
    admin_action VARCHAR(20),
    admin_response VARCHAR(2000),
    admin_action_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user question counts table
CREATE TABLE IF NOT EXISTS user_question_counts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT,
    user_email VARCHAR(255),
    user_name VARCHAR(255),
    approved_questions INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);