# Diabetes Prediction Database Package

This folder encapsulates all PostgreSQL database interactions and SQLAlchemy models for the final-year AI project.

## Project Structure
- `config.py`: Configuration manager loading `.env` properties.
- `database.py`: SQLAlchemy connection, engines, and session handlers.
- `models.py`: Declarative ORM models representing the tables.
- `auth.py`: Cryptographic helpers (bcrypt) and Google Token exchange.
- `users.py`: CRUD operations for updating profiles and registering credentials.
- `history.py`: Log storage and search retrieval functions.
- `session_manager.py`: Custom state machine for Remember Me, timeout and validation checks.
- `schema.sql`: Clean raw DDL script mapping the tables.

## Quick Setup
1. Define the PostgreSQL connection details inside a `.env` file in the backend directory:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/diabetes_prediction"
```
2. The package automatically initializes the schemas inside the target database if not yet existing upon first import in Python.
3. Fallback: If PostgreSQL is not configured, it falls back to SQLite (`sqlite:///diabetes_prediction_fallback.db`) to ensure the application starts and can be run.
