"""
Disease Prediction System - Inference Script (BRFSS2015 Migration)

This script loads the saved trained model and standard scaler, takes 
patient input either from command-line arguments or interactively, 
applies scaling, and outputs a multi-class prediction (No Diabetes / Pre-diabetes / Diabetes)
along with probability confidence scores.
"""

import os
from pathlib import Path
import sys
import pickle
import argparse
import numpy as np
import pandas as pd
import xgboost as xgb

# Setup paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = PROJECT_ROOT / "models"
SCALER_PATH = MODELS_DIR / "scaler.pkl"
MODEL_PATH = MODELS_DIR / "best_diabetes_model.pkl"


FEATURE_NAMES = [
    'HighBP', 'HighChol', 'CholCheck', 'BMI', 'Smoker', 'Stroke',
    'HeartDiseaseorAttack', 'PhysActivity', 'Fruits', 'Veggies',
    'HvyAlcoholConsump', 'AnyHealthcare', 'NoDocbcCost', 'GenHlth',
    'MentHlth', 'PhysHlth', 'DiffWalk', 'Sex', 'Age', 'Education', 'Income'
]

def load_artifacts():
    """
    Load the saved scaler and model from models/ directory.
    """
    if not SCALER_PATH.exists():
        raise FileNotFoundError(f"Scaler file not found at {SCALER_PATH}. Run train.py first.")
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model file not found at {MODEL_PATH}. Run train.py first.")
        
    with open(SCALER_PATH, 'rb') as f:
        scaler = pickle.load(f)
    with open(MODEL_PATH, 'rb') as f:
        model = pickle.load(f)
        
    return scaler, model

def preprocess_input(input_data, scaler):
    """
    Preprocess patient input using the exact parameters saved in the scaler.
    """
    df = pd.DataFrame([input_data])
    
    # Fill any missing values with median values from the scaler (defaulting to sensible defaults)
    default_medians = {
        'HighBP': 0.0, 'HighChol': 0.0, 'CholCheck': 1.0, 'BMI': 27.0, 'Smoker': 0.0,
        'Stroke': 0.0, 'HeartDiseaseorAttack': 0.0, 'PhysActivity': 1.0, 'Fruits': 1.0,
        'Veggies': 1.0, 'HvyAlcoholConsump': 0.0, 'AnyHealthcare': 1.0, 'NoDocbcCost': 0.0,
        'GenHlth': 2.0, 'MentHlth': 0.0, 'PhysHlth': 0.0, 'DiffWalk': 0.0, 'Sex': 0.0,
        'Age': 7.0, 'Education': 5.0, 'Income': 6.0
    }
    
    for col in FEATURE_NAMES:
        if pd.isna(df.loc[0, col]) or df.loc[0, col] is None:
            # Fall back to training medians if saved in scaler, else fallback dictionary
            df.loc[0, col] = getattr(scaler, 'imputer_medians_', pd.Series(default_medians))[col]
            
    # Align column order with training features
    df = df[scaler.feature_names_]
    
    # Scale features
    scaled_features = scaler.transform(df)
    return scaled_features

def get_interactive_input():
    """
    Prompt the user interactively in the terminal to enter patient data.
    """
    print("\n" + "=" * 60)
    print(" PATIENT MEDICAL PROFILE ENTRY FORM (BRFSS2015) ")
    print("=" * 60)
    
    input_data = {}
    
    prompts = {
        'HighBP': 'High Blood Pressure? (0 = No, 1 = Yes): ',
        'HighChol': 'High Cholesterol? (0 = No, 1 = Yes): ',
        'CholCheck': 'Cholesterol check in past 5 years? (0 = No, 1 = Yes): ',
        'BMI': 'Body Mass Index (BMI, e.g. 27.5): ',
        'Smoker': 'Smoked >= 100 cigarettes in life? (0 = No, 1 = Yes): ',
        'Stroke': 'Ever had a stroke? (0 = No, 1 = Yes): ',
        'HeartDiseaseorAttack': 'Coronary Heart Disease or Heart Attack? (0 = No, 1 = Yes): ',
        'PhysActivity': 'Physical activity in past 30 days? (0 = No, 1 = Yes): ',
        'Fruits': 'Consumes fruit >= 1 time/day? (0 = No, 1 = Yes): ',
        'Veggies': 'Consumes vegetables >= 1 time/day? (0 = No, 1 = Yes): ',
        'HvyAlcoholConsump': 'Heavy alcohol drinker? (0 = No, 1 = Yes): ',
        'AnyHealthcare': 'Has any healthcare coverage? (0 = No, 1 = Yes): ',
        'NoDocbcCost': 'Could not see doctor due to cost in past 12m? (0 = No, 1 = Yes): ',
        'GenHlth': 'General health rating (1=Excellent, 2=Very Good, 3=Good, 4=Fair, 5=Poor): ',
        'MentHlth': 'Days with poor mental health in past 30 days (0 - 30): ',
        'PhysHlth': 'Days with poor physical health in past 30 days (0 - 30): ',
        'DiffWalk': 'Serious difficulty walking/climbing stairs? (0 = No, 1 = Yes): ',
        'Sex': 'Gender (0 = Female, 1 = Male): ',
        'Age': 'Age category (1=18-24, 2=25-29, ..., 9=60-64, ..., 13=80+): ',
        'Education': 'Education (1=No KG, 2=Elem, 3=Some HS, 4=HS Grad, 5=Some College, 6=Grad): ',
        'Income': 'Income category (1=<$10k, 2=$10k-$15k, ..., 8=>$75k+): '
    }
    
    for feature in FEATURE_NAMES:
        while True:
            try:
                val_str = input(prompts[feature]).strip()
                if val_str == "":
                    # Sensible defaults
                    if feature in ['BMI']:
                        val = 25.0
                    elif feature in ['CholCheck', 'AnyHealthcare', 'PhysActivity', 'Fruits', 'Veggies']:
                        val = 1.0
                    elif feature in ['GenHlth']:
                        val = 2.0
                    elif feature in ['Age']:
                        val = 7.0
                    elif feature in ['Education']:
                        val = 5.0
                    elif feature in ['Income']:
                        val = 6.0
                    else:
                        val = 0.0
                else:
                    val = float(val_str)
                input_data[feature] = val
                break
            except ValueError:
                print("Invalid input. Please enter a numerical value.")
                
    return input_data

