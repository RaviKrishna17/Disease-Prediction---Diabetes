import secrets
import datetime
from sqlalchemy.orm import Session
from database.models import Session as DBSession
from database import config

def create_session(db: Session, user_id: int, remember_me: bool = False) -> str:
    """Generate a secure session token and store it in database."""
    token = secrets.token_hex(32)
    
    now = datetime.datetime.utcnow()
    if remember_me:
        duration = datetime.timedelta(days=config.SESSION_REMEMBER_ME_DAYS)
    else:
        duration = datetime.timedelta(minutes=config.SESSION_TIMEOUT_MINUTES)
        
    expires_at = now + duration
    
    session = DBSession(
        session_token=token,
        user_id=user_id,
        created_at=now,
        expires_at=expires_at,
        last_activity=now,
        remember_me=remember_me
    )
    db.add(session)
    db.commit()
    print(f"Session created. User ID: {user_id}. Token: {token[:8]}...")
    return token

def validate_session(db: Session, session_token: str):
    """
    Validate session token and update last_activity or extend expiration if valid.
    Returns:
        DBSession model if valid, else None.
    """
    if not session_token:
        return None
        
    session = db.query(DBSession).filter(DBSession.session_token == session_token).first()
    if not session:
        return None
        
    now = datetime.datetime.utcnow()
    # Check if expired
    if session.expires_at < now:
        db.delete(session)
        db.commit()
        return None
        
    # Valid session: update activity and slide expiration forward for normal sessions
    session.last_activity = now
    if not session.remember_me:
        session.expires_at = now + datetime.timedelta(minutes=config.SESSION_TIMEOUT_MINUTES)
        
    db.commit()
    db.refresh(session)
    print(f"Session restored. User ID: {session.user_id}. Token: {session_token[:8]}...")
    return session

def invalidate_session(db: Session, session_token: str) -> bool:
    """Delete the session token from database on logout."""
    if not session_token:
        return False
        
    session = db.query(DBSession).filter(DBSession.session_token == session_token).first()
    if session:
        db.delete(session)
        db.commit()
        return True
    return False

def clean_expired_sessions(db: Session):
    """Garbage collector to remove old expired sessions."""
    now = datetime.datetime.utcnow()
    db.query(DBSession).filter(DBSession.expires_at < now).delete()
    db.commit()
