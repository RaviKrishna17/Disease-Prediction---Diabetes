# Disease Prediction System (Diabetes Risk Classification)

An end-to-end, production-grade Machine Learning and API pipeline that predicts diabetes risk using the Pima Indians Diabetes Dataset. This application is structured as a full-stack web application with distinct layers for machine learning, backend API service, and a modern dashboard user interface.

---

## 📂 Project Structure

```
disease-prediction-system/
│
├── README.md                          # Main project overview and documentation
├── .gitignore                         # Project-wide git exclusions
├── LICENSE                            # MIT License
├── docker-compose.yml                 # Local docker orchestration for services (DB, API, Web)
│
├── ml/                                # Machine Learning Pipeline (offline/batch)
│   ├── data/
│   │   ├── raw/diabetes.csv           # Raw input dataset
│   │   └── processed/                 # Imputed and cleaned dataset
│   ├── notebooks/
│   │   └── 01_eda_diabetes.ipynb      # Jupyter Notebook for EDA & visualizations
│   ├── src/
│   │   ├── preprocess.py              # Data cleaning and imputation routines
│   │   ├── train_logreg.py            # Logistic Regression model training
│   │   ├── train_random_forest.py     # Random Forest model training & search
│   │   ├── train_xgboost.py           # XGBoost model training & search
│   │   ├── train_nn.py                # Deep Learning (Keras/TensorFlow) training
│   │   ├── evaluate.py                # Models evaluation and performance comparison
│   │   └── select_best_model.py       # Chooses and serializes the best performing model
│   ├── models/
│   │   ├── best_model.pkl             # Serialized production classifier
│   │   ├── scaler.pkl                 # Serialized fitted StandardScaler instance
│   │   └── model_metadata.json        # Output evaluation metrics and training metadata
│   └── requirements.txt               # Dependencies for data science and ML
│
├── backend/                           # FastAPI Backend Service
│   ├── app/
│   │   ├── main.py                    # API entry point & app initialization
│   │   ├── core/
│   │   │   ├── config.py              # Configuration & Environment loading
│   │   │   └── security.py            # Password hashing & JWT generation/verification
│   │   ├── api/
│   │   │   ├── auth_routes.py         # Routes for registration, local login, and Google OAuth
│   │   │   ├── predict_routes.py      # Route for receiving client inputs and predicting risk
│   │   │   ├── history_routes.py      # Routes for retrieving patient prediction history
│   │   │   └── user_routes.py         # Routes for fetching and updating profiles
│   │   ├── models/                    # SQLAlchemy ORM models
│   │   │   ├── user.py                # User database model
│   │   │   └── prediction.py          # Prediction database model
│   │   ├── schemas/                   # Pydantic schemas (request/response validation)
│   │   │   ├── user_schema.py         # Input validation schemas for user auth
│   │   │   └── prediction_schema.py   # Input validation schemas for predictions
│   │   ├── services/
│   │   │   ├── ml_service.py          # Serialized model loader and inference engine
│   │   │   └── auth_service.py        # Authentication & Google Token Verification helper
│   │   └── db/
│   │       ├── database.py            # DB engine, session builder, and declarative base
│   │       └── migrations/            # Alembic schema migrations folder
│   ├── tests/
│   │   ├── test_auth.py               # Unit and integration tests for security routes
│   │   └── test_predict.py            # Unit tests for verification of inference routes
│   └── requirements.txt               # Dependencies for FastAPI backend
│
├── frontend/                          # React/Next.js Web Client
│   ├── public/                        # Static files and assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── PredictionForm.jsx     # Form for capturing diabetes medical features
│   │   │   ├── ResultCard.jsx         # Card to render prediction results and feedback
│   │   │   ├── HistoryTable.jsx       # Table showing historical predictions
│   │   │   └── Navbar.jsx             # Main site header navigation
│   │   ├── pages/
│   │   │   ├── Login.jsx              # User sign-in page
│   │   │   ├── Register.jsx           # User registration page
│   │   │   ├── Dashboard.jsx          # Logged-in home dashboard page
│   │   │   └── History.jsx            # User history dashboard page
│   │   ├── services/api.js            # Axios client instances and endpoint configurations
│   │   ├── context/AuthContext.jsx    # Session provider and OAuth token contexts
│   │   └── App.jsx                    # Primary component entry
│   ├── package.json                   # NPM script configurations & client dependencies
│   └── tailwind.config.js             # Styling tokens and Tailwind settings
│
└── docs/                              # Architecture Diagrams and Project Docs
    ├── architecture.md                # System documentation
    ├── api_design.md                  # Rest API schema and endpoints list
    ├── db_schema.png                  # Database entity-relationship model image
    └── screenshots/                   # Application screenshots
```

---

## ⚙️ Development Guidelines

1. **Machine Learning Pipeline (`/ml`)**: Run data EDA, cleanup, baseline model training, parameter optimization, evaluation, and exporting within the ML pipeline.
2. **Backend API (`/backend`)**: Loads the exported ML artifacts (`best_model.pkl` + `scaler.pkl`) at startup. Implements user registration, JWT generation, Google token validation, database writes (PostgreSQL via SQLAlchemy ORM), and prediction runs.
3. **Frontend Client (`/frontend`)**: Interacts with the backend via Axios endpoints, handling dashboards, prediction forms, results display, and history metrics.
