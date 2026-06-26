import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database.database import Base

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=True)
    full_name = Column(String(255), nullable=True)
    email = Column(String(255), unique=True, nullable=True)
    phone_number = Column(String(50), unique=True, nullable=True)
    password_hash = Column(String(255), nullable=True)
    google_id = Column(String(255), unique=True, nullable=True)
    profile_picture = Column(String(500), nullable=True)
    login_method = Column(String(50), default='credentials') # 'credentials' or 'google'
    account_status = Column(String(50), default='active')     # 'active', 'suspended', etc.
    
    # Extra Profile Fields for full patient metadata support
    blood_group = Column(String(50), nullable=True)
    dob = Column(String(100), nullable=True)
    height_weight = Column(String(100), nullable=True)
    patient_id = Column(String(100), nullable=True)

    created_date = Column(DateTime, default=datetime.datetime.utcnow)
    updated_date = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    # Relationships
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    login_histories = relationship("LoginHistory", back_populates="user", cascade="all, delete-orphan")
    predictions = relationship("PredictionHistory", back_populates="user", cascade="all, delete-orphan")


class LoginHistory(Base):
    __tablename__ = 'login_histories'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    login_time = Column(DateTime, default=datetime.datetime.utcnow)
    logout_time = Column(DateTime, nullable=True)
    ip_address = Column(String(50), nullable=True)
    browser = Column(String(255), nullable=True)
    operating_system = Column(String(255), nullable=True)
    device_type = Column(String(100), nullable=True)
    login_method = Column(String(50), nullable=False) # 'credentials' or 'google'

    # Relationships
    user = relationship("User", back_populates="login_histories")


class PredictionHistory(Base):
    __tablename__ = 'prediction_histories'

    id = Column(String(100), primary_key=True) # e.g. "DS-xxx"
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    prediction_date = Column(String(100), nullable=False) # Store formatted string like "June 26, 2026, 10:45 AM"
    age = Column(Integer, nullable=False)
    gender = Column(String(50), nullable=False)
    height = Column(Float, nullable=False)
    weight = Column(Float, nullable=False)
    bmi = Column(Float, nullable=False)
    blood_sugar = Column(Float, nullable=False) # Fasting plasma glucose
    hba1c = Column(Float, nullable=False)
    blood_pressure = Column(String(50), nullable=False) # "systolic/diastolic"
    health_history = Column(String(1000), nullable=False) # JSON-serialized list of health history conditions
    lifestyle_factors = Column(String(1000), nullable=False) # JSON-serialized list of lifestyle factors
    uploaded_report_name = Column(String(255), nullable=True) # Uploaded filename
    prediction_percentage = Column(Float, nullable=False)
    risk_category = Column(String(50), nullable=False) # "Low", "Moderate", "High"
    prediction_result = Column(String(100), nullable=False) # e.g. "No Diabetes", "Pre-Diabetes", "Diabetes"
    recommendation = Column(String(2000), nullable=False) # JSON-serialized list of recommendations

    # Relationships
    user = relationship("User", back_populates="predictions")


class Session(Base):
    __tablename__ = 'sessions'

    session_token = Column(String(255), primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    last_activity = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    remember_me = Column(Boolean, default=False)

    # Relationships
    user = relationship("User", back_populates="sessions")
