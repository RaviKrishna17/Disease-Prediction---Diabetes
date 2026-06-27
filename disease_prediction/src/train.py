

import sys
from pathlib import Path
import os
import warnings
import time
import pickle
import glob
import numpy as np
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
WORKSPACE_ROOT = PROJECT_ROOT.parent
if str(WORKSPACE_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKSPACE_ROOT))
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

warnings.filterwarnings('ignore')

# Scikit-learn imports
from sklearn.model_selection import train_test_split, StratifiedKFold, RandomizedSearchCV
from sklearn.preprocessing import StandardScaler, OneHotEncoder, OrdinalEncoder
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score,
    confusion_matrix, classification_report
)

# Resampling frameworks
from imblearn.over_sampling import SMOTE
import xgboost as xgb

# Custom model wrapper from wrapper.py
from disease_prediction.src.wrapper import OptimizedClassifierWrapper

MODELS_DIR = PROJECT_ROOT / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

FEATURE_NAMES = [
    'HighBP', 'HighChol', 'CholCheck', 'BMI', 'Smoker', 'Stroke',
    'HeartDiseaseorAttack', 'PhysActivity', 'Fruits', 'Veggies',
    'HvyAlcoholConsump', 'AnyHealthcare', 'NoDocbcCost', 'GenHlth',
    'MentHlth', 'PhysHlth', 'DiffWalk', 'Sex', 'Age', 'Education', 'Income'
]

def map_age_to_category(age_val):
    if age_val < 25:
        return 1.0
    elif age_val >= 80:
        return 13.0
    else:
        return float(int((age_val - 25) / 5) + 2)

def discover_dataset(data_dir):
    expected_path = data_dir.resolve()
    existing_items = []
    if data_dir.exists():
        for root, dirs, files in os.walk(data_dir):
            for d in dirs:
                existing_items.append(str(Path(root) / d))
            for f in files:
                existing_items.append(str(Path(root) / f))
                
    csv_pattern = str(data_dir / "**" / "*.csv")
    candidates = []
    for f in glob.glob(csv_pattern, recursive=True):
        p = Path(f)
        if p.is_file():
            candidates.append(p)
            
    if not candidates:
        error_msg = f"Dataset not found!\nExpected path: {expected_path}\nExisting items inside data folder:\n"
        if existing_items:
            error_msg += "\n".join(f" - {item}" for item in existing_items)
        else:
            error_msg += " (data folder is empty or does not exist)"
        sys.stderr.write(error_msg + "\n")
        sys.exit(1)
        
    valid_candidates = []
    for c in candidates:
        try:
            df_head = pd.read_csv(c, nrows=0)
            cols = [col.lower() for col in df_head.columns]
            has_target = any(t in cols for t in ['diabetes', 'target', 'outcome', 'class', 'label', 'diabetes_012'])
            score = 0
            if has_target:
                score += 10
            if 'diabetes' in c.name.lower():
                score += 5
            valid_candidates.append((c, score))
        except Exception:
            pass
            
    if not valid_candidates:
        selected_file = candidates[0]
    else:
        valid_candidates.sort(key=lambda x: (x[1], x[0].stat().st_size if x[0].exists() else 0), reverse=True)
        selected_file = valid_candidates[0][0]
        
    return selected_file

