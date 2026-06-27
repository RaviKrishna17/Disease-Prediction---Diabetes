/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, Sparkles, AlertCircle, RefreshCw, CheckCircle, 
  ChevronRight, ArrowLeftRight, HeartPulse, Heart, ShieldAlert,
  User, Scale, Droplet, UploadCloud, Shield, Check, Flame, Info, Trash2, FileText, Stethoscope
} from 'lucide-react';
import { PatientData, PredictionResult, FactorImpact } from '../types';
import { useHistory } from '../lib/firebase';

interface TooltipContent {
  title: string;
  definition: string;
  whereToFind: string[];
  checkOnline: {
    canCheck: 'Yes' | 'No';
    explanation: string;
  };
  measureAtHome: {
    canMeasure: 'Yes' | 'No' | 'Calculated Automatically';
    device?: string;
  };
  canCalculateAutomatically: boolean;
  healthyRange: string;
  example: string;
  learnMoreUrl: string;
  learnMoreSource: string;
}

const tooltipData: Record<string, TooltipContent> = {
  age: {
    title: 'Age',
    definition: 'How old you are in years. As we grow older, our bodies process sugar differently.',
    whereToFind: ['Your ID or birth certificate', 'Your personal health records'],
    checkOnline: {
      canCheck: 'No',
      explanation: 'Your age is based on your birth date and cannot be measured online.'
    },
    measureAtHome: {
      canMeasure: 'Yes',
      device: 'Your birth certificate or personal records'
    },
    canCalculateAutomatically: false,
    healthyRange: 'Any age',
    example: 'If you are 45 years old, enter: 45',
    learnMoreUrl: 'https://medlineplus.gov/olderadulthealth.html',
    learnMoreSource: 'MedlinePlus'
  },
  gender: {
    title: 'Gender',
    definition: 'Your birth sex. Men and women can have different natural hormone levels.',
    whereToFind: ['Your health card or birth certificate'],
    checkOnline: {
      canCheck: 'No',
      explanation: 'Your birth sex cannot be measured online.'
    },
    measureAtHome: {
      canMeasure: 'Yes',
      device: 'Your official birth sex category'
    },
    canCalculateAutomatically: false,
    healthyRange: 'N/A',
    example: 'Select Female, Male, or Other.',
    learnMoreUrl: 'https://medlineplus.gov/sexdevelopmentdisorders.html',
    learnMoreSource: 'MedlinePlus'
  },
  height: {
    title: 'Height',
    definition: 'How tall you are from head to toe, measured in centimeters.',
    whereToFind: ['Your school, gym, or doctor measurements'],
    checkOnline: {
      canCheck: 'No',
      explanation: 'This cannot be measured online. You need to measure yourself.'
    },
    measureAtHome: {
      canMeasure: 'Yes',
      device: 'Measuring tape'
    },
    canCalculateAutomatically: false,
    healthyRange: 'N/A',
    example: 'If you are 170 centimeters tall, enter: 170',
    learnMoreUrl: 'https://medlineplus.gov/ency/article/001910.htm',
    learnMoreSource: 'MedlinePlus'
  },
  weight: {
    title: 'Body Weight',
    definition: 'How much you weigh, measured in kilograms.',
    whereToFind: ['Your home scale or doctor records'],
    checkOnline: {
      canCheck: 'No',
      explanation: 'This cannot be measured online. You need to use a weighing scale.'
    },
    measureAtHome: {
      canMeasure: 'Yes',
      device: 'Digital weight scale'
    },
    canCalculateAutomatically: false,
    healthyRange: 'Varies by person',
    example: 'If your scale reads 70 kilograms, enter: 70',
    learnMoreUrl: 'https://www.mayoclinic.org/healthy-lifestyle/weight-loss/in-depth/healthy-weight/art-20044431',
    learnMoreSource: 'Mayo Clinic'
  },
  bmi: {
    title: 'Body Mass Index (BMI)',
    definition: 'A simple calculation that compares your height and weight. It helps estimate if your weight is in a healthy range.',
    whereToFind: ['Calculated automatically right here'],
    checkOnline: {
      canCheck: 'Yes',
      explanation: 'Yes! It is calculated automatically once you type in your height and weight.'
    },
    measureAtHome: {
      canMeasure: 'Calculated Automatically',
      device: 'Height and weight home measurements'
    },
    canCalculateAutomatically: true,
    healthyRange: '18.5 to 24.9',
    example: 'Calculated automatically from your height and weight.',
    learnMoreUrl: 'https://www.mayoclinic.org/healthy-lifestyle/weight-loss/in-depth/bmi/art-20046161',
    learnMoreSource: 'Mayo Clinic'
  },
  glucose: {
    title: 'Blood Sugar Level',
    definition: 'The amount of sugar in your blood. This is usually measured in the morning before you eat anything (fasting).',
    whereToFind: ['Your latest blood test report (fasting glucose)', 'Your home sugar monitor'],
    checkOnline: {
      canCheck: 'No',
      explanation: 'This cannot be checked online. It requires a physical blood test.'
    },
    measureAtHome: {
      canMeasure: 'Yes',
      device: 'Home blood sugar monitor'
    },
    canCalculateAutomatically: false,
    healthyRange: 'Under 100 mg/dL is considered healthy',
    example: 'If your report shows a fasting sugar of 95, enter: 95',
    learnMoreUrl: 'https://medlineplus.gov/bloodglucose.html',
    learnMoreSource: 'MedlinePlus'
  },
  hba1c: {
    title: 'Long-Term Blood Sugar',
    definition: 'A simple blood test that shows your average blood sugar over the last 2 to 3 months. It is the best way to track your sugar history.',
    whereToFind: ['Your latest lab test report (HbA1c)'],
    checkOnline: {
      canCheck: 'No',
      explanation: 'This cannot be checked online. It requires a medical lab test.'
    },
    measureAtHome: {
      canMeasure: 'No'
    },
    canCalculateAutomatically: false,
    healthyRange: 'Under 5.7% is considered healthy',
    example: 'If your report says HbA1c is 5.4%, enter: 5.4',
    learnMoreUrl: 'https://medlineplus.gov/a1c.html',
    learnMoreSource: 'MedlinePlus'
  },
  systolicBP: {
    title: 'Blood Pressure (Top Number)',
    definition: 'The blood pressure when your heart is pumping blood. This is the top or first number on your monitor.',
    whereToFind: ['Your home blood pressure monitor', 'A doctor checkup report'],
    checkOnline: {
      canCheck: 'No',
      explanation: 'This cannot be measured online. It requires a blood pressure cuff.'
    },
    measureAtHome: {
      canMeasure: 'Yes',
      device: 'Digital blood pressure monitor'
    },
    canCalculateAutomatically: false,
    healthyRange: 'Under 120 is considered normal',
    example: 'If your blood pressure is 118 / 76, the top number is 118. Enter: 118',
    learnMoreUrl: 'https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings',
    learnMoreSource: 'American Heart Association'
  },
  diastolicBP: {
    title: 'Blood Pressure (Bottom Number)',
    definition: 'The blood pressure when your heart is resting between beats. This is the bottom or second number on your monitor.',
    whereToFind: ['Your home blood pressure monitor', 'A doctor checkup report'],
    checkOnline: {
      canCheck: 'No',
      explanation: 'This cannot be measured online. It requires a blood pressure cuff.'
    },
    measureAtHome: {
      canMeasure: 'Yes',
      device: 'Digital blood pressure monitor'
    },
    canCalculateAutomatically: false,
    healthyRange: 'Under 80 is considered normal',
    example: 'If your blood pressure is 118 / 76, the bottom number is 76. Enter: 76',
    learnMoreUrl: 'https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings',
    learnMoreSource: 'American Heart Association'
  },
  highBP: {
    title: 'High Blood Pressure',
    definition: 'Whether a doctor has told you that you have high blood pressure, or if you take blood pressure medication.',
    whereToFind: ['Your doctor prescriptions', 'Medical history records'],
    checkOnline: {
      canCheck: 'No',
      explanation: 'Cannot be diagnosed online.'
    },
    measureAtHome: {
      canMeasure: 'Yes',
      device: 'Digital blood pressure monitor'
    },
    canCalculateAutomatically: false,
    healthyRange: 'No history of high blood pressure',
    example: 'Check this box if you have high blood pressure or take blood pressure pills.',
    learnMoreUrl: 'https://www.mayoclinic.org/diseases-conditions/high-blood-pressure/symptoms-causes/syc-20370341',
    learnMoreSource: 'Mayo Clinic'
  },
  cholesterol: {
    title: 'High Cholesterol',
    definition: 'Whether a doctor has told you that you have high cholesterol, or if you take pills to lower your cholesterol.',
    whereToFind: ['Your doctor prescriptions', 'Blood test reports'],
    checkOnline: {
      canCheck: 'No',
      explanation: 'Cannot be diagnosed online.'
    },
    measureAtHome: {
      canMeasure: 'No'
    },
    canCalculateAutomatically: false,
    healthyRange: 'Normal cholesterol levels',
    example: 'Check this box if your doctor told you that your cholesterol is high.',
    learnMoreUrl: 'https://medlineplus.gov/cholesterollevelshatyouneedtoknow.html',
    learnMoreSource: 'MedlinePlus'
  },
  familyHistory: {
    title: 'Family Diabetes History',
    definition: 'Whether your parents, brothers, or sisters have been diagnosed with diabetes.',
    whereToFind: ['Conversations with your family members'],
    checkOnline: {
      canCheck: 'No',
      explanation: 'This is family history, so it cannot be measured online.'
    },
    measureAtHome: {
      canMeasure: 'Yes',
      device: 'Direct family history inquiry'
    },
    canCalculateAutomatically: false,
    healthyRange: 'No family history',
    example: 'Check this box if your biological mother, father, or siblings have diabetes.',
    learnMoreUrl: 'https://www.diabetes.org/about-diabetes/genetics-diabetes',
    learnMoreSource: 'American Diabetes Association'
  },
  heartDisease: {
    title: 'Heart Disease',
    definition: 'Whether you have ever had a heart attack, chest pain, or have been diagnosed with heart conditions.',
    whereToFind: ['Your doctor or hospital medical history'],
    checkOnline: {
      canCheck: 'No',
      explanation: 'Cannot be diagnosed online.'
    },
    measureAtHome: {
      canMeasure: 'No'
    },
    canCalculateAutomatically: false,
    healthyRange: 'No history of heart conditions',
    example: 'Check this box if you have a diagnosed heart condition.',
    learnMoreUrl: 'https://www.mayoclinic.org/diseases-conditions/heart-disease/symptoms-causes/syc-20353118',
    learnMoreSource: 'Mayo Clinic'
  },
  strokeHistory: {
    title: 'Stroke History',
    definition: 'Whether you have ever had a stroke or a mini-stroke (TIA) in the past.',
    whereToFind: ['Your medical history records'],
    checkOnline: {
      canCheck: 'No',
      explanation: 'Cannot be diagnosed online.'
    },
    measureAtHome: {
      canMeasure: 'No'
    },
    canCalculateAutomatically: false,
    healthyRange: 'No stroke history',
    example: 'Check this box if you have had a stroke or mini-stroke.',
    learnMoreUrl: 'https://medlineplus.gov/stroke.html',
    learnMoreSource: 'MedlinePlus'
  },
  cholesterolChecked: {
    title: 'Recent Cholesterol Check',
    definition: 'Whether you have had your cholesterol checked by a doctor or blood test in the past 5 years.',
    whereToFind: ['Your blood test records or checkup history'],
    checkOnline: {
      canCheck: 'No',
      explanation: 'Cannot be checked online.'
    },
    measureAtHome: {
      canMeasure: 'No'
    },
    canCalculateAutomatically: false,
    healthyRange: 'Yes, checked within the last 5 years',
    example: 'Check this box if you have had a cholesterol blood test in the last 5 years.',
    learnMoreUrl: 'https://www.nhlbi.nih.gov/health/blood-cholesterol/screening',
    learnMoreSource: 'National Institutes of Health (NIH)'
  }
};

