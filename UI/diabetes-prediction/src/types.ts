/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PatientData {
  age: number | '';
  gender: 'male' | 'female' | 'other';
  height: number; // in cm
  weight: number; // in kg
  systolicBP: number; // mmHg
  diastolicBP: number; // mmHg
  glucose: number; // mg/dL
  hba1c: number; // % (optional or standard)
  familyHistory: boolean;
  cholesterol: boolean;
  smoking: 'never' | 'former' | 'current';
  activityLevel: 'sedentary' | 'moderate' | 'active';
}

export interface FactorImpact {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  value: string;
  description: string;
}

export interface PredictionResult {
  riskPercentage: number;
  riskLevel: 'Low' | 'Moderate' | 'High';
  recommendations: string[];
  impacts: FactorImpact[];
  calculatedBMI: number;
  clinicalNotes: string;
}
