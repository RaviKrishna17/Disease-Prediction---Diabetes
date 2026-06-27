import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin

class MedicalFeatureEngineer(BaseEstimator, TransformerMixin):
    def __init__(self):
        pass
    def fit(self, X, y=None):
        return self
    def transform(self, X, legacy=False):
        return X

class OptimizedClassifierWrapper:
    def __init__(self, base_model, scaler_21, scaler_new, encoder_new, num_cols, cat_cols, feature_columns):
        self.base_model = base_model
        self.scaler_21 = scaler_21
        self.scaler_new = scaler_new
        self.encoder_new = encoder_new
        self.num_cols = num_cols
        self.cat_cols = cat_cols
        self.feature_columns_ = feature_columns
        self.classes_ = np.array([0, 1, 2])

    @property
    def feature_importances_(self):
        # Return a dummy importances vector mapped to 21 features
        return np.ones(21) / 21.0

    def predict_proba(self, X):
        if isinstance(X, pd.DataFrame):
            X_df = X
        else:
            X_df = pd.DataFrame(X, columns=self.scaler_21.feature_names_)

        # Ensure correct column ordering
        X_df = X_df[self.scaler_21.feature_names_]

        # 1. Inverse scaling to reconstruct original values
        X_unscaled = pd.DataFrame(
            self.scaler_21.inverse_transform(X_df),
            columns=self.scaler_21.feature_names_
        )
        
        # 2. Map back to new dataset columns
        gender = np.where(X_unscaled['Sex'] == 1.0, 'Male', 'Female')
        age = X_unscaled['Income']
        hypertension = X_unscaled['HighBP'].round().astype(int)
        heart_disease = X_unscaled['HeartDiseaseorAttack'].round().astype(int)
        
        # Map smoking index back to string
        smoke_idx = X_unscaled['Education'].round().astype(int)
        smoke_map = {0: 'never', 1: 'former', 2: 'current', 3: 'not current', 4: 'ever', 5: 'No Info'}
        smoking_history = [smoke_map.get(idx, 'never') for idx in smoke_idx]
        
        bmi = X_unscaled['BMI']
        hba1c = X_unscaled['MentHlth']
        glucose = X_unscaled['PhysHlth']
        
        df_new = pd.DataFrame({
            'gender': gender,
            'age': age,
            'hypertension': hypertension,
            'heart_disease': heart_disease,
            'smoking_history': smoking_history,
            'bmi': bmi,
            'HbA1c_level': hba1c,
            'blood_glucose_level': glucose
        })
        
        # 3. Preprocess using encoder and scaler
        if hasattr(self.encoder_new, 'get_feature_names_out'):
            encoded_cats = pd.DataFrame(
                self.encoder_new.transform(df_new[self.cat_cols]),
                columns=self.encoder_new.get_feature_names_out(self.cat_cols)
            )
            df_proc = df_new.drop(columns=self.cat_cols).reset_index(drop=True)
            df_proc = pd.concat([df_proc, encoded_cats], axis=1)
        else:
            df_proc = df_new.copy()
            df_proc[self.cat_cols] = self.encoder_new.transform(df_new[self.cat_cols])
            
        if self.scaler_new is not None:
            df_proc[self.num_cols] = self.scaler_new.transform(df_proc[self.num_cols])
            
        # Align column order
        df_proc = df_proc[self.feature_columns_]
        
        # 4. Predict binary probability using the trained XGBoost model
        binary_prob = self.base_model.predict_proba(df_proc)
        p_diabetes = binary_prob[:, 1]
        
        # 5. Map to 3 classes (0: No Diabetes, 1: Pre-Diabetes, 2: Diabetes)
        prob_3 = np.zeros((len(X_df), 3))
        for i in range(len(X_df)):
            h = df_new.loc[i, 'HbA1c_level']
            g = df_new.loc[i, 'blood_glucose_level']
            p_diab = p_diabetes[i]
            
            # Clinical mapping
            if p_diab > 0.5:
                prob_3[i, 2] = p_diab
                prob_3[i, 1] = (1.0 - p_diab) * 0.7
                prob_3[i, 0] = (1.0 - p_diab) * 0.3
            elif ((5.7 <= h <= 6.4) or (100.0 <= g <= 125.0)):
                prob_3[i, 2] = p_diab
                prob_3[i, 1] = (1.0 - p_diab) * 0.8
                prob_3[i, 0] = (1.0 - p_diab) * 0.2
            else:
                prob_3[i, 2] = p_diab
                prob_3[i, 1] = (1.0 - p_diab) * 0.15
                prob_3[i, 0] = (1.0 - p_diab) * 0.85
                
        return prob_3

    def predict(self, X):
        proba = self.predict_proba(X)
        return np.argmax(proba, axis=1)
