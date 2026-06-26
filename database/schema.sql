-- DDL Schema definition for PostgreSQL database
-- Diabetes Prediction project Database Schema

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE,
    full_name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    profile_picture VARCHAR(500),
    login_method VARCHAR(50) DEFAULT 'credentials',
    account_status VARCHAR(50) DEFAULT 'active',
    blood_group VARCHAR(50),
    dob VARCHAR(100),
    height_weight VARCHAR(100),
    patient_id VARCHAR(100),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- 2. Create Login History Table
CREATE TABLE IF NOT EXISTS login_histories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP,
    ip_address VARCHAR(50),
    browser VARCHAR(255),
    operating_system VARCHAR(255),
    device_type VARCHAR(100),
    login_method VARCHAR(50) NOT NULL
);

-- 3. Create Prediction History Table
CREATE TABLE IF NOT EXISTS prediction_histories (
    id VARCHAR(100) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prediction_date VARCHAR(100) NOT NULL,
    age INTEGER NOT NULL,
    gender VARCHAR(50) NOT NULL,
    height DOUBLE PRECISION NOT NULL,
    weight DOUBLE PRECISION NOT NULL,
    bmi DOUBLE PRECISION NOT NULL,
    blood_sugar DOUBLE PRECISION NOT NULL,
    hba1c DOUBLE PRECISION NOT NULL,
    blood_pressure VARCHAR(50) NOT NULL,
    health_history VARCHAR(1000) NOT NULL,    -- JSON-serialized list
    lifestyle_factors VARCHAR(1000) NOT NULL, -- JSON-serialized list
    uploaded_report_name VARCHAR(255),
    prediction_percentage DOUBLE PRECISION NOT NULL,
    risk_category VARCHAR(50) NOT NULL,
    prediction_result VARCHAR(100) NOT NULL,
    recommendation VARCHAR(2000) NOT NULL     -- JSON-serialized list
);

-- 4. Create Sessions Table for Remember Me & Session management
CREATE TABLE IF NOT EXISTS sessions (
    session_token VARCHAR(255) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    remember_me BOOLEAN DEFAULT FALSE
);

-- Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_google ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_histories(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_user ON prediction_histories(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
