import os
import re
import json
from pathlib import Path
from typing import Dict, List, Set, Tuple
from PIL import Image
import pypdf
import pdfplumber
from google import genai
from dotenv import load_dotenv

# Load env variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

client = None
gemini_available = False

# Configure Gemini if key is present
if GEMINI_API_KEY and GEMINI_API_KEY != "MY_GEMINI_API_KEY":
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        gemini_available = True
    except Exception as e:
        print("Warning: Failed to configure Google Gen AI Client:", e)
        gemini_available = False
else:
    gemini_available = False

def extract_with_gemini(file_path, mime_type):
    """
    Use Gemini 1.5 Flash to extract biomarkers from report (PDF or Image).
    """
    if not client:
        return None
        
    prompt = """
    You are an expert clinical data extractor. Analyze the attached medical report and extract the following patient biometric values.
    Return ONLY a raw JSON object with precisely these keys. Do not include markdown code block formatting (like ```json), just return the raw JSON text.
    
    Keys to extract:
    - glucose (Fasting blood sugar, blood sugar, fasting glucose, or plasma glucose level in mg/dL, integer, e.g. 104)
    - hba1c (Glycated hemoglobin or HbA1c % value, float, e.g. 5.8)
    - bmi (Body Mass Index or BMI value, float, e.g. 26.4)
    - systolic_bp (Systolic blood pressure or Systolic BP, the top number in mmHg, integer, e.g. 125)
    - diastolic_bp (Diastolic blood pressure or Diastolic BP, the bottom number in mmHg, integer, e.g. 80)
    - weight (Weight or body weight in kg, float, e.g. 72.0)
    - height (Height in cm, float, e.g. 165.0)
    - age (Age in years, integer, e.g. 45)
    - gender (Biological sex: 'male' or 'female')
    
    If any value is not mentioned or cannot be found in the document, set its value to null.
    Double check the units. Glucose should be in mg/dL. If it is in mmol/L (e.g. 5.5), convert it to mg/dL by multiplying by 18 (e.g. 5.5 * 18 = 99).
    Height should be in cm (if in meters, convert to cm). Weight should be in kg (if in lbs, convert to kg by dividing by 2.2).
    """
    
    try:
        if mime_type.startswith('image/'):
            img = Image.open(file_path)
            response = client.models.generate_content(
                model='gemini-1.5-flash',
                contents=[img, prompt]
            )
        elif mime_type == 'application/pdf':
            # Upload PDF using Files API
            uploaded_file = client.files.upload(file=str(file_path))
            response = client.models.generate_content(
                model='gemini-1.5-flash',
                contents=[uploaded_file, prompt]
            )
            # Clean up the file reference in generative AI
            try:
                client.files.delete(name=uploaded_file.name)
            except Exception:
                pass
        else:
            return None
            
        # Parse JSON from response text
        text = response.text.strip()
        # Remove any markdown JSON wrapper if the model outputted it
        text = re.sub(r'^```json\s*', '', text, flags=re.MULTILINE)
        text = re.sub(r'\s*```$', '', text, flags=re.MULTILINE)
        
        parsed_json = json.loads(text)
        return parsed_json
    except Exception as e:
        print(f"Error extracting with Gemini: {e}")
        return None