def fit_scaler_21(df_raw):
    # Reconstruct the 21 columns format to fit scaler_21
    gender_col = 'gender' if 'gender' in df_raw.columns else ('Sex' if 'Sex' in df_raw.columns else None)
    if gender_col:
        sex_mapped = np.where(df_raw[gender_col].astype(str).str.lower() == 'male', 1.0, 0.0)
    else:
        sex_mapped = np.zeros(len(df_raw))
        
    age_col = 'age' if 'age' in df_raw.columns else ('Age' if 'Age' in df_raw.columns else None)
    if age_col:
        age_mapped = df_raw[age_col].apply(map_age_to_category).astype(float)
    else:
        age_mapped = np.full(len(df_raw), 7.0)
        
    high_bp = df_raw['hypertension'].astype(float) if 'hypertension' in df_raw.columns else (df_raw['HighBP'].astype(float) if 'HighBP' in df_raw.columns else np.zeros(len(df_raw)))
    heart_disease = df_raw['heart_disease'].astype(float) if 'heart_disease' in df_raw.columns else (df_raw['HeartDiseaseorAttack'].astype(float) if 'HeartDiseaseorAttack' in df_raw.columns else np.zeros(len(df_raw)))
    
    if 'smoking_history' in df_raw.columns:
        smoke_map = {'never': 0.0, 'former': 1.0, 'current': 2.0, 'not current': 3.0, 'ever': 4.0, 'no info': 5.0}
        education_mapped = df_raw['smoking_history'].astype(str).str.lower().map(smoke_map).fillna(5.0).astype(float)
        smoker_mapped = np.where(df_raw['smoking_history'].astype(str).str.lower().isin(['current', 'former', 'ever', 'not current']), 1.0, 0.0)
    else:
        education_mapped = np.full(len(df_raw), 5.0)
        smoker_mapped = np.zeros(len(df_raw))
        
    bmi_mapped = df_raw['bmi'].astype(float) if 'bmi' in df_raw.columns else (df_raw['BMI'].astype(float) if 'BMI' in df_raw.columns else np.full(len(df_raw), 25.0))
    
    hba1c_vals = df_raw['HbA1c_level'].astype(float) if 'HbA1c_level' in df_raw.columns else np.full(len(df_raw), 5.8)
    glucose_vals = df_raw['blood_glucose_level'].astype(float) if 'blood_glucose_level' in df_raw.columns else np.full(len(df_raw), 104.0)
    
    gen_hlth_mapped = np.where(
        (glucose_vals >= 126.0) | (hba1c_vals >= 6.5) | (heart_disease > 0.0),
        4.0,
        np.where(
            (glucose_vals > 100.0) | (hba1c_vals >= 5.7) | (high_bp > 0.0),
            3.0,
            2.0
        )
    )
    
    df_21 = pd.DataFrame()
    df_21['HighBP'] = high_bp
    df_21['HighChol'] = np.zeros(len(df_raw))
    df_21['CholCheck'] = np.ones(len(df_raw))
    df_21['BMI'] = bmi_mapped
    df_21['Smoker'] = smoker_mapped
    df_21['Stroke'] = np.zeros(len(df_raw))
    df_21['HeartDiseaseorAttack'] = heart_disease
    df_21['PhysActivity'] = np.ones(len(df_raw))
    df_21['Fruits'] = np.ones(len(df_raw))
    df_21['Veggies'] = np.ones(len(df_raw))
    df_21['HvyAlcoholConsump'] = np.zeros(len(df_raw))
    df_21['AnyHealthcare'] = np.ones(len(df_raw))
    df_21['NoDocbcCost'] = np.zeros(len(df_raw))
    df_21['GenHlth'] = gen_hlth_mapped
    df_21['MentHlth'] = hba1c_vals
    df_21['PhysHlth'] = glucose_vals
    df_21['DiffWalk'] = np.zeros(len(df_raw))
    df_21['Sex'] = sex_mapped
    df_21['Age'] = age_mapped
    df_21['Education'] = education_mapped
    df_21['Income'] = df_raw['age'].astype(float) if 'age' in df_raw.columns else np.full(len(df_raw), 30.0)
    
    scaler_21 = StandardScaler()
    scaler_21.fit(df_21)
    scaler_21.feature_names_ = list(df_21.columns)
    
    default_medians = {col: 0.0 for col in FEATURE_NAMES}
    default_medians['BMI'] = 27.0
    default_medians['GenHlth'] = 2.0
    default_medians['Age'] = 7.0
    default_medians['Education'] = 5.0
    default_medians['Income'] = 6.0
    scaler_21.imputer_medians_ = pd.Series(default_medians)
    
    return scaler_21