def predict(patient_data):
    """
    Preprocess patient data, predict outcome classes, and display results.
    """
    scaler, model = load_artifacts()
    
    # Preprocess
    preprocessed_features = preprocess_input(patient_data, scaler)
    preprocessed_df = pd.DataFrame(preprocessed_features, columns=scaler.feature_names_)
    
    # Run prediction
    prediction = int(model.predict(preprocessed_df)[0])
    
    try:
        probabilities = model.predict_proba(preprocessed_df)[0]
    except AttributeError:
        probabilities = None
        
    class_labels = ['No Diabetes', 'Pre-Diabetes', 'Diabetes']
    result = class_labels[prediction]
    
    print("\n" + "=" * 50)
    print(" DISEASE PREDICTION RESULT ")
    print("=" * 50)
    print(f"Outcome Prediction:  {result}")
    
    if probabilities is not None:
        print("\nConfidence Scores:")
        for idx, label in enumerate(class_labels):
            marker = "--> " if idx == prediction else "    "
            print(f"  {marker}{label:<15}: {probabilities[idx] * 100:.2f}%")
    print("=" * 50)
    
    return prediction, probabilities

def main():
    parser = argparse.ArgumentParser(description="Predict Diabetes from BRFSS2015 patient parameters.")
    parser.add_argument('--bp', type=float, help='High Blood Pressure (0/1)')
    parser.add_argument('--chol', type=float, help='High Cholesterol (0/1)')
    parser.add_argument('--cholcheck', type=float, help='Cholesterol check past 5y (0/1)')
    parser.add_argument('--bmi', type=float, help='Body Mass Index (BMI)')
    parser.add_argument('--smoker', type=float, help='Smoked >= 100 cigs (0/1)')
    parser.add_argument('--stroke', type=float, help='Ever had stroke (0/1)')
    parser.add_argument('--heartdisease', type=float, help='Coronary heart disease/infarction (0/1)')
    parser.add_argument('--physactivity', type=float, help='Phys activity past 30d (0/1)')
    parser.add_argument('--fruits', type=float, help='Consumes fruit >= 1/d (0/1)')
    parser.add_argument('--veggies', type=float, help='Consumes veggies >= 1/d (0/1)')
    parser.add_argument('--alcohol', type=float, help='Heavy alcohol consumer (0/1)')
    parser.add_argument('--healthcare', type=float, help='Any health insurance (0/1)')
    parser.add_argument('--nodoccost', type=float, help='No doctor visit due to cost (0/1)')
    parser.add_argument('--genhlth', type=float, help='Gen health scale (1-5)')
    parser.add_argument('--menthlth', type=float, help='Mental health days (0-30)')
    parser.add_argument('--physhlth', type=float, help='Physical health days (0-30)')
    parser.add_argument('--diffwalk', type=float, help='Serious walk difficulty (0/1)')
    parser.add_argument('--sex', type=float, help='Gender (0=F, 1=M)')
    parser.add_argument('--age', type=float, help='Age category scale (1-13)')
    parser.add_argument('--education', type=float, help='Education scale (1-6)')
    parser.add_argument('--income', type=float, help='Income scale (1-8)')
    
    args = parser.parse_args()
    
    # Check if any CLI arguments were provided
    cli_provided = any(val is not None for val in vars(args).values())
    
    if cli_provided:
        patient_data = {
            'HighBP': args.bp, 'HighChol': args.chol, 'CholCheck': args.cholcheck, 'BMI': args.bmi,
            'Smoker': args.smoker, 'Stroke': args.stroke, 'HeartDiseaseorAttack': args.heartdisease,
            'PhysActivity': args.physactivity, 'Fruits': args.fruits, 'Veggies': args.veggies,
            'HvyAlcoholConsump': args.alcohol, 'AnyHealthcare': args.healthcare, 'NoDocbcCost': args.nodoccost,
            'GenHlth': args.genhlth, 'MentHlth': args.menthlth, 'PhysHlth': args.physhlth,
            'DiffWalk': args.diffwalk, 'Sex': args.sex, 'Age': args.age, 'Education': args.education,
            'Income': args.income
        }
    else:
        patient_data = get_interactive_input()
        
    predict(patient_data)

if __name__ == '__main__':
    main()