def extract_with_regex(file_path):
    """
    Fallback regex parser to read text from PDFs and match patterns.
    """
    text = ""
    try:
        # Try extracting text using pdfplumber (better layout parser)
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
                    
        # If empty, try pypdf
        if not text.strip():
            with open(file_path, 'rb') as f:
                reader = pypdf.PdfReader(f)
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
    except Exception as e:
        print(f"Error reading PDF with python libraries: {e}")
        return None
        
    if not text.strip():
        return None
        
    text_lower = text.lower()
    
    extracted = {
        "glucose": None,
        "hba1c": None,
        "bmi": None,
        "systolic_bp": None,
        "diastolic_bp": None,
        "weight": None,
        "height": None,
        "age": None,
        "gender": None
    }
    
    # Regex Patterns
    # Glucose: Fasting Glucose / Plasma Glucose / Blood Sugar
    glucose_match = re.search(r'\b(?:plasma\s+glucose|fasting\s+glucose|fasting\s+blood\s+sugar|fasting\s+blood\s+glucose|blood\s+sugar|glucose|glc)\b.*?\b(\d{2,3})\b', text_lower)
    if glucose_match:
        extracted["glucose"] = int(glucose_match.group(1))
        
    # HbA1c / Glycated Hemoglobin
    hba1c_match = re.search(r'\b(?:hba1c|a1c|glycated\s+hemoglobin|glycohemoglobin)\b.*?\b(\d+(?:\.\d+)?)\b', text_lower)
    if hba1c_match:
        extracted["hba1c"] = float(hba1c_match.group(1))
        
    # BMI (Body Mass Index)
    bmi_match = re.search(r'\b(?:bmi|body\s+mass\s+index)\b.*?\b(\d{1,2}(?:\.\d+)?)\b', text_lower)
    if bmi_match:
        extracted["bmi"] = float(bmi_match.group(1))
        
    # Blood Pressure (e.g. 120/80 or 120 / 80)
    bp_match = re.search(r'\b(?:bp|blood\s+pressure)\b.*?\b(\d{2,3})\s*/\s*(\d{2,3})\b', text_lower)
    if not bp_match:
        # Match slash pattern without bp prefix if followed/preceded by mmHg or if it's formatted as BP
        bp_match = re.search(r'\b(\d{2,3})\s*/\s*(\d{2,3})\s*(?:mm\s*hg|mmHg)?\b', text_lower)
        
    if bp_match:
        extracted["systolic_bp"] = int(bp_match.group(1))
        extracted["diastolic_bp"] = int(bp_match.group(2))
    else:
        # Try individual BP components
        sys_match = re.search(r'\b(?:systolic\s+bp|systolic\s+pressure|systolic|sys)\b.*?\b(\d{2,3})\b', text_lower)
        if sys_match:
            extracted["systolic_bp"] = int(sys_match.group(1))
        dia_match = re.search(r'\b(?:diastolic\s+bp|diastolic\s+pressure|diastolic|dia)\b.*?\b(\d{2,3})\b', text_lower)
        if dia_match:
            extracted["diastolic_bp"] = int(dia_match.group(1))
            
    # Height (e.g. height: 170 cm or 1.70 m or height 170)
    height_match = re.search(r'\b(?:height|ht)\b.*?\b(\d{2,3})\s*(?:cm)?\b', text_lower)
    if height_match:
        extracted["height"] = float(height_match.group(1))
    else:
        height_m_match = re.search(r'\b(?:height|ht)\b.*?\b(1\.\d{2})\s*(?:m|meters)?\b', text_lower)
        if height_m_match:
            extracted["height"] = float(height_m_match.group(1)) * 100.0
            
    # Weight (e.g. weight: 75 kg or 165 lbs or weight 75)
    weight_match = re.search(r'\b(?:weight|wt|body\s+weight)\b.*?\b(\d{2,3}(?:\.\d+)?)\s*(?:kg)?\b', text_lower)
    if weight_match:
        extracted["weight"] = float(weight_match.group(1))
    else:
        weight_lbs_match = re.search(r'\b(?:weight|wt|body\s+weight)\b.*?\b(\d{2,3}(?:\.\d+)?)\s*(?:lbs|pounds)\b', text_lower)
        if weight_lbs_match:
            extracted["weight"] = round(float(weight_lbs_match.group(1)) / 2.20462, 1)
            
    # Age
    age_match = re.search(r'\b(?:age|yo|y/o)\b.*?\b(\d{1,3})\b', text_lower)
    if age_match:
        extracted["age"] = int(age_match.group(1))
        
    # Gender
    gender_match = re.search(r'\b(?:gender|sex)\b.*?\b(male|female)\b', text_lower)
    if gender_match:
        extracted["gender"] = gender_match.group(1)
        
    return extracted

def extract_report_biomarkers(file_path, mime_type):
    """
    Main extraction orchestrator: tries Gemini OCR first, falls back to Regex.
    """
    print(f"Extracting biomarkers from {file_path} (Mime: {mime_type})...")
    
    if gemini_available:
        print("Using Gemini 1.5 Flash OCR...")
        extracted_data = extract_with_gemini(file_path, mime_type)
        if extracted_data:
            print("Successfully extracted data with Gemini.")
            return extracted_data
        print("Gemini extraction failed or empty. Falling back to regex parser...")
        
    if mime_type == 'application/pdf':
        print("Using Python regex parser fallback...")
        extracted_data = extract_with_regex(file_path)
        return extracted_data
        
    print("No extraction method succeeded.")
    return None

def extract_raw_text(file_path):
    text = ""
    try:
        # Try extracting text using pdfplumber
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
                    
        # If empty, try pypdf
        if not text.strip():
            with open(file_path, 'rb') as f:
                reader = pypdf.PdfReader(f)
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
    except Exception as e:
        print(f"Error reading raw text: {e}")
    return text

