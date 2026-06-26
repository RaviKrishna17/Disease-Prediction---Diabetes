import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from database import config

logger = logging.getLogger(__name__)

Base = declarative_base()

# Initialize connection variables
engine = None
SessionLocal = None
is_sqlite_active = False

def init_db():
    global engine, SessionLocal, is_sqlite_active
    
    # Try PostgreSQL first
    try:
        engine = create_engine(config.DATABASE_URL, pool_pre_ping=True)
        # Attempt a quick connection test
        with engine.connect() as conn:
            logger.info("Successfully connected to PostgreSQL database!")
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        is_sqlite_active = False
        
        # Automatically create tables if they don't exist
        # Import models here to register them with metadata and avoid circular import
        from database import models
        Base.metadata.create_all(bind=engine)
        logger.info("Table schemas created/verified successfully.")
    except Exception as e:
        logger.warning(f"Failed to connect to PostgreSQL database: {e}")
        if config.SQLITE_FALLBACK:
            logger.warning(f"Falling back to local SQLite database: {config.SQLITE_URL}")
            try:
                engine = create_engine(
                    config.SQLITE_URL, 
                    connect_args={"check_same_thread": False} if config.SQLITE_URL.startswith("sqlite") else {}
                )
                SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
                is_sqlite_active = True
                
                # Automatically create tables in SQLite fallback
                from database import models
                Base.metadata.create_all(bind=engine)
                logger.info("Fallback table schemas created/verified successfully.")
            except Exception as sqlite_err:
                logger.error(f"Failed to initialize SQLite fallback: {sqlite_err}")
                raise sqlite_err
        else:
            raise e

# Run initialization immediately on import
init_db()

def get_db():
    """Dependency helper to get database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
