import bcrypt
import requests
import logging
from database import config

logger = logging.getLogger(__name__)

def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    """Verify standard bcrypt password match."""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception as e:
        logger.error(f"Error checking password hash: {e}")
        return False

def exchange_google_code_for_token(code: str) -> str:
    """Exchange OAuth2 authorization code for access token."""
    token_url = "https://oauth2.googleapis.com/token"
    payload = {
        'code': code,
        'client_id': config.GOOGLE_CLIENT_ID,
        'client_secret': config.GOOGLE_CLIENT_SECRET,
        'redirect_uri': config.GOOGLE_REDIRECT_URI,
        'grant_type': 'authorization_code'
    }
    try:
        response = requests.post(token_url, data=payload, timeout=10)
        if response.status_code != 200:
            logger.error(f"Google token exchange failed: {response.text}")
            raise Exception("Failed to exchange code for token with Google.")
        
        token_data = response.json()
        return token_data.get('access_token')
    except Exception as e:
        logger.error(f"Google token exchange exception: {e}")
        raise e

def get_google_user_profile(access_token: str) -> dict:
    """Fetch user profile metadata from Google using access token."""
    profile_url = "https://www.googleapis.com/oauth2/v3/userinfo"
    headers = {
        'Authorization': f'Bearer {access_token}'
    }
    try:
        response = requests.get(profile_url, headers=headers, timeout=10)
        if response.status_code != 200:
            logger.error(f"Google profile retrieve failed: {response.text}")
            raise Exception("Failed to fetch user profile from Google.")
        
        return response.json()
    except Exception as e:
        logger.error(f"Google user profile fetch exception: {e}")
        raise e