def extract_text_from_image(file_path):
    try:
        import pytesseract
        img = Image.open(file_path)
        return pytesseract.image_to_string(img)
    except Exception as e:
        print(f"Pytesseract extraction failed: {e}")
        return ""


MEDICAL_VALIDATION_THRESHOLD = 0.60
MEDICAL_VALIDATION_RULES_TOTAL = 22

MEDICAL_KEYWORDS = [
    "patient", "hospital", "laboratory", "lab", "diagnostic", "blood test",
    "pathology", "clinical report", "medical record", "doctor", "diagnosis",
    "hba1c", "glucose", "blood glucose", "bmi", "blood pressure", "reference range",
    "age", "gender", "sex", "specimen", "result", "fasting", "plasma",
    "diabetic", "prediabetic", "clinical", "pathologist"
]

MEDICAL_HEADINGS = [
    "patient details", "patient information", "clinical summary", "lab report",
    "laboratory report", "investigation", "test results", "reference range",
    "diagnosis", "impression", "observations", "medical history"
]

MEDICAL_UNITS = ["mg/dl", "mmhg", "mmol/l", "mmol/l", "mmol", "kg/m", "%", "g/dl"]

NON_MEDICAL_RED_FLAGS = [
    "resume", "curriculum vitae", "assignment", "project report", "invoice",
    "book", "notes", "presentation", "problem statement", "hackathon",
    "receipt", "portfolio", "syllabus", "course", "chapter"
]


def _normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "")).strip().lower()


def extract_first_page_text(file_path):
    """Extract text from the first page only (PDF), with fallback parser."""
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            if pdf.pages:
                page_text = pdf.pages[0].extract_text()
                if page_text:
                    text = page_text
    except Exception as e:
        print(f"pdfplumber first-page extraction failed: {e}")

    if text.strip():
        return text

    try:
        with open(file_path, 'rb') as f:
            reader = pypdf.PdfReader(f)
            if reader.pages:
                page_text = reader.pages[0].extract_text()
                if page_text:
                    text = page_text
    except Exception as e:
        print(f"pypdf first-page extraction failed: {e}")

    return text


def _matched_keywords(text_lower: str, keywords: List[str]) -> Set[str]:
    found: Set[str] = set()
    for keyword in keywords:
        if re.search(rf"\b{re.escape(keyword)}\b", text_lower):
            found.add(keyword)
    return found


