import pandas as pd
import numpy as np

FEATURE_NAMES = [
    'HighBP', 'HighChol', 'CholCheck', 'BMI', 'Smoker', 'Stroke',
    'HeartDiseaseorAttack', 'PhysActivity', 'Fruits', 'Veggies',
    'HvyAlcoholConsump', 'AnyHealthcare', 'NoDocbcCost', 'GenHlth',
    'MentHlth', 'PhysHlth', 'DiffWalk', 'Sex', 'Age', 'Education', 'Income'
]

def map_age_to_category(age):
    """
    Convert age in years to BRFSS2015 Age category scale (1 to 13):
    1: 18-24, 2: 25-29, 3: 30-34, 4: 35-39, 5: 40-44, 6: 45-49,
    7: 50-54, 8: 55-59, 9: 60-64, 10: 65-69, 11: 70-74, 12: 75-79, 13: 80+
    """
    if age is None or age == '':
        return 7.0 # Default median category (50-54)
        
    try:
        age = float(age)
    except (ValueError, TypeError):
        return 7.0
        
    if age < 25:
        return 1.0
    elif age >= 80:
        return 13.0
    else:
        return float(int((age - 25) / 5) + 2)

def prepare_input_features(raw_data):
    """
    Map raw frontend patient data to the model's 21 features with robust type casting.
    """
    # Extract and cast values safely
    try:
        age_years = float(raw_data.get('age')) if raw_data.get('age') is not None and raw_data.get('age') != '' else 30.0
    except (ValueError, TypeError):
        age_years = 30.0

    gender = str(raw_data.get('gender', 'female')).lower().strip()

    try:
        height = float(raw_data.get('height')) if raw_data.get('height') is not None and raw_data.get('height') != '' else 165.0
    except (ValueError, TypeError):
        height = 165.0

    try:
        weight = float(raw_data.get('weight')) if raw_data.get('weight') is not None and raw_data.get('weight') != '' else 72.0
    except (ValueError, TypeError):
        weight = 72.0

    try:
        systolic_bp = float(raw_data.get('systolicBP')) if raw_data.get('systolicBP') is not None and raw_data.get('systolicBP') != '' else 125.0
    except (ValueError, TypeError):
        systolic_bp = 125.0

    try:
        diastolic_bp = float(raw_data.get('diastolicBP')) if raw_data.get('diastolicBP') is not None and raw_data.get('diastolicBP') != '' else 80.0
    except (ValueError, TypeError):
        diastolic_bp = 80.0

    try:
        glucose = float(raw_data.get('glucose')) if raw_data.get('glucose') is not None and raw_data.get('glucose') != '' else 104.0
    except (ValueError, TypeError):
        glucose = 104.0

    try:
        hba1c = float(raw_data.get('hba1c')) if raw_data.get('hba1c') is not None and raw_data.get('hba1c') != '' else 5.8
    except (ValueError, TypeError):
        hba1c = 5.8

    # Helper function to cast boolean inputs (can be strings, booleans, or ints)
    def cast_bool(val, default):
        if val is None:
            return default
        if isinstance(val, bool):
            return 1.0 if val else 0.0
        if isinstance(val, (int, float)):
            return 1.0 if val > 0 else 0.0
        val_str = str(val).lower().strip()
        if val_str in ['true', '1.0', '1', 'yes']:
            return 1.0
        return 0.0

    family_history = cast_bool(raw_data.get('familyHistory'), 1.0)
    cholesterol = cast_bool(raw_data.get('cholesterol'), 0.0)
    smoking = str(raw_data.get('smoking', 'never')).lower().strip()
    activity_level = str(raw_data.get('activityLevel', 'moderate')).lower().strip()
    
    heart_disease = cast_bool(raw_data.get('heartDisease'), 0.0)
    stroke_history = cast_bool(raw_data.get('strokeHistory'), 0.0)
    cholesterol_checked = cast_bool(raw_data.get('cholesterolChecked'), 1.0)
    
    # 1. HighBP: 1 if Systolic >= 130 or Diastolic >= 85
    high_bp = 1.0 if (systolic_bp >= 130.0 or diastolic_bp >= 85.0) else 0.0
    
    # 2. HighChol: 1 if cholesterol is true
    high_chol = cholesterol
    
    # 3. CholCheck: 1 if checked within past 5 years
    chol_check = cholesterol_checked
    
    # 4. BMI calculation
    try:
        height_m = height / 100.0
        bmi = weight / (height_m * height_m) if height_m > 0 else 26.4
    except (ValueError, TypeError):
        bmi = 26.4
        
    # 5. Smoker: 1 if has smoked >= 100 cigarettes (former or current smoker)
    smoker = 1.0 if smoking in ['former', 'current'] else 0.0
    
    # 6. Stroke: 1 if has history of stroke
    stroke = stroke_history
    
    # 7. HeartDiseaseorAttack: 1 if heart disease is true
    heart_disease_flag = heart_disease
    
    # 8. PhysActivity: 0 if sedentary, else 1
    phys_activity = 0.0 if activity_level == 'sedentary' else 1.0
    
    # 9-13. Lifestyle & Access (default fallback parameters)
    try:
        fruits = float(raw_data.get('fruits', 1.0))
    except (ValueError, TypeError):
        fruits = 1.0

    try:
        veggies = float(raw_data.get('veggies', 1.0))
    except (ValueError, TypeError):
        veggies = 1.0

    try:
        heavy_alcohol = float(raw_data.get('heavyAlcohol', 0.0))
    except (ValueError, TypeError):
        heavy_alcohol = 0.0

    try:
        any_healthcare = float(raw_data.get('anyHealthcare', 1.0))
    except (ValueError, TypeError):
        any_healthcare = 1.0

    try:
        no_doc_cost = float(raw_data.get('noDocCost', 0.0))
    except (ValueError, TypeError):
        no_doc_cost = 0.0
    
    # 14-16. Health status scales (1-5, days 0-30)
    # Estimate General Health GenHlth based on risk indicators
    # (1 = Excellent, 2 = Very Good, 3 = Good, 4 = Fair, 5 = Poor)
    gen_hlth_est = 2.0
    if glucose >= 126.0 or hba1c >= 6.5 or heart_disease > 0.0 or stroke_history > 0.0:
        gen_hlth_est = 4.0
    elif glucose > 100.0 or hba1c >= 5.7 or high_bp > 0.0 or high_chol > 0.0:
        gen_hlth_est = 3.0
        
    try:
        gen_hlth = float(raw_data.get('genHlth', gen_hlth_est))
    except (ValueError, TypeError):
        gen_hlth = gen_hlth_est
    
    try:
        ment_hlth = float(raw_data.get('mentHlth', 0.0))
    except (ValueError, TypeError):
        ment_hlth = 0.0

    try:
        phys_hlth = float(raw_data.get('physHlth', 0.0))
    except (ValueError, TypeError):
        phys_hlth = 0.0
    
    # 17. DiffWalk: Serious difficulty walking
    try:
        diff_walk = float(raw_data.get('diffWalk', 0.0))
    except (ValueError, TypeError):
        diff_walk = 0.0
    
    # 18. Sex: 0 = Female, 1 = Male
    sex = 1.0 if gender == 'male' else 0.0
    
    # 19. Age: Category 1-13
    age_cat = map_age_to_category(age_years)
    
    # 20-21. Socioeconomic factors (sensible defaults)
    try:
        education = float(raw_data.get('education', 5.0))
    except (ValueError, TypeError):
        education = 5.0

    try:
        income = float(raw_data.get('income', 6.0))
    except (ValueError, TypeError):
        income = 6.0
    
    # Create mapped feature dict
    mapped_features = {
        'HighBP': high_bp,
        'HighChol': high_chol,
        'CholCheck': chol_check,
        'BMI': bmi,
        'Smoker': smoker,
        'Stroke': stroke,
        'HeartDiseaseorAttack': heart_disease_flag,
        'PhysActivity': phys_activity,
        'Fruits': fruits,
        'Veggies': veggies,
        'HvyAlcoholConsump': heavy_alcohol,
        'AnyHealthcare': any_healthcare,
        'NoDocbcCost': no_doc_cost,
        'GenHlth': gen_hlth,
        'MentHlth': ment_hlth,
        'PhysHlth': phys_hlth,
        'DiffWalk': diff_walk,
        'Sex': sex,
        'Age': age_cat,
        'Education': education,
        'Income': income
    }
    
    return mapped_features