interface TooltipPortalContentProps {
  id: string;
  data: TooltipContent;
  anchor: HTMLElement;
  onClose: () => void;
}

function TooltipPortalContent({ id, data, anchor, onClose }: TooltipPortalContentProps) {
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updatePosition = () => {
      const rect = anchor.getBoundingClientRect();
      const tooltipEl = tooltipRef.current;
      if (!tooltipEl) return;

      const tooltipWidth = Math.min(340, window.innerWidth - 32);
      const tooltipHeight = tooltipEl.offsetHeight;

      // Determine horizontal positioning: center align first
      let left = rect.left + rect.width / 2 - tooltipWidth / 2;
      if (left < 16) {
        left = 16;
      } else if (left + tooltipWidth > window.innerWidth - 16) {
        left = window.innerWidth - tooltipWidth - 16;
      }

      // Determine vertical positioning: prefer below, flip to above if space is tight
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      let topFixed = rect.bottom + 8;
      if (spaceBelow < tooltipHeight + 16 && spaceAbove > spaceBelow) {
        // Show above
        topFixed = rect.top - tooltipHeight - 8;
      }

      // Safeguard boundaries
      if (topFixed < 8) {
        topFixed = 8;
      } else if (topFixed + tooltipHeight > window.innerHeight - 8) {
        topFixed = window.innerHeight - tooltipHeight - 8;
      }

      setCoords({ top: topFixed, left });
    };

    updatePosition();

    // ResizeObserver ensures updates when contents or layout render asynchronously
    const resizeObserver = new ResizeObserver(() => {
      updatePosition();
    });
    if (tooltipRef.current) {
      resizeObserver.observe(tooltipRef.current);
    }

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchor, data]);

  // Handle click outside to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node) && !anchor.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [anchor, onClose]);

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none" id={`portal-container-${id}`}>
      <motion.div
        ref={tooltipRef}
        initial={{ opacity: 0, scale: 0.95, y: 5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 5 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        style={{
          top: `${coords.top}px`,
          left: `${coords.left}px`,
        }}
        className="absolute pointer-events-auto w-[calc(100vw-32px)] xs:w-[340px] rounded-2xl border border-cyan-500/30 bg-slate-950/95 backdrop-blur-md p-5 text-white shadow-[0_20px_50px_rgba(0,0,0,0.85)] text-left flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Info className="h-4 w-4 shrink-0" />
            </div>
            <h4 className="font-display text-xs font-extrabold tracking-wider uppercase text-cyan-400">
              {data.title}
            </h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer inline-flex items-center justify-center"
          >
            <span className="text-sm font-bold font-mono">✕</span>
          </button>
        </div>

        {/* Content sections */}
        <div className="space-y-4 text-xs text-gray-300 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-cyan-500/20">
          {/* 1. What is this? */}
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider font-mono">1. What is this?</p>
            <p className="leading-relaxed text-gray-200">{data.definition}</p>
          </div>

          {/* 2. Where can I find this value? */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider font-mono">2. Where can I find this value?</p>
            <ul className="space-y-1">
              {data.whereToFind.map((source, idx) => (
                <li key={idx} className="flex items-center gap-1.5 text-gray-200">
                  <span className="text-emerald-400 font-mono text-xs">✔</span>
                  <span>{source}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Can I check this online? */}
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider font-mono">3. Can I check this online?</p>
            {data.checkOnline.canCheck === 'Yes' ? (
              <p className="leading-relaxed text-emerald-400 font-semibold">{data.checkOnline.explanation}</p>
            ) : (
              <p className="leading-relaxed text-gray-400">
                This value cannot be measured online. <br />
                It requires a medical device or laboratory test.
              </p>
            )}
          </div>

          {/* 4. Can I measure it at home? */}
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider font-mono">4. Can I measure it at home?</p>
            <div className="flex items-center gap-1.5">
              {data.measureAtHome.canMeasure === 'Yes' || data.measureAtHome.canMeasure === 'Calculated Automatically' ? (
                <>
                  <span className="text-emerald-400 font-mono text-xs font-bold">✔ Yes</span>
                  {data.measureAtHome.device && (
                    <span className="text-[11px] text-cyan-300 font-medium">({data.measureAtHome.device})</span>
                  )}
                </>
              ) : (
                <span className="text-rose-400 font-mono text-xs font-bold">✖ No</span>
              )}
            </div>
          </div>

          {/* 5. Can this be calculated automatically? */}
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider font-mono">5. Can this be calculated automatically?</p>
            <p className="leading-relaxed text-gray-200">
              {data.canCalculateAutomatically ? (
                <span className="text-cyan-300 font-medium">This value is calculated automatically after entering the required inputs.</span>
              ) : (
                <span className="text-gray-400">This value cannot be calculated automatically.</span>
              )}
            </p>
          </div>

          {/* 6. Healthy Range */}
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider font-mono">6. Healthy Range</p>
            <p className="text-emerald-400 font-bold font-mono">{data.healthyRange}</p>
          </div>

          {/* 7. Example */}
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider font-mono">7. Example</p>
            <div className="bg-slate-900/60 rounded-xl p-2.5 border border-white/5 space-y-1">
              <p className="text-[10px] text-gray-400 uppercase font-mono">Your Report / Value</p>
              <p className="text-gray-300 italic">{data.example}</p>
            </div>
          </div>

          {/* 8. Learn More */}
          <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
            <a
              href={data.learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/40 hover:text-cyan-300 transition-all font-semibold text-xs text-center cursor-pointer group"
            >
              <span>Learn more about this measurement</span>
              <span className="text-[10px] text-cyan-400/60 font-mono group-hover:translate-x-0.5 transition-transform">({data.learnMoreSource}) ↗</span>
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

interface MedicalCheckboxProps {
  checked: boolean;
}

function MedicalCheckbox({ checked }: MedicalCheckboxProps) {
  return (
    <div className="relative shrink-0 flex items-center justify-center">
      <motion.div
        animate={{ 
          scale: checked ? [0.9, 1.05, 1] : 1,
        }}
        transition={{ 
          duration: 0.2,
          ease: "easeOut"
        }}
        className={`w-5 h-5 rounded-[6px] flex items-center justify-center transition-all duration-200 cursor-pointer ${
          checked
            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 border border-transparent shadow-[0_0_12px_rgba(6,182,212,0.5)]'
            : 'bg-slate-950/60 border border-slate-700 group-hover:border-cyan-400/50 group-hover:shadow-[0_0_8px_rgba(6,182,212,0.2)]'
        }`}
      >
        {checked && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="flex items-center justify-center"
          >
            <Check 
              className="h-3.5 w-3.5 text-white stroke-[3.5px] !text-white" 
              style={{ color: '#FFFFFF' }} 
              stroke="#FFFFFF" 
            />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default function Prediction() {
  const { addPredictionRecord } = useHistory();
  // 1. Core input states
  const [formData, setFormData] = useState<PatientData>({
    age: '',
    gender: 'female',
    height: 165,
    weight: 72,
    systolicBP: 125,
    diastolicBP: 80,
    glucose: 104,
    hba1c: 5.8,
    familyHistory: true,
    cholesterol: false,
    smoking: 'never',
    activityLevel: 'moderate',
  });

  // 2. Auxiliary states
  const [calculatedBMI, setCalculatedBMI] = useState<number>(26.4);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [result, setResult] = useState<PredictionResult | null>(null);

  // 3. Redesign extra medical states
  const [heartDisease, setHeartDisease] = useState(false);
  const [strokeHistory, setStrokeHistory] = useState(false);
  const [cholesterolChecked, setCholesterolChecked] = useState(true);

  // 4. File Upload states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parsingStepText, setParsingStepText] = useState('');

  // 5. Info Tooltip State & Renderer
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [tooltipAnchor, setTooltipAnchor] = useState<HTMLElement | null>(null);

  const toggleTooltip = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    e.stopPropagation();
    if (activeTooltip === id) {
      setActiveTooltip(null);
      setTooltipAnchor(null);
    } else {
      setActiveTooltip(id);
      setTooltipAnchor(e.currentTarget);
    }
  };

  const renderTooltip = (id: string) => {
    const data = tooltipData[id];
    if (!data || !tooltipAnchor) return null;

    return createPortal(
      <TooltipPortalContent 
        id={id} 
        data={data} 
        anchor={tooltipAnchor} 
        onClose={() => {
          setActiveTooltip(null);
          setTooltipAnchor(null);
        }} 
      />,
      document.body
    );
  };

  // Auto-calculate BMI
  useEffect(() => {
    if (formData.height > 0 && formData.weight > 0) {
      const heightInMeters = formData.height / 100;
      const bmi = formData.weight / (heightInMeters * heightInMeters);
      setCalculatedBMI(parseFloat(bmi.toFixed(1)));
    }
  }, [formData.height, formData.weight]);

  const bmiStatus = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-amber-400 border-amber-500/20 bg-amber-500/5' };
    if (bmi < 25) return { label: 'Healthy Weight', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' };
    if (bmi < 30) return { label: 'Overweight', color: 'text-orange-400 border-orange-500/20 bg-orange-500/5' };
    return { label: 'Obese', color: 'text-red-400 border-red-500/20 bg-red-500/5' };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: any = value;
    if (type === 'number') {
      if (value === '') {
        processedValue = '';
      } else {
        const parsed = parseFloat(value);
        processedValue = isNaN(parsed) ? '' : parsed;
      }
    } else if (value === 'true') {
      processedValue = true;
    } else if (value === 'false') {
      processedValue = false;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processUploadedFile = async (file: File) => {
    setIsParsingFile(true);
    setParsingStepText('Uploading clinical report to secure server...');
    
    try {
      const formDataObj = new FormData();
      formDataObj.append('file', file);
      
      const res = await fetch('http://localhost:5000/upload-report', {
        method: 'POST',
        body: formDataObj
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to parse lab report.');
      }
      
      setParsingStepText('Biomarkers parsed successfully. Loading...');
      
      setFormData({
        age: data.age !== undefined && data.age !== null ? String(data.age) : '',
        gender: data.gender || 'female',
        height: data.height || 165,
        weight: data.weight || 72,
        glucose: data.glucose || 104,
        hba1c: data.hba1c || 5.8,
        systolicBP: data.systolic_bp || 125,
        diastolicBP: data.diastolic_bp || 80,
        familyHistory: data.family_history !== undefined ? data.family_history : true,
        cholesterol: data.cholesterol !== undefined ? data.cholesterol : false,
        smoking: data.smoking || 'never',
        activityLevel: data.activity_level || 'moderate'
      });
      
      if (data.height && data.weight) {
        const heightM = data.height / 100;
        const bmi = data.weight / (heightM * heightM);
        setCalculatedBMI(parseFloat(bmi.toFixed(1)));
      }
      
      setHeartDisease(data.heart_disease || false);
      setStrokeHistory(data.stroke || false);
      setCholesterolChecked(data.cholesterol_checked !== undefined ? data.cholesterol_checked : true);
      
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'An error occurred during medical report parsing.');
      clearForm();
    } finally {
      setIsParsingFile(false);
      setParsingStepText('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFile(file);
      processUploadedFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      processUploadedFile(file);
    }
  };

  const clearForm = () => {
    setFormData({
      age: '',
      gender: 'female',
      height: 165,
      weight: 72,
      systolicBP: 125,
      diastolicBP: 80,
      glucose: 104,
      hba1c: 5.8,
      familyHistory: true,
      cholesterol: false,
      smoking: 'never',
      activityLevel: 'moderate',
    });
    setCalculatedBMI(26.4);
    setUploadedFile(null);
    setHeartDisease(false);
    setStrokeHistory(false);
    setCholesterolChecked(true);
    setResult(null);
    setIsParsingFile(false);
    setParsingStepText('');
  };

  // ML Risk Calculation Emulator
  const calculatePrediction = () => {
    // If a medical report is uploaded, we do NOT require Age or any other input requirement to be filled out.
    if (!uploadedFile && (formData.age === '' || Number(formData.age) <= 0)) {
      const ageInput = document.getElementById('age');
      if (ageInput) {
        ageInput.focus();
        ageInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStep(0);

    // Multi-stage loader steps simulation
    const intervals = [800, 1600, 2400, 3200];
    intervals.forEach((ms, index) => {
      setTimeout(() => {
        setAnalysisStep(index + 1);
        if (index === intervals.length - 1) {
          executeAlgorithm();
        }
      }, ms);
    });
  };

  const executeAlgorithm = async () => {
    try {
      const token = localStorage.getItem('glucosense_token');
      const res = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          age: formData.age === '' ? 30 : Number(formData.age),
          gender: formData.gender,
          height: formData.height === '' ? 165 : Number(formData.height),
          weight: formData.weight === '' ? 72 : Number(formData.weight),
          glucose: formData.glucose === '' ? 104 : Number(formData.glucose),
          hba1c: formData.hba1c === '' ? 5.8 : Number(formData.hba1c),
          systolicBP: formData.systolicBP === '' ? 125 : Number(formData.systolicBP),
          diastolicBP: formData.diastolicBP === '' ? 80 : Number(formData.diastolicBP),
          familyHistory: formData.familyHistory,
          cholesterol: formData.cholesterol,
          smoking: formData.smoking,
          activityLevel: formData.activityLevel,
          strokeHistory: strokeHistory,
          heartDisease: heartDisease
        })
      });
      
      const data = await res.json();
      
      if (res.status === 401) {
        alert("Session expired. Please log in again.");
        window.location.hash = '/login';
        return;
      }
      
      if (!res.ok) {
        throw new Error(data.error || 'Prediction calculation failed.');
      }
      
      setResult({
        riskPercentage: data.riskPercentage,
        riskLevel: data.riskLevel,
        recommendations: data.recommendations || data.recommendation,
        impacts: data.impacts || [],
        calculatedBMI: data.calculatedBMI || calculatedBMI,
        clinicalNotes: data.clinicalNotes || ''
      });
      
      // Update local history
      await addPredictionRecord(data);
      
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to complete risk assessment.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loaderSteps = [
    'Checking your personal information and body measurements...',
    'Analyzing your blood test indicators and health history...',
    'Calculating your personalized risk factors...',
    'Compiling your healthy recommendations and clinical summary...',
  ];

  // Modern Switch Card Setup
  const switchCards = [
    {
      id: 'highBP',
      title: 'High Blood Pressure',
      description: 'Previously diagnosed high blood pressure.',
      icon: Heart,
      active: formData.systolicBP >= 130 || formData.diastolicBP >= 85,
      toggle: () => {
        const isCurrentlyHigh = formData.systolicBP >= 130 || formData.diastolicBP >= 85;
        setFormData(prev => ({
          ...prev,
          systolicBP: isCurrentlyHigh ? 115 : 135,
          diastolicBP: isCurrentlyHigh ? 75 : 85
        }));
      }
    },
    {
      id: 'cholesterol',
      title: 'High Cholesterol',
      description: 'Previously diagnosed high cholesterol.',
      icon: Droplet,
      active: formData.cholesterol,
      toggle: () => {
        setFormData(prev => ({ ...prev, cholesterol: !prev.cholesterol }));
      }
    },
    {
      id: 'familyHistory',
      title: 'Family Diabetes History',
      description: 'Whether your parents, brothers, or sisters have diabetes.',
      icon: ShieldAlert,
      active: formData.familyHistory,
      toggle: () => {
        setFormData(prev => ({ ...prev, familyHistory: !prev.familyHistory }));
      }
    },
    {
      id: 'heartDisease',
      title: 'Heart Disease',
      description: 'Previously diagnosed heart disease or history of chest pain or heart attack.',
      icon: HeartPulse,
      active: heartDisease,
      toggle: () => setHeartDisease(!heartDisease)
    },
    {
      id: 'strokeHistory',
      title: 'Stroke History',
      description: 'History of stroke or mini-stroke (TIA).',
      icon: Activity,
      active: strokeHistory,
      toggle: () => setStrokeHistory(!strokeHistory)
    },
    {
      id: 'cholesterolChecked',
      title: 'Cholesterol Checked',
      description: 'Whether you have had your cholesterol checked within the past 5 years.',
      icon: CheckCircle,
      active: cholesterolChecked,
      toggle: () => setCholesterolChecked(!cholesterolChecked)
    }
  ];

  // Modern Lifestyle options setup
  const smokingOptions = [
    { value: 'never', label: 'Never Smoked', desc: 'I have never smoked', icon: CheckCircle, color: 'text-emerald-400' },
    { value: 'former', label: 'Former Smoker', desc: 'I used to smoke but quit', icon: RefreshCw, color: 'text-orange-400' },
    { value: 'current', label: 'Active Smoker', desc: 'I smoke regularly', icon: Flame, color: 'text-red-400' }
  ];

  const activityOptions = [
    { value: 'sedentary', label: 'Sedentary', desc: 'Hardly ever (little or no exercise)', icon: ShieldAlert, color: 'text-red-400' },
    { value: 'moderate', label: 'Moderate Activity', desc: 'Sometimes (moderate exercise a few times a week)', icon: Activity, color: 'text-cyan-400' },
    { value: 'active', label: 'Highly Active', desc: 'Regularly (active exercise or training most days)', icon: Sparkles, color: 'text-emerald-400' }
  ];

  return (
    <div className="relative min-h-screen py-12 md:py-16 overflow-hidden" id="prediction-page-container">
      {/* Click outside backdrop for tooltips */}
      {activeTooltip && (
        <div 
          className="fixed inset-0 z-40 bg-transparent cursor-default" 
          onClick={() => {
            setActiveTooltip(null);
            setTooltipAnchor(null);
          }} 
        />
      )}
      {activeTooltip && renderTooltip(activeTooltip)}
      {/* Background decorations */}
      <div className="absolute inset-0 bg-grid-overlay opacity-5 z-0" />
      <div className="absolute top-10 left-10 w-[400px] h-[400px] rounded-full bg-cyan-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] rounded-full bg-blue-600/5 blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-[1500px] px-8 relative z-10">
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Diabetes <span className="text-cyan-500">Risk Assessment</span>
          </h1>
          <p className="mt-3 text-slate-500 text-sm md:text-base font-medium">
            Simply upload your blood test report or lab results below. Our smart AI will instantly read your numbers to check your risk and give you clear, personalized guidance.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: LOADING STATE */}
          {isAnalyzing && (
            <motion.div
              key="loader"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-xl mx-auto glass-panel border-cyan-500/20 rounded-3xl p-8 md:p-12 text-center shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center min-h-[400px]"
              id="analysis-loader"
            >
              <div className="relative mb-8">
                <div className="h-20 w-20 rounded-full border border-cyan-500/10 flex items-center justify-center">
                  <RefreshCw className="h-10 w-10 text-cyan-400 animate-spin" />
                </div>
                <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-xl animate-pulse" />
              </div>
              
              <h3 className="font-display text-lg font-bold text-white tracking-wide uppercase">
                Calibrating Clinical Datasets
              </h3>
              
              {/* Stepper text */}
              <div className="mt-6 h-12 flex items-center justify-center">
                <motion.p
                  key={analysisStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-mono text-xs text-cyan-400"
                >
                  {loaderSteps[analysisStep] || 'Finalizing risk output...'}
                </motion.p>
              </div>

              {/* Graphical loading nodes simulation */}
              <div className="flex gap-1.5 mt-4">
                {loaderSteps.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 w-8 rounded-full transition-all duration-300 ${
                      idx <= analysisStep ? 'bg-cyan-400 shadow-[0_0_8px_#06b6d4]' : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2: RESULT SCREEN */}
          {!isAnalyzing && result && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
              id="assessment-results-panel"
            >
              <div className="flex justify-start">
                <button
                  onClick={() => setResult(null)}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-mono tracking-wider text-gray-300 hover:text-cyan-400 hover:border-cyan-500/30 transition-all duration-300 cursor-pointer"
                >
                  <ArrowLeftRight className="h-4 w-4 text-cyan-400" />
                  <span>MODIFY FORM / RE-ANALYZE</span>
                </button>
              </div>

              {/* Main diagnostics grids */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left panel: Dial gauge percentage */}
                <div className="lg:col-span-5 rounded-3xl glass-panel p-6 md:p-8 border border-white/10 flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 p-4 font-mono text-[9px] text-gray-500">
                    DIAGNOSTIC REPORT SECURE
                  </div>

                  {/* Circular Radial Gauge */}
                  <div className="relative flex items-center justify-center h-52 w-52 mt-4">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        className="stroke-white/5"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        className={`transition-all duration-1000 ${
                          result.riskLevel === 'High' ? 'stroke-red-500' :
                          result.riskLevel === 'Moderate' ? 'stroke-orange-400' : 'stroke-emerald-400'
                        }`}
                        strokeWidth="8"
                        strokeDasharray={263.8}
                        strokeDashoffset={263.8 - (263.8 * result.riskPercentage) / 100}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    
                    {/* Centered value */}
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="font-display text-5xl font-extrabold text-white leading-none">
                        {result.riskPercentage}%
                      </span>
                      <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest mt-1">
                        ESTIMATED RISK
                      </span>
                    </div>
                  </div>

                  {/* Level tag */}
                  <div className={`mt-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-display text-sm font-bold ${
                    result.riskLevel === 'High' ? 'text-red-400 border-red-500/20 bg-red-500/10' :
                    result.riskLevel === 'Moderate' ? 'text-orange-400 border-orange-500/20 bg-orange-500/10' :
                    'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
                  }`}>
                    <AlertCircle className="h-4 w-4" />
                    <span>{result.riskLevel} Diabetes Susceptibility</span>
                  </div>

                  {/* Clinical Note Narrative */}
                  <p className="mt-6 text-xs text-gray-400 leading-relaxed max-w-sm">
                    {result.clinicalNotes}
                  </p>
                </div>

                {/* Right panel: Contribution variables & Action Plan */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Dynamic medical actions checklist */}
                  <div className="rounded-3xl glass-panel p-6 border border-white/10">
                    <h3 className="font-display text-sm font-bold text-white tracking-wider flex items-center gap-2 mb-4 uppercase">
                      <CheckCircle className="h-4.5 w-4.5 text-cyan-400" />
                      Physician's Prescriptive Action Plan
                    </h3>
                    <ul className="space-y-3.5">
                      {result.recommendations.map((rec, ridx) => (
                        <li key={ridx} className="flex items-start gap-3 text-xs md:text-sm text-gray-300 leading-relaxed">
                          <ChevronRight className="h-4.5 w-4.5 text-cyan-400 shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Feature contribution weighting factors */}
                  <div className="rounded-3xl glass-panel p-6 border border-white/10">
                    <h3 className="font-display text-sm font-bold text-white tracking-wider flex items-center gap-2 mb-4 uppercase">
                      <Activity className="h-4.5 w-4.5 text-cyan-400" />
                      Ensembled Factor Contribution Map
                    </h3>
                    
                    <div className="space-y-3">
                      {result.impacts.map((imp, iidx) => (
                        <div 
                          key={iidx}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                        >
                          <div className="space-y-0.5">
                            <p className="font-display text-xs font-bold text-white">{imp.factor}</p>
                            <p className="text-[11px] text-gray-500">{imp.description}</p>
                          </div>
                          
                          <div className="text-right">
                            <span className="font-mono text-xs text-white bg-white/5 rounded px-2.5 py-1 border border-white/10">
                              {imp.value}
                            </span>
                            <span className={`block font-mono text-[9px] uppercase tracking-wide mt-1.5 font-bold ${
                              imp.impact === 'negative' ? 'text-red-400' : 'text-emerald-400'
                            }`}>
                              {imp.impact === 'negative' ? 'Risk Elevator' : 'Protective'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {/* STEP 3: PREDICTION FORM (RE-DESIGNED FOR EXCLUSIVE MEDICAL REPORT UPLOAD) */}
          {!isAnalyzing && !result && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full"
              id="assessment-input-form"
            >
              {!uploadedFile ? (
                /* Empty/Initial Upload State: A beautiful, centered, unified premium upload box */
                <div className="max-w-2xl mx-auto">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('report-file-input')?.click()}
                    className={`relative rounded-3xl border border-white/10 p-8 md:p-14 text-center transition-all duration-500 cursor-pointer group ${
                      isDragging 
                        ? 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_40px_rgba(6,182,212,0.2)]' 
                        : 'bg-white/5 hover:border-cyan-500/40 hover:bg-cyan-500/5 hover:shadow-[0_0_40px_rgba(6,182,212,0.08)]'
                    }`}
                  >
                    <input 
                      type="file" 
                      id="report-file-input"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="hidden" 
                    />
                    <label htmlFor="report-file-input" className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                      {isParsingFile ? (
                        <div className="flex flex-col items-center justify-center gap-4 w-full py-4">
                          <div className="relative mb-2">
                            <div className="h-16 w-16 rounded-full border border-cyan-500/10 flex items-center justify-center">
                              <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin" />
                            </div>
                            <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-md animate-pulse" />
                          </div>
                          <p className="font-display text-sm font-bold text-white uppercase tracking-wider animate-pulse">
                            Extracting Lab Data...
                          </p>
                          <p className="text-xs text-cyan-400 font-mono text-center max-w-[280px]">
                            {parsingStepText}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="mx-auto h-16 w-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.15)] group-hover:scale-105 transition-transform duration-300">
                            <UploadCloud className="h-8 w-8" />
                          </div>
                          <div className="space-y-2">
                            <h2 className="font-display text-2xl font-extrabold text-white">
                              Upload Your Medical Report
                            </h2>
                            <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
                              Drag & drop your clinical laboratory report here, or <span className="text-cyan-400 font-semibold group-hover:underline">browse files</span> to automatically analyze metabolic biomarkers.
                            </p>
                          </div>
                          <div className="flex items-center justify-center gap-4 pt-2 text-xs text-gray-500 font-mono">
                            <span>PDF, JPG, PNG, DOCX</span>
                            <span className="h-1 w-1 rounded-full bg-gray-700" />
                            <span>Max 10MB</span>
                          </div>
                        </div>
                      )}
                    </label>
                  </motion.div>
                </div>
              ) : (
                /* File is Uploaded: Show 2-Column Screen */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Column (8 columns): Beautiful Read-Only Extracted Biomarkers */}
                  <div className="lg:col-span-8 space-y-8">
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-3xl glass-panel p-6 md:p-8 border border-white/10 space-y-6"
                    >
                      <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <div className="space-y-1">
                          <span className="font-mono text-[10px] tracking-widest text-cyan-400 font-bold uppercase block">Extracted Biomarkers</span>
                          <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                            <Stethoscope className="h-5 w-5 text-cyan-400 animate-pulse" />
                            Clinical Record Extraction Summary
                          </h3>
                        </div>
                        <span className="font-mono text-[10px] bg-emerald-500/10 border border-emerald-500/20 rounded px-2.5 py-1 text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                          <Check className="h-3 w-3" /> Successfully Parsed
                        </span>
                      </div>

                      {isParsingFile ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4">
                          <RefreshCw className="h-10 w-10 text-cyan-400 animate-spin" />
                          <p className="font-mono text-xs text-gray-400">{parsingStepText}</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Age & Gender */}
                          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between min-h-[100px]">
                            <span className="font-mono text-[10px] text-gray-500 uppercase tracking-wider block">Patient Demographics</span>
                            <div className="mt-2">
                              <p className="text-lg font-bold text-white">
                                {formData.age} <span className="text-xs text-gray-400 font-normal">years old</span>
                              </p>
                              <p className="text-xs text-gray-400 font-mono uppercase mt-0.5">
                                Sex: {formData.gender}
                              </p>
                            </div>
                          </div>

                          {/* BMI Status */}
                          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between min-h-[100px]">
                            <span className="font-mono text-[10px] text-gray-500 uppercase tracking-wider block">Body Mass Index (BMI)</span>
                            <div className="mt-2">
                              <p className="text-lg font-bold text-white">
                                {calculatedBMI} <span className="text-xs text-gray-400 font-normal">kg/m²</span>
                              </p>
                              <span className={`inline-block text-[9px] font-bold tracking-wider font-mono uppercase px-2 py-0.5 rounded mt-1.5 ${
                                bmiStatus(calculatedBMI).color.includes('red') ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                bmiStatus(calculatedBMI).color.includes('orange') ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {bmiStatus(calculatedBMI).label}
                              </span>
                            </div>
                          </div>

                          {/* Fasting Glucose */}
                          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between min-h-[100px]">
                            <span className="font-mono text-[10px] text-gray-500 uppercase tracking-wider block">Fasting Glucose</span>
                            <div className="mt-2">
                              <p className="text-lg font-bold text-white">
                                {formData.glucose} <span className="text-xs text-gray-400 font-normal">mg/dL</span>
                              </p>
                              <span className={`inline-block text-[9px] font-bold tracking-wider font-mono uppercase px-2 py-0.5 rounded mt-1.5 ${
                                Number(formData.glucose) >= 126 ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                Number(formData.glucose) >= 100 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {Number(formData.glucose) >= 126 ? 'Diabetic Range' :
                                 Number(formData.glucose) >= 100 ? 'Prediabetic Range' : 'Normal'}
                              </span>
                            </div>
                          </div>

                          {/* HbA1c */}
                          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between min-h-[100px]">
                            <span className="font-mono text-[10px] text-gray-500 uppercase tracking-wider block">HbA1c (Long-Term Sugar)</span>
                            <div className="mt-2">
                              <p className="text-lg font-bold text-white">
                                {formData.hba1c}%
                              </p>
                              <span className={`inline-block text-[9px] font-bold tracking-wider font-mono uppercase px-2 py-0.5 rounded mt-1.5 ${
                                Number(formData.hba1c) >= 6.5 ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                Number(formData.hba1c) >= 5.7 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {Number(formData.hba1c) >= 6.5 ? 'Diabetic Range' :
                                 Number(formData.hba1c) >= 5.7 ? 'Prediabetic Range' : 'Normal'}
                              </span>
                            </div>
                          </div>

                          {/* Blood Pressure */}
                          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between min-h-[100px]">
                            <span className="font-mono text-[10px] text-gray-500 uppercase tracking-wider block">Blood Pressure</span>
                            <div className="mt-2">
                              <p className="text-lg font-bold text-white">
                                {formData.systolicBP}/{formData.diastolicBP} <span className="text-xs text-gray-400 font-normal">mmHg</span>
                              </p>
                              <span className={`inline-block text-[9px] font-bold tracking-wider font-mono uppercase px-2 py-0.5 rounded mt-1.5 ${
                                (Number(formData.systolicBP) >= 130 || Number(formData.diastolicBP) >= 85) ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {(Number(formData.systolicBP) >= 130 || Number(formData.diastolicBP) >= 85) ? 'Elevated / High' : 'Normal'}
                              </span>
                            </div>
                          </div>

                          {/* Comorbidities / History */}
                          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between min-h-[100px]">
                            <span className="font-mono text-[10px] text-gray-500 uppercase tracking-wider block">Clinical History Indicators</span>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {formData.familyHistory && (
                                <span className="text-[9px] font-bold font-mono uppercase bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded">
                                  Family History
                                </span>
                              )}
                              {formData.cholesterol && (
                                <span className="text-[9px] font-bold font-mono uppercase bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded">
                                  High Cholesterol
                                </span>
                              )}
                              {!formData.familyHistory && !formData.cholesterol && (
                                <span className="text-[9px] font-bold font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                                  Clear History
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </div>

                  {/* Right Column (4 columns): Uploaded report status and risk prediction triggers */}
                  <div className="lg:col-span-4 lg:sticky lg:top-6 self-start space-y-6">
                    {/* The uploaded file details */}
                    <div className="rounded-3xl glass-panel p-6 border border-white/10 space-y-6">
                      <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-cyan-400" />
                          <h3 className="font-display text-sm font-bold text-white tracking-wider uppercase">
                            Uploaded Document
                          </h3>
                        </div>
                        <button
                          onClick={clearForm}
                          className="text-xs font-mono text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                        >
                          Change
                        </button>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 relative">
                        <p className="font-display text-xs font-bold text-white truncate max-w-[200px]">
                          {uploadedFile.name}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                          {(uploadedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={calculatePrediction}
                          disabled={isParsingFile}
                          className="w-full relative flex items-center justify-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 px-8 py-4 shadow-[0_0_25px_rgba(6,182,212,0.3)] hover:shadow-[0_0_35px_rgba(6,182,212,0.55)] hover:scale-[1.02] transition-all duration-300 cursor-pointer text-white font-bold uppercase tracking-wider text-xs font-display disabled:opacity-50"
                          id="prediction-run-btn"
                        >
                          <Stethoscope className="h-4 w-4 animate-pulse text-white" />
                          <span>Check Diabetes Risk</span>
                          <ChevronRight className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