def evaluate_medical_report_text(text: str) -> Dict[str, object]:
    normalized = _normalize_text(text)
    lines = [line.strip() for line in (text or "").splitlines() if line.strip()]
    title = lines[0].lower() if lines else ""
    headings_blob = " ".join(lines[:20]).lower()

    matched_medical = _matched_keywords(normalized, MEDICAL_KEYWORDS)
    matched_headings = _matched_keywords(headings_blob, MEDICAL_HEADINGS)
    matched_units = _matched_keywords(normalized, MEDICAL_UNITS)
    matched_red_flags = _matched_keywords(normalized, NON_MEDICAL_RED_FLAGS)

    numeric_with_units = re.findall(r"\b\d+(?:\.\d+)?\s*(?:mg/dl|mmhg|mmol/l|%)\b", normalized)
    glucose_pattern = re.search(r"\b(?:glucose|blood\s+glucose|fasting\s+glucose)\b[^\n]{0,40}\b\d{2,3}(?:\.\d+)?\b", normalized)
    hba1c_pattern = re.search(r"\b(?:hba1c|hb\s*a1c)\b[^\n]{0,40}\b\d(?:\.\d+)?\b", normalized)
    bp_pattern = re.search(r"\b\d{2,3}\s*/\s*\d{2,3}\b", normalized)

    rule_checks: List[Tuple[str, bool]] = [
        ("has_patient_term", bool(re.search(r"\bpatient\b", normalized))),
        ("has_hospital_or_lab_term", bool(re.search(r"\b(hospital|laboratory|lab)\b", normalized))),
        ("has_doctor_term", bool(re.search(r"\b(doctor|dr\.|physician|pathologist)\b", normalized))),
        ("has_report_term", bool(re.search(r"\b(report|clinical\s+report|diagnostic|pathology)\b", normalized))),
        ("has_blood_test_term", bool(re.search(r"\b(blood\s+test|laboratory\s+test|test\s+result)\b", normalized))),
        ("has_diabetes_context", bool(re.search(r"\b(diabetes|diabetic|prediabetic|glucose|hba1c)\b", normalized))),
        ("has_demographics", bool(re.search(r"\b(age|gender|sex)\b", normalized))),
        ("has_vitals", bool(re.search(r"\b(bmi|blood\s+pressure|mmhg)\b", normalized))),
        ("has_reference_range", bool(re.search(r"\b(reference\s+range|reference\s+interval|normal\s+range)\b", normalized))),
        ("has_medical_units", len(matched_units) > 0),
        ("has_multiple_lab_values", len(numeric_with_units) >= 2),
        ("has_glucose_value", glucose_pattern is not None),
        ("has_hba1c_value", hba1c_pattern is not None),
        ("has_bp_value", bp_pattern is not None),
        ("title_is_medical", bool(re.search(r"\b(report|laboratory|clinical|diagnostic|medical|pathology)\b", title))),
        ("contains_medical_headings", len(matched_headings) >= 1),
        ("has_patient_section", bool(re.search(r"\b(patient\s+details|patient\s+information|demographics)\b", normalized))),
        ("has_results_section", bool(re.search(r"\b(test\s+result|results|investigation)\b", normalized))),
        ("has_interpretation_section", bool(re.search(r"\b(diagnosis|impression|clinical\s+summary|comment)\b", normalized))),
        ("sufficient_content_length", len(normalized) >= 250),
        ("no_non_medical_red_flags", len(matched_red_flags) == 0),
        ("strong_medical_signal", len(matched_medical) >= 8),
    ]

    passed_rules = sum(1 for _, passed in rule_checks if passed)
    confidence = passed_rules / MEDICAL_VALIDATION_RULES_TOTAL

    hard_gate = (
        len(matched_medical) >= 6 and
        len(matched_red_flags) == 0 and
        len(numeric_with_units) >= 2 and
        (glucose_pattern is not None or hba1c_pattern is not None or bp_pattern is not None) and
        (len(matched_headings) >= 1 or bool(re.search(r"\b(patient\s+details|results|diagnosis)\b", normalized)))
    )

    is_valid = hard_gate and confidence >= MEDICAL_VALIDATION_THRESHOLD
    reason = (
        f"Medical keywords found: {len(matched_medical)}. "
        f"Rules passed: {passed_rules}/{MEDICAL_VALIDATION_RULES_TOTAL}. "
        f"Red flags: {len(matched_red_flags)}."
    )

    return {
        "is_valid": is_valid,
        "confidence": round(confidence, 4),
        "reason": reason,
        "title": lines[0] if lines else "",
        "headings_found": sorted(list(matched_headings)),
        "medical_keywords_found": sorted(list(matched_medical)),
        "red_flags_found": sorted(list(matched_red_flags)),
        "units_found": sorted(list(matched_units)),
        "numeric_values_with_units": len(numeric_with_units),
        "total_rules": MEDICAL_VALIDATION_RULES_TOTAL,
        "passed_rules": passed_rules,
        "threshold": MEDICAL_VALIDATION_THRESHOLD,
        "rule_results": [{"rule": rule_name, "passed": passed} for rule_name, passed in rule_checks],
    }

def classify_with_keywords(text):
    if not text or not text.strip():
        return None, 0.0, "Empty document text"
        
    text_lower = text.lower()
    
    # Medical and laboratory keywords (positive signals)
    medical_keywords = [
        "laboratory", "report", "patient", "specimen", "physician", "result",
        "reference range", "clinical", "pathology", "diagnostic", "test",
        "glucose", "hba1c", "hb a1c", "blood pressure", "systolic", "diastolic",
        "cholesterol", "lipid", "triglycerides", "creatinine", "hemoglobin",
        "urea", "insulin", "thyroid", "cbc", "cmp", "bmp", "platelets", "white blood",
        "red blood", "serum", "plasma", "urine", "doctor", "dr.", "clinic", "hospital",
        "health check", "diagnostic centre", "diagnostics", "lab", "biomarker",
        "blood test", "diagnostic laboratory", "clinical chemistry", "pathology report",
        "specimen type", "reference interval", "collected on"
    ]
    
    # Medical units (positive signals)
    medical_units = [
        "mg/dl", "mmol/l", "g/dl", "mmhg", "pg/ml", "ng/ml", "u/l", "iu/l", "mmol/mol", "%"
    ]
    
    # Red-flag keywords indicating rejected document types
    red_flags = [
        "resume", "curriculum vitae", "portfolio", "invoice", "receipt", "bill", "payment",
        "passport", "license", "licence", "adhaar", "aadhaar", "identity card", "pan card",
        "national id", "bank statement", "transaction", "balance", "offer letter", "appointment letter",
        "experience certificate", "wedding", "marriage", "gpa", "marksheet", "college report",
        "degree", "academic", "transcript", "salary", "pay slip", "payslip", "employee", "coursework"
    ]
    
    pos_count = 0
    neg_count = 0
    
    # Check medical keywords
    for kw in medical_keywords:
        if kw in text_lower:
            pos_count += 1
            
    # Check units
    for unit in medical_units:
        if unit in text_lower:
            pos_count += 1
            
    # Check red flags
    for rf in red_flags:
        if rf in text_lower:
            neg_count += 1
            
    # Calculate score
    score = pos_count - (neg_count * 5)
    
    # Calculate confidence (0.0 to 1.0)
    confidence = 0.0
    if pos_count > 0:
        if neg_count == 0:
            confidence = min(1.0, pos_count / 10.0)
        else:
            confidence = max(0.0, (pos_count - neg_count * 3) / 12.0)
            
    is_valid = score >= 3
    reason = f"Keyword check: {pos_count} positive, {neg_count} negative signals. Score: {score}."
    return is_valid, confidence, reason

