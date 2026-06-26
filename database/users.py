import datetime
from sqlalchemy.orm import Session
from database.models import User
from database.auth import hash_password, verify_password

def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    if not email:
        return None
    return db.query(User).filter(User.email.ilike(email)).first()

def get_user_by_phone(db: Session, phone_number: str):
    if not phone_number:
        return None
    return db.query(User).filter(User.phone_number == phone_number).first()

def get_user_by_username(db: Session, username: str):
    if not username:
        return None
    return db.query(User).filter(User.username.ilike(username)).first()

def get_user_by_google_id(db: Session, google_id: str):
    if not google_id:
        return None
    return db.query(User).filter(User.google_id == google_id).first()

def create_user_with_credentials(db: Session, username: str, email: str, phone: str, password: str) -> User:
    """Create a new user account with credentials (email/phone + password)."""
    # Normalize phone: optional, store as None if empty, "None", or "0"
    cleaned_phone = None
    if phone:
        phone_str = str(phone).strip()
        if phone_str and phone_str.lower() != "none" and phone_str != "0":
            cleaned_phone = phone_str

    # Check if user already exists (by email, phone, or username)
    if email and get_user_by_email(db, email):
        raise ValueError("Email already registered.")
    if cleaned_phone and get_user_by_phone(db, cleaned_phone):
        raise ValueError("Phone number already registered.")
    if username and get_user_by_username(db, username):
        raise ValueError("Username already exists.")

    pass_hash = hash_password(password)
    user = User(
        username=username,
        email=email,
        phone_number=cleaned_phone,
        password_hash=pass_hash,
        login_method='credentials',
        created_date=datetime.datetime.utcnow(),
        updated_date=datetime.datetime.utcnow()
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def create_or_update_google_user(db: Session, google_id: str, email: str, full_name: str, profile_picture: str) -> User:
    """Find a user by google_id or email, or create a new one."""
    user = get_user_by_google_id(db, google_id)
    
    if not user and email:
        # Fallback to check if a user with the same email already exists (e.g. registered via email/password)
        user = get_user_by_email(db, email)
        if user:
            # Link Google account to existing user
            user.google_id = google_id
            if not user.full_name:
                user.full_name = full_name
            if not user.profile_picture:
                user.profile_picture = profile_picture
            user.login_method = 'google'
            user.last_login = datetime.datetime.utcnow()
            db.commit()
            db.refresh(user)
            return user

    if not user:
        # Create brand new user
        # Generate a unique username based on full name or email
        base_username = full_name.lower().replace(" ", "_") if full_name else email.split("@")[0]
        username = base_username
        counter = 1
        while get_user_by_username(db, username):
            username = f"{base_username}_{counter}"
            counter += 1

        user = User(
            google_id=google_id,
            username=username,
            full_name=full_name,
            email=email,
            profile_picture=profile_picture,
            login_method='google',
            created_date=datetime.datetime.utcnow(),
            last_login=datetime.datetime.utcnow()
        )
        db.add(user)
    else:
        # Update existing Google user profile picture/full name if they changed
        user.full_name = full_name or user.full_name
        user.profile_picture = profile_picture or user.profile_picture
        user.last_login = datetime.datetime.utcnow()
        user.login_method = 'google'
    
    db.commit()
    db.refresh(user)
    return user

def update_user_profile(db: Session, user_id: int, updated_data: dict) -> User:
    """Modify user profile details like full name, phone, etc."""
    user = get_user_by_id(db, user_id)
    if not user:
        raise ValueError("User not found.")

    if 'full_name' in updated_data:
        user.full_name = updated_data['full_name']
    if 'username' in updated_data:
        new_username = updated_data['username']
        # If changed, ensure unique
        if new_username != user.username:
            existing = get_user_by_username(db, new_username)
            if existing:
                raise ValueError("Username already taken.")
            user.username = new_username
    if 'phone_number' in updated_data:
        new_phone = updated_data['phone_number']
        if new_phone != user.phone_number:
            existing = get_user_by_phone(db, new_phone)
            if existing:
                raise ValueError("Phone number already associated with another account.")
            user.phone_number = new_phone
    if 'email' in updated_data:
        new_email = updated_data['email']
        if new_email != user.email:
            existing = get_user_by_email(db, new_email)
            if existing:
                raise ValueError("Email already associated with another account.")
            user.email = new_email
    if 'profile_picture' in updated_data:
        user.profile_picture = updated_data['profile_picture']
        
    # Handle optional extra profile fields
    if 'blood_group' in updated_data:
        user.blood_group = updated_data['blood_group']
    if 'dob' in updated_data:
        user.dob = updated_data['dob']
    if 'height_weight' in updated_data:
        user.height_weight = updated_data['height_weight']
    if 'patient_id' in updated_data:
        user.patient_id = updated_data['patient_id']

    user.updated_date = datetime.datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user

def update_user_password(db: Session, user_id: int, old_password: str, new_password: str) -> bool:
    """Modify password after verifying previous password."""
    user = get_user_by_id(db, user_id)
    if not user:
        raise ValueError("User not found.")
    
    # If they don't have a password (e.g. Google login ONLY), let them set one, else verify
    if user.password_hash:
        if not verify_password(old_password, user.password_hash):
            raise ValueError("Incorrect current password.")

    user.password_hash = hash_password(new_password)
    user.updated_date = datetime.datetime.utcnow()
    db.commit()
    return True