def preprocess_and_scale(raw_data, scaler):
    """
    Take raw data, map features, align column ordering, and scale using loaded StandardScaler.
    """
    mapped_features = prepare_input_features(raw_data)
    df = pd.DataFrame([mapped_features])
    
    # Fill any missing values with median values from the scaler or fallback defaults
    default_medians = {
        'HighBP': 0.0, 'HighChol': 0.0, 'CholCheck': 1.0, 'BMI': 27.0, 'Smoker': 0.0,
        'Stroke': 0.0, 'HeartDiseaseorAttack': 0.0, 'PhysActivity': 1.0, 'Fruits': 1.0,
        'Veggies': 1.0, 'HvyAlcoholConsump': 0.0, 'AnyHealthcare': 1.0, 'NoDocbcCost': 0.0,
        'GenHlth': 2.0, 'MentHlth': 0.0, 'PhysHlth': 0.0, 'DiffWalk': 0.0, 'Sex': 0.0,
        'Age': 7.0, 'Education': 5.0, 'Income': 6.0
    }
    
    for col in FEATURE_NAMES:
        if pd.isna(df.loc[0, col]) or df.loc[0, col] is None:
            df.loc[0, col] = getattr(scaler, 'imputer_medians_', pd.Series(default_medians))[col]
            
    # Align order with scaler's saved features
    df = df[scaler.feature_names_]
    
    # Scale
    scaled_data = scaler.transform(df)
    
    # Re-wrap in DataFrame with column names
    scaled_df = pd.DataFrame(scaled_data, columns=scaler.feature_names_)
    
    return scaled_df, mapped_features['BMI']