def classify_with_gemini(file_path, mime_type):
    """
    Returns (is_medical_report: bool, confidence: float, reason: str)
    """
    if not client:
        return False, 0.0, "Gemini client not configured"
        
    prompt = """
    Analyze the attached document and determine if it is a genuine clinical/medical laboratory test report (e.g., blood test report, pathology report, diagnostic lab report, lipid profile, HbA1c, glucose test, health checkup report, CBC, CMP, etc.).
    
    You MUST reject non-medical documents. Examples of rejected documents: Resumes, CVs, certificates, invoices, receipts, bills, passports, driving licenses, PAN/Aadhaar cards, bank statements, offer letters, appointment letters, experience certificates, wedding cards, academic/college reports, coursework, etc.
    
    Return ONLY a raw JSON object with these keys:
    - is_medical_report: boolean (true if it is a genuine clinical medical lab report, false otherwise)
    - confidence: float between 0.0 and 1.0
    - reason: string explaining your decision briefly
    """
    try:
        if mime_type.startswith('image/'):
            img = Image.open(file_path)
            response = client.models.generate_content(
                model='gemini-1.5-flash',
                contents=[img, prompt]
            )
        elif mime_type == 'application/pdf':
            uploaded_file = client.files.upload(file=str(file_path))
            response = client.models.generate_content(
                model='gemini-1.5-flash',
                contents=[uploaded_file, prompt]
            )
            try:
                client.files.delete(name=uploaded_file.name)
            except Exception:
                pass
        else:
            return False, 0.0, "Unsupported mime type"
            
        text = response.text.strip()
        text = re.sub(r'^```json\s*', '', text, flags=re.MULTILINE)
        text = re.sub(r'\s*```$', '', text, flags=re.MULTILINE)
        
        data = json.loads(text)
        return bool(data.get("is_medical_report")), float(data.get("confidence", 0.0)), str(data.get("reason", ""))
    except Exception as e:
        print(f"Error classifying with Gemini: {e}")
        return False, 0.0, f"Error calling Gemini: {str(e)}"

def validate_medical_report(file_path, mime_type):
    """
    Production-grade pre-OCR medical report validation.
    Returns (is_valid: bool, confidence_score: float, reason: str, details: dict)
    """
    print(f"Validating medical report status of {file_path} (Mime: {mime_type})...")

    if mime_type == 'application/pdf':
        # Per validation flow, inspect first page text before any OCR extraction pipeline.
        extracted_text = extract_first_page_text(file_path)
    elif mime_type.startswith('image/'):
        extracted_text = extract_text_from_image(file_path)
    else:
        details = {
            "is_valid": False,
            "confidence": 0.0,
            "reason": "Unsupported file type for medical validation.",
            "total_rules": MEDICAL_VALIDATION_RULES_TOTAL,
            "passed_rules": 0,
            "threshold": MEDICAL_VALIDATION_THRESHOLD,
            "medical_keywords_found": [],
            "red_flags_found": [],
        }
        return False, 0.0, details["reason"], details

    details = evaluate_medical_report_text(extracted_text)
    print(
        "Validation summary: "
        f"keywords={len(details.get('medical_keywords_found', []))}, "
        f"rules={details.get('passed_rules', 0)}/{details.get('total_rules', MEDICAL_VALIDATION_RULES_TOTAL)}, "
        f"confidence={details.get('confidence', 0.0):.2f}, "
        f"valid={details.get('is_valid', False)}"
    )

    return (
        bool(details.get("is_valid", False)),
        float(details.get("confidence", 0.0)),
        str(details.get("reason", "Medical validation failed.")),
        details,
    )