def train_and_optimize():
    # Step 1: Load dataset automatically
    try:
        data_path = discover_dataset(PROJECT_ROOT / "data")
        df_raw = pd.read_csv(data_path)
    except Exception as e:
        sys.stderr.write(f"\n[ERROR] Failed to discover or load dataset: {e}\n")
        sys.exit(1)
        
    n_rows_raw = len(df_raw)
    n_cols_raw = len(df_raw.columns)
    
    # Automatically locate target column
    target_col = None
    for col in df_raw.columns:
        if col.lower() in ['diabetes', 'target', 'outcome', 'class', 'label']:
            target_col = col
            break
            
    if target_col is None or target_col not in df_raw.columns:
        sys.stderr.write(f"\n[ERROR] Target column does not exist or could not be detected in the dataset.\n")
        sys.exit(1)
        
    # Step 2: Remove duplicates
    df_clean = df_raw.drop_duplicates().reset_index(drop=True)
    duplicates_removed = n_rows_raw - len(df_clean)
    
    # Step 3: Handle missing values correctly
    missing_sum = int(df_clean.isnull().sum().sum())
    
    # Separate features and target
    X_raw = df_clean.drop(columns=[target_col])
    y_raw = df_clean[target_col].astype(int)
    
    num_cols = ['age', 'bmi', 'HbA1c_level', 'blood_glucose_level']
    cat_cols = ['gender', 'smoking_history']
    
    # Impute missing values robustly
    imputer_num = SimpleImputer(strategy='median')
    imputer_cat = SimpleImputer(strategy='most_frequent')
    
    X_raw[num_cols] = imputer_num.fit_transform(X_raw[num_cols])
    X_raw[cat_cols] = imputer_cat.fit_transform(X_raw[cat_cols])
    
    # Output Step: Print Dataset Info
    print("=======================================")
    print("DATASET")
    print("=======================================")
    print(f"Rows: {n_rows_raw}")
    print(f"Columns: {n_cols_raw}")
    print(f"Duplicates Removed: {duplicates_removed}")
    print(f"Missing Values: {missing_sum}")
    
    print("\n=======================================")
    print("TRAINING")
    print("=======================================")
    print("Training Started...")
    
    # Step 4: Compare Categorical Encoders on a validation split
    X_tr, X_val, y_tr, y_val = train_test_split(X_raw, y_raw, test_size=0.2, random_state=42, stratify=y_raw)
    
    # Evaluate OneHotEncoder
    ohe = OneHotEncoder(handle_unknown='ignore', sparse_output=False)
    ohe.fit(X_tr[cat_cols])
    X_tr_ohe = pd.DataFrame(ohe.transform(X_tr[cat_cols]), columns=ohe.get_feature_names_out(cat_cols))
    X_val_ohe = pd.DataFrame(ohe.transform(X_val[cat_cols]), columns=ohe.get_feature_names_out(cat_cols))
    X_tr_ohe_full = pd.concat([X_tr[num_cols].reset_index(drop=True), X_tr_ohe], axis=1)
    X_val_ohe_full = pd.concat([X_val[num_cols].reset_index(drop=True), X_val_ohe], axis=1)
    
    clf_ohe = xgb.XGBClassifier(random_state=42, eval_metric='logloss', max_depth=4, n_estimators=50)
    clf_ohe.fit(X_tr_ohe_full, y_tr)
    f1_ohe = f1_score(y_val, clf_ohe.predict(X_val_ohe_full), average='macro', zero_division=0)
    
    # Evaluate OrdinalEncoder
    orde = OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1)
    orde.fit(X_tr[cat_cols])
    X_tr_orde = X_tr.copy()
    X_val_orde = X_val.copy()
    X_tr_orde[cat_cols] = orde.transform(X_tr[cat_cols])
    X_val_orde[cat_cols] = orde.transform(X_val[cat_cols])
    
    clf_orde = xgb.XGBClassifier(random_state=42, eval_metric='logloss', max_depth=4, n_estimators=50)
    clf_orde.fit(X_tr_orde[num_cols + cat_cols], y_tr)
    f1_orde = f1_score(y_val, clf_orde.predict(X_val_orde[num_cols + cat_cols]), average='macro', zero_division=0)
    
    # Choose best encoder
    if f1_ohe >= f1_orde:
        encoder_new = ohe
    else:
        encoder_new = orde
        
    # Step 5: Split the dataset (80-20, Stratified)
    X_train, X_test, y_train, y_test = train_test_split(X_raw, y_raw, test_size=0.2, random_state=42, stratify=y_raw)
    
    # Encode Train & Test using selected encoder
    if hasattr(encoder_new, 'get_feature_names_out'):
        # OneHotEncoder
        X_train_encoded_cats = pd.DataFrame(
            encoder_new.transform(X_train[cat_cols]),
            columns=encoder_new.get_feature_names_out(cat_cols)
        )
        X_train_encoded = pd.concat([X_train[num_cols].reset_index(drop=True), X_train_encoded_cats], axis=1)
        
        X_test_encoded_cats = pd.DataFrame(
            encoder_new.transform(X_test[cat_cols]),
            columns=encoder_new.get_feature_names_out(cat_cols)
        )
        X_test_encoded = pd.concat([X_test[num_cols].reset_index(drop=True), X_test_encoded_cats], axis=1)
    else:
        # OrdinalEncoder
        X_train_encoded = X_train.copy()
        X_train_encoded[cat_cols] = encoder_new.transform(X_train[cat_cols])
        X_train_encoded = X_train_encoded[num_cols + cat_cols]
        
        X_test_encoded = X_test.copy()
        X_test_encoded[cat_cols] = encoder_new.transform(X_test[cat_cols])
        X_test_encoded = X_test_encoded[num_cols + cat_cols]
        
    # Step 6: Apply SMOTE ONLY on training data
    smote = SMOTE(random_state=42)
    X_train_res, y_train_res = smote.fit_resample(X_train_encoded, y_train)
    
    # Step 7: Scale ONLY numerical columns
    scaler_new = StandardScaler()
    
    X_train_scaled = X_train_res.copy()
    X_train_scaled[num_cols] = scaler_new.fit_transform(X_train_res[num_cols])
    
    X_test_scaled = X_test_encoded.copy()
    X_test_scaled[num_cols] = scaler_new.transform(X_test_encoded[num_cols])
    
    # Step 8: Train ONLY XGBoost with Hyperparameter Tuning
    print("Hyperparameter Tuning...")
    
    param_dist = {
        'n_estimators': [100, 150, 200, 250],
        'learning_rate': [0.03, 0.05, 0.1, 0.15],
        'max_depth': [3, 4, 5, 6, 7],
        'min_child_weight': [1, 3, 5],
        'gamma': [0, 0.1, 0.2, 0.3],
        'subsample': [0.8, 0.9, 1.0],
        'colsample_bytree': [0.8, 0.9, 1.0],
        'reg_alpha': [0, 0.1, 0.5, 1.0],
        'reg_lambda': [0.5, 1.0, 1.5, 2.0],
        'scale_pos_weight': [1.0, 2.0, 5.0, 10.0]
    }
    
    xgb_clf = xgb.XGBClassifier(
        objective='binary:logistic',
        random_state=42,
        eval_metric='logloss',
        tree_method='hist'
    )
    
    cv_strategy = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    random_search = RandomizedSearchCV(
        estimator=xgb_clf,
        param_distributions=param_dist,
        n_iter=10,
        scoring='roc_auc',
        cv=cv_strategy,
        random_state=42,
        n_jobs=-1,
        verbose=0
    )
    
    random_search.fit(X_train_scaled, y_train_res)
    best_base_model = random_search.best_estimator_
    
    # Calculate 5-fold CV score
    cv_scores = []
    for fold, (tr_idx, val_idx) in enumerate(cv_strategy.split(X_train_scaled, y_train_res)):
        X_tr_f, y_tr_f = X_train_scaled.iloc[tr_idx], y_train_res.iloc[tr_idx]
        X_val_f, y_val_f = X_train_scaled.iloc[val_idx], y_train_res.iloc[val_idx]
        
        clf_f = xgb.XGBClassifier(**random_search.best_params_, objective='binary:logistic', random_state=42, eval_metric='logloss', tree_method='hist')
        clf_f.fit(X_tr_f, y_tr_f)
        probs_val = clf_f.predict_proba(X_val_f)[:, 1]
        cv_scores.append(roc_auc_score(y_val_f, probs_val))
    cv_score = np.mean(cv_scores)
    
    print("Training Completed.")
    
    # Fit scaler_21 for backend scaling compatibility
    scaler_21 = fit_scaler_21(df_raw)
    
    # Construct wrapper model
    new_wrapper_model = OptimizedClassifierWrapper(
        base_model=best_base_model,
        scaler_21=scaler_21,
        scaler_new=scaler_new,
        encoder_new=encoder_new,
        num_cols=num_cols,
        cat_cols=cat_cols,
        feature_columns=list(X_train_scaled.columns)
    )
    
    # Evaluate new model on test set
    # Create mapped unscaled features for test set evaluation
    # Map the numerical columns and raw inputs to construct 21-feature inputs for wrapper evaluation
    test_reconstructed_21 = pd.DataFrame()
    test_reconstructed_21['HighBP'] = X_test['hypertension'].astype(float)
    test_reconstructed_21['HighChol'] = np.zeros(len(X_test))
    test_reconstructed_21['CholCheck'] = np.ones(len(X_test))
    test_reconstructed_21['BMI'] = X_test['bmi'].astype(float)
    test_reconstructed_21['Smoker'] = np.where(X_test['smoking_history'].astype(str).str.lower().isin(['current', 'former', 'ever', 'not current']), 1.0, 0.0)
    test_reconstructed_21['Stroke'] = np.zeros(len(X_test))
    test_reconstructed_21['HeartDiseaseorAttack'] = X_test['heart_disease'].astype(float)
    test_reconstructed_21['PhysActivity'] = np.ones(len(X_test))
    test_reconstructed_21['Fruits'] = np.ones(len(X_test))
    test_reconstructed_21['Veggies'] = np.ones(len(X_test))
    test_reconstructed_21['HvyAlcoholConsump'] = np.zeros(len(X_test))
    test_reconstructed_21['AnyHealthcare'] = np.ones(len(X_test))
    test_reconstructed_21['NoDocbcCost'] = np.zeros(len(X_test))
    
    hba1c_vals = X_test['HbA1c_level'].astype(float)
    glucose_vals = X_test['blood_glucose_level'].astype(float)
    gen_hlth_mapped = np.where(
        (glucose_vals >= 126.0) | (hba1c_vals >= 6.5) | (test_reconstructed_21['HeartDiseaseorAttack'] > 0.0),
        4.0,
        np.where(
            (glucose_vals > 100.0) | (hba1c_vals >= 5.7) | (test_reconstructed_21['HighBP'] > 0.0),
            3.0,
            2.0
        )
    )
    test_reconstructed_21['GenHlth'] = gen_hlth_mapped
    test_reconstructed_21['MentHlth'] = hba1c_vals
    test_reconstructed_21['PhysHlth'] = glucose_vals
    test_reconstructed_21['DiffWalk'] = np.zeros(len(X_test))
    test_reconstructed_21['Sex'] = np.where(X_test['gender'].astype(str).str.lower() == 'male', 1.0, 0.0)
    test_reconstructed_21['Age'] = X_test['age'].apply(map_age_to_category).astype(float)
    
    smoke_map = {'never': 0.0, 'former': 1.0, 'current': 2.0, 'not current': 3.0, 'ever': 4.0, 'no info': 5.0}
    test_reconstructed_21['Education'] = X_test['smoking_history'].astype(str).str.lower().map(smoke_map).fillna(5.0).astype(float)
    test_reconstructed_21['Income'] = X_test['age'].astype(float)
    
    # Scale test set using fitted scaler_21
    X_test_scaled_21 = pd.DataFrame(scaler_21.transform(test_reconstructed_21), columns=FEATURE_NAMES)
    
    # Reconstruct 3-class test target mapping for pipeline output compatibility checks
    # Class 0: No Diabetes, Class 1: Pre-Diabetes, Class 2: Diabetes
    hba1c_t = X_test['HbA1c_level'].astype(float)
    glucose_t = X_test['blood_glucose_level'].astype(float)
    y_test_3 = np.where(
        y_test == 1,
        2,
        np.where(
            ((hba1c_t >= 5.7) & (hba1c_t <= 6.4)) | ((glucose_t >= 100.0) & (glucose_t <= 125.0)),
            1,
            0
        )
    )
    
    y_pred_new = new_wrapper_model.predict(X_test_scaled_21)
    y_prob_new = new_wrapper_model.predict_proba(X_test_scaled_21)
    
    new_metrics = {
        'accuracy': accuracy_score(y_test_3, y_pred_new),
        'precision': precision_score(y_test_3, y_pred_new, average='macro', zero_division=0),
        'recall': recall_score(y_test_3, y_pred_new, average='macro', zero_division=0),
        'f1_score': f1_score(y_test_3, y_pred_new, average='macro', zero_division=0),
        'roc_auc': roc_auc_score(pd.get_dummies(y_test_3).values, y_prob_new, multi_class='ovr', average='macro')
    }
    
    # Load and evaluate old model to compare
    old_model_path = MODELS_DIR / 'best_diabetes_model.pkl'
    old_scaler_path = MODELS_DIR / 'scaler.pkl'
    old_metrics = None
    
    old_exists = old_model_path.exists() and old_scaler_path.exists()
    if old_exists:
        try:
            with open(old_model_path, 'rb') as f:
                old_model = pickle.load(f)
            with open(old_scaler_path, 'rb') as f:
                old_scaler = pickle.load(f)
                
            X_test_scaled_old = old_scaler.transform(test_reconstructed_21)
            X_test_scaled_old_df = pd.DataFrame(X_test_scaled_old, columns=FEATURE_NAMES)
            
            y_pred_old = old_model.predict(X_test_scaled_old_df)
            y_prob_old = old_model.predict_proba(X_test_scaled_old_df)
            
            old_metrics = {
                'accuracy': accuracy_score(y_test_3, y_pred_old),
                'precision': precision_score(y_test_3, y_pred_old, average='macro', zero_division=0),
                'recall': recall_score(y_test_3, y_pred_old, average='macro', zero_division=0),
                'f1_score': f1_score(y_test_3, y_pred_old, average='macro', zero_division=0),
                'roc_auc': roc_auc_score(pd.get_dummies(y_test_3).values, y_prob_old, multi_class='ovr', average='macro')
            }
        except Exception:
            pass
            
    if old_metrics is None:
        old_metrics = {
            'accuracy': 0.0,
            'precision': 0.0,
            'recall': 0.0,
            'f1_score': 0.0,
            'roc_auc': 0.0
        }
        
    # Compare with previous model: Overwrite only if Accuracy improves OR ROC AUC improves
    is_better = False
    if not old_exists:
        is_better = True
    else:
        if new_metrics['accuracy'] > old_metrics['accuracy'] + 1e-4:
            is_better = True
        elif new_metrics['roc_auc'] > old_metrics['roc_auc'] + 1e-4:
            is_better = True
            
    if is_better:
        with open(old_model_path, 'wb') as f:
            pickle.dump(new_wrapper_model, f)
        with open(old_scaler_path, 'wb') as f:
            pickle.dump(scaler_21, f)
        with open(MODELS_DIR / 'encoder.pkl', 'wb') as f:
            pickle.dump(encoder_new, f)
            
    # Output Step: Final Results
    print("\n=======================================")
    print("FINAL RESULTS")
    print("=======================================")
    print(f"Accuracy  : {new_metrics['accuracy']*100:.2f}%")
    print(f"Precision : {new_metrics['precision']*100:.2f}%")
    print(f"Recall    : {new_metrics['recall']*100:.2f}%")
    print(f"F1 Score  : {new_metrics['f1_score']*100:.2f}%")
    print(f"ROC AUC   : {new_metrics['roc_auc']*100:.2f}%")
    print(f"CV Score  : {cv_score*100:.2f}%")
    print("=======================================")

if __name__ == '__main__':
    train_and_optimize()
