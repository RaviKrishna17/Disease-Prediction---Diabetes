import unittest
import json
import os
import sys
from pathlib import Path

# Add backend dir to python path
BACKEND_DIR = Path(__file__).resolve().parent
sys.path.append(str(BACKEND_DIR))

# Mock environmental vars before importing packages
os.environ["FLASK_ENV"] = "testing"

from model_loader import load_artifacts
from preprocess import prepare_input_features, preprocess_and_scale
from app import app

class BackendTestSuite(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        # Clean up test users once before running the test suite to avoid duplicate key errors
        from database import SessionLocal
        from database.models import User, Session as DBSession
        db = SessionLocal()
        try:
            usernames = ["user_email_only", "user_with_phone", "another_user", "another_user_phone", "debug_user"]
            # Delete active sessions for these users first to satisfy foreign key constraints
            users = db.query(User).filter(User.username.in_(usernames)).all()
            user_ids = [u.id for u in users]
            if user_ids:
                db.query(DBSession).filter(DBSession.user_id.in_(user_ids)).delete(synchronize_session=False)
                db.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session=False)
            db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()

    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True
        
    def test_01_model_loading(self):
        """Verify model files exist and load successfully."""
        try:
            scaler, model = load_artifacts()
            self.assertIsNotNone(scaler, "Scaler failed to load")
            self.assertIsNotNone(model, "XGBoost Model failed to load")
        except Exception as e:
            self.fail(f"Artifact loading raised exception: {e}")
            
    def test_02_feature_mapping(self):
        """Verify frontend inputs map to the correct 21 features with boundaries."""
        sample_input = {
            "age": 45,
            "gender": "male",
            "height": 175,
            "weight": 80,
            "systolicBP": 135,
            "diastolicBP": 85,
            "glucose": 115,
            "hba1c": 6.1,
            "familyHistory": True,
            "cholesterol": True,
            "smoking": "former",
            "activityLevel": "moderate"
        }
        
        mapped = prepare_input_features(sample_input)
        
        # Verify 21 features are present
        self.assertEqual(len(mapped), 21)
        self.assertEqual(mapped['HighBP'], 1.0) # Systolic >= 130 or Diastolic >= 85
        self.assertEqual(mapped['HighChol'], 1.0) # Cholesterol is true
        self.assertEqual(mapped['Sex'], 1.0) # Male -> 1.0
        self.assertEqual(mapped['Age'], 6.0) # 45 years -> Category 6 (45-49)
        self.assertEqual(mapped['Smoker'], 1.0) # former -> 1.0
        self.assertEqual(mapped['PhysActivity'], 1.0) # moderate -> 1.0
        self.assertAlmostEqual(mapped['BMI'], 26.12, places=1) # 80 / (1.75 * 1.75) = 26.12
        
    def test_03_prediction_endpoint(self):
        """Verify the POST /predict endpoint parses inputs and returns predictions."""
        sample_input = {
            "age": 45,
            "gender": "male",
            "height": 175,
            "weight": 80,
            "systolicBP": 135,
            "diastolicBP": 85,
            "glucose": 115,
            "hba1c": 6.1,
            "familyHistory": True,
            "cholesterol": True,
            "smoking": "former",
            "activityLevel": "moderate"
        }
        
        response = self.app.post(
            '/predict',
            data=json.dumps(sample_input),
            content_type='application/json',
            headers={"X-User-UID": "test_user_123"}
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data.decode('utf-8'))
        
        # Verify expected fields
        self.assertIn("prediction", data)
        self.assertIn("risk", data)
        self.assertIn("probability", data)
        self.assertIn("confidence", data)
        self.assertIn("recommendation", data)
        self.assertIn("riskPercentage", data)
        self.assertIn("riskLevel", data)
        self.assertIn("clinicalNotes", data)
        self.assertIn("impacts", data)
        
        # Verify predictions match expectations
        self.assertIn(data["riskLevel"], ["Low", "Moderate", "High"])
        self.assertGreaterEqual(len(data["recommendation"]), 1)
        
    def test_04_profile_endpoints(self):
        """Verify GET and POST for patient profile endpoints."""
        # 1. Post profile update
        profile_data = {
            "name": "Alex Smith",
            "email": "alexsmith@gmail.com",
            "phone": "+1 (555) 000-1111",
            "bloodGroup": "A-Positive (A+)"
        }
        
        post_response = self.app.post(
            '/profile',
            data=json.dumps(profile_data),
            content_type='application/json',
            headers={"X-User-UID": "test_user_alex"}
        )
        self.assertEqual(post_response.status_code, 200)
        
        # 2. Get profile and verify matches
        get_response = self.app.get('/profile', headers={"X-User-UID": "test_user_alex"})
        self.assertEqual(get_response.status_code, 200)
        retrieved = json.loads(get_response.data.decode('utf-8'))
        self.assertEqual(retrieved["name"], "Alex Smith")
        self.assertEqual(retrieved["email"], "alexsmith@gmail.com")
        self.assertEqual(retrieved["bloodGroup"], "A-Positive (A+)")
        
    def test_05_history_endpoint(self):
        """Verify GET /history pulls prediction logs correctly."""
        # Query history
        response = self.app.get('/history', headers={"X-User-UID": "test_user_123"})
        self.assertEqual(response.status_code, 200)
        history = json.loads(response.data.decode('utf-8'))
        
        # We should have at least 1 item in history since test_03 posted for test_user_123
        self.assertGreaterEqual(len(history), 1)
        self.assertEqual(history[0]["riskLevel"], history[0]["risk"])

    def test_06_validation_scenarios(self):
        """Verify missing fields throw correct validation messages based on hasReport."""
        # 1. Missing height, manual form workflow (no report)
        payload_manual = {
            "age": 45,
            "gender": "male",
            "height": "",  # Missing
            "weight": 80,
            "systolicBP": 135,
            "diastolicBP": 85,
            "glucose": 115,
            "hba1c": 6.1,
            "hasReport": False
        }
        response = self.app.post(
            '/predict',
            data=json.dumps(payload_manual),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data.decode('utf-8'))
        self.assertIn("Please enter Height manually.", data.get("error", ""))

        # 2. Missing height, report workflow
        payload_report = {
            "age": 45,
            "gender": "male",
            "height": "",  # Missing
            "weight": 80,
            "systolicBP": 135,
            "diastolicBP": 85,
            "glucose": 115,
            "hba1c": 6.1,
            "hasReport": True
        }
        response = self.app.post(
            '/predict',
            data=json.dumps(payload_report),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data.decode('utf-8'))
        self.assertIn("Please enter Height manually because it was not found in the uploaded report.", data.get("error", ""))

    def test_07_auth_signup_email_only(self):
        """Verify signup using email only succeeds and stores phone number as null."""
        signup_data = {
            "username": "user_email_only",
            "email": "user_email_only@example.com",
            "phone": "",  # Empty string (should be stored as NULL)
            "password": "Password123!",
            "confirmPassword": "Password123!"
        }
        response = self.app.post(
            '/auth/signup',
            data=json.dumps(signup_data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data.decode('utf-8'))
        self.assertTrue(data.get("success"))
        
        # Verify user is in database with NULL phone number
        from database import SessionLocal
        from database.models import User
        db = SessionLocal()
        try:
            db_user = db.query(User).filter(User.username == "user_email_only").first()
            self.assertIsNotNone(db_user)
            self.assertIsNone(db_user.phone_number)
        finally:
            db.close()

    def test_08_auth_signup_with_phone(self):
        """Verify signup with phone number succeeds."""
        signup_data = {
            "username": "user_with_phone",
            "email": "user_with_phone@example.com",
            "phone": "+1234567890",
            "password": "Password123!",
            "confirmPassword": "Password123!"
        }
        response = self.app.post(
            '/auth/signup',
            data=json.dumps(signup_data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data.decode('utf-8'))
        self.assertTrue(data.get("success"))
        
        # Verify user is in database with clean phone number
        from database import SessionLocal
        from database.models import User
        db = SessionLocal()
        try:
            db_user = db.query(User).filter(User.username == "user_with_phone").first()
            self.assertIsNotNone(db_user)
            self.assertEqual(db_user.phone_number, "+1234567890")
        finally:
            db.close()

    def test_09_auth_signup_duplicate_email(self):
        """Verify signup with duplicate email fails with 400 and friendly error."""
        # Email "user_email_only@example.com" already signed up in test_07
        signup_data = {
            "username": "another_user",
            "email": "user_email_only@example.com",
            "phone": "",
            "password": "Password123!",
            "confirmPassword": "Password123!"
        }
        response = self.app.post(
            '/auth/signup',
            data=json.dumps(signup_data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data.decode('utf-8'))
        self.assertEqual(data.get("error"), "Email already registered.")

    def test_10_auth_signup_duplicate_phone(self):
        """Verify signup with duplicate phone fails with 409 and friendly error."""
        # Phone "+1234567890" already signed up in test_08
        signup_data = {
            "username": "another_user_phone",
            "email": "another_phone@example.com",
            "phone": "+1234567890",
            "password": "Password123!",
            "confirmPassword": "Password123!"
        }
        response = self.app.post(
            '/auth/signup',
            data=json.dumps(signup_data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 409)
        data = json.loads(response.data.decode('utf-8'))
        self.assertEqual(data.get("error"), "Phone number already registered.")

    def test_11_auth_google_login_errors(self):
        """Verify GET /auth/google/login validation behavior."""
        response = self.app.get('/auth/google/login')
        # Depending on env setup, this can be 302 (redirect) or 400 (missing variables)
        self.assertIn(response.status_code, [302, 400])
        if response.status_code == 400:
            data = json.loads(response.data.decode('utf-8'))
            self.assertTrue(data.get("error").startswith("Missing "))

    def test_12_password_login_session_logout(self):
        """Verify full flow: Login -> Session verification -> Logout."""
        # 1. Login with user_email_only credentials (from test_07)
        login_data = {
            "emailOrPhone": "user_email_only@example.com",
            "password": "Password123!",
            "rememberMe": True
        }
        login_response = self.app.post(
            '/auth/login',
            data=json.dumps(login_data),
            content_type='application/json'
        )
        self.assertEqual(login_response.status_code, 200)
        login_ret = json.loads(login_response.data.decode('utf-8'))
        token = login_ret.get("token")
        self.assertIsNotNone(token)
        
        # 2. Verify Session
        session_response = self.app.get(
            '/auth/session',
            headers={
                "Authorization": f"Bearer {token}",
                "X-User-UID": str(login_ret.get("uid"))
            }
        )
        self.assertEqual(session_response.status_code, 200)
        session_ret = json.loads(session_response.data.decode('utf-8'))
        self.assertTrue(session_ret.get("success"))
        self.assertEqual(session_ret.get("user", {}).get("email"), "user_email_only@example.com")
        
        # 3. Logout
        logout_response = self.app.post(
            '/auth/logout',
            headers={
                "Authorization": f"Bearer {token}",
                "X-User-UID": str(login_ret.get("uid"))
            }
        )
        self.assertEqual(logout_response.status_code, 200)
        logout_ret = json.loads(logout_response.data.decode('utf-8'))
        self.assertTrue(logout_ret.get("success"))

    def test_13_medical_report_validation_success(self):
        """Verify that a genuine medical report text passes validation."""
        from pdf_extractor import classify_with_keywords
        valid_text = """
        METROPOLIS DIAGNOSTIC LABORATORY
        Patient Name: Jane Doe   Age: 45   Gender: Female
        Specimen: Fasting Blood Serum
        Test Name             Result      Reference Range      Units
        Fasting Glucose       110         70 - 100             mg/dL
        HbA1c                 5.8         4.0 - 5.6            %
        Systolic BP           125         < 120                mmHg
        Diastolic BP          82          < 80                 mmHg
        """
        is_valid, conf, reason = classify_with_keywords(valid_text)
        self.assertTrue(is_valid)
        self.assertGreaterEqual(conf, 0.4)

    def test_14_medical_report_validation_failure(self):
        """Verify that a resume, invoice, or certificate text fails validation."""
        from pdf_extractor import classify_with_keywords
        resume_text = """
        John Doe Resume
        Education: Bachelor of Science in Computer Science
        GPA: 3.8/4.0
        Experience: Software Engineer Intern
        Skills: Python, Javascript, React, SQL
        Contact: john.doe@email.com
        """
        is_valid, conf, reason = classify_with_keywords(resume_text)
        self.assertFalse(is_valid)
        self.assertEqual(conf, 0.0)

        invoice_text = """
        INVOICE #INV-2026-001
        Date: June 26, 2026
        Bill To: Acme Corp
        Item Description       Quantity      Unit Price      Total
        Software Development   40 hours      $100            $4,000
        Total Due: $4,000
        Payment Terms: Net 30
        """
        is_valid_inv, conf_inv, reason_inv = classify_with_keywords(invoice_text)
        self.assertFalse(is_valid_inv)
        self.assertEqual(conf_inv, 0.0)

    def test_15_upload_report_validation_endpoint_rejection(self):
        """Verify POST /upload-report endpoint rejects non-medical text files."""
        import io
        file_data = {
            'file': (io.BytesIO(b"John Doe Resume\nExperience: Python Developer\nGPA: 3.9"), "resume.pdf")
        }
        response = self.app.post(
            '/upload-report',
            data=file_data,
            content_type='multipart/form-data'
        )
        self.assertEqual(response.status_code, 422)
        data = json.loads(response.data.decode('utf-8'))
        self.assertEqual(data.get("error"), "This file does not appear to be a medical laboratory report. Please upload a valid blood test or diabetes medical report.")

if __name__ == '__main__':
    unittest.main()
