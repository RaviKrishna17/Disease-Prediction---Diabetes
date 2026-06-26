import os
import pickle
from pathlib import Path

# Setup paths relative to this file
BACKEND_DIR = Path(__file__).resolve().parent
WORKSPACE_ROOT = BACKEND_DIR.parent.parent
MODELS_DIR = WORKSPACE_ROOT / "disease_prediction" / "models"
SCALER_PATH = MODELS_DIR / "scaler.pkl"
MODEL_PATH = MODELS_DIR / "best_diabetes_model.pkl"

_scaler = None
_model = None

def load_artifacts():
    """
    Load and return the cached scaler and XGBoost model.
    Loads them once and caches them in memory.
    """
    global _scaler, _model
    
    if _scaler is not None and _model is not None:
        return _scaler, _model
        
    print(f"Loading scaler from {SCALER_PATH}...")
    if not SCALER_PATH.exists():
        raise FileNotFoundError(f"Scaler file not found at {SCALER_PATH}. Ensure train.py has run successfully.")
        
    print(f"Loading XGBoost model from {MODEL_PATH}...")
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"XGBoost model file not found at {MODEL_PATH}. Ensure train.py has run successfully.")
        
    with open(SCALER_PATH, 'rb') as f:
        _scaler = pickle.load(f)
        
    with open(MODEL_PATH, 'rb') as f:
        _model = pickle.load(f)
        
    print("Model and Scaler loaded successfully.")
    return _scaler, _model
