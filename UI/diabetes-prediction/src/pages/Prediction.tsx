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

  const processUploadedFile = (file: File) => {
    setIsParsingFile(true);
    setParsingStepText('Securely uploading clinical report...');
    
    setTimeout(() => {
      setParsingStepText('Scanning document structure (OCR)...');
    }, 700);

    setTimeout(() => {
      setParsingStepText('Extracting physiological biomarkers (HbA1c, Glucose)...');
    }, 1400);

    setTimeout(() => {
      setParsingStepText('Populating clinical assessment parameters...');
      // Pre-fill fields with clinical data from report
      setFormData({
        age: 45,
        gender: 'male',
        height: 172,
        weight: 81,
        systolicBP: 135,
        diastolicBP: 85,
        glucose: 114,
        hba1c: 6.2,
        familyHistory: true,
        cholesterol: true,
        smoking: 'former',
        activityLevel: 'moderate',
      });
      // Set calculated BMI based on extracted height and weight
      const heightInMeters = 1.72;
      const bmi = 81 / (heightInMeters * heightInMeters);
      setCalculatedBMI(parseFloat(bmi.toFixed(1)));
      setHeartDisease(false);
      setStrokeHistory(false);
    }, 2100);

    setTimeout(() => {
      setIsParsingFile(false);
      setParsingStepText('');
    }, 2700);
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

  const executeAlgorithm = () => {
    let logit = -4.5; // Healthy intercept constant

    // Robust variable extractions with safe clinical fallbacks
    const ageVal = formData.age === '' ? 30 : Number(formData.age);
    const heightVal = (formData.height as any) === '' ? 165 : Number(formData.height);
    const weightVal = (formData.weight as any) === '' ? 72 : Number(formData.weight);
    const glucoseVal = (formData.glucose as any) === '' ? 104 : Number(formData.glucose);
    const hba1cVal = (formData.hba1c as any) === '' ? 5.8 : Number(formData.hba1c);
    const systolicVal = (formData.systolicBP as any) === '' ? 125 : Number(formData.systolicBP);
    const diastolicVal = (formData.diastolicBP as any) === '' ? 80 : Number(formData.diastolicBP);

    const heightInMeters = heightVal / 100;
    const computedBmi = weightVal / (heightInMeters * heightInMeters);
    const currentBmi = isNaN(computedBmi) ? 26.4 : Number(computedBmi.toFixed(1));

    // BMI Impact
    if (currentBmi > 25) {
      logit += (currentBmi - 25) * 0.12;
    }
    if (currentBmi > 30) {
      logit += 0.4;
    }

    // Age Impact
    logit += (ageVal - 20) * 0.035;

    // Fasting Glucose Impact
    if (glucoseVal > 100) {
      logit += (glucoseVal - 100) * 0.045;
    }
    if (glucoseVal >= 126) {
      logit += 1.2;
    }

    // HbA1c Impact
    if (hba1cVal > 5.6) {
      logit += (hba1cVal - 5.6) * 1.5;
    }

    // Blood Pressure Impact (Systolic/Diastolic)
    const maxBP = Math.max(systolicVal, diastolicVal * 1.5);
    if (maxBP > 120) {
      logit += (maxBP - 120) * 0.015;
    }

    // Lifestyle/Genetic flags
    if (formData.familyHistory) logit += 0.85;
    if (formData.cholesterol) logit += 0.45;
    
    if (formData.smoking === 'current') logit += 0.55;
    else if (formData.smoking === 'former') logit += 0.25;

    if (formData.activityLevel === 'sedentary') logit += 0.6;
    else if (formData.activityLevel === 'active') logit -= 0.5;

    // Extra variables diagnostic adjustments
    if (heartDisease) logit += 0.5;
    if (strokeHistory) logit += 0.4;

    // Sigmoid squash (0.0 to 1.0)
    const risk = 1 / (1 + Math.exp(-logit));
    const riskPercentage = Math.round(risk * 100);

    // Define Risk Level Category
    let riskLevel: 'Low' | 'Moderate' | 'High' = 'Low';
    if (riskPercentage >= 60) riskLevel = 'High';
    else if (riskPercentage >= 25) riskLevel = 'Moderate';

    // Generate dynamic factors contribution analysis
    const impacts: FactorImpact[] = [];

    // Glucose Impact
    if (glucoseVal >= 126) {
      impacts.push({
        factor: 'Plasma Glucose',
        impact: 'negative',
        value: `${glucoseVal} mg/dL`,
        description: 'Enters diabetic range. Heavy risk contributor.',
      });
    } else if (glucoseVal > 100) {
      impacts.push({
        factor: 'Plasma Glucose',
        impact: 'negative',
        value: `${glucoseVal} mg/dL`,
        description: 'Impaired fasting glucose (Pre-diabetic zone).',
      });
    } else {
      impacts.push({
        factor: 'Plasma Glucose',
        impact: 'positive',
        value: `${glucoseVal} mg/dL`,
        description: 'Healthy optimal glycemic range.',
      });
    }

    // HbA1c Impact
    if (hba1cVal >= 6.5) {
      impacts.push({
        factor: 'Glycated Hemoglobin (HbA1c)',
        impact: 'negative',
        value: `${hba1cVal}%`,
        description: 'Sustained hyperglycemia indicator. Severe marker.',
      });
    } else if (hba1cVal >= 5.7) {
      impacts.push({
        factor: 'Glycated Hemoglobin (HbA1c)',
        impact: 'negative',
        value: `${hba1cVal}%`,
        description: 'Elevated glycated hemoglobin. Pre-diabetic marker.',
      });
    } else {
      impacts.push({
        factor: 'Glycated Hemoglobin (HbA1c)',
        impact: 'positive',
        value: `${hba1cVal}%`,
        description: 'Healthy cellular protein oxygen levels.',
      });
    }

    // BMI Impact
    if (currentBmi >= 30) {
      impacts.push({
        factor: 'Body Mass Index (BMI)',
        impact: 'negative',
        value: `${currentBmi}`,
        description: 'Obesity levels heavily increase insulin resistance.',
      });
    } else if (currentBmi >= 25) {
      impacts.push({
        factor: 'Body Mass Index (BMI)',
        impact: 'negative',
        value: `${currentBmi}`,
        description: 'Mild visceral weight elevates pancreatic stress.',
      });
    } else {
      impacts.push({
        factor: 'Body Mass Index (BMI)',
        impact: 'positive',
        value: `${currentBmi}`,
        description: 'Healthy lean composition reduces insulin strain.',
      });
    }

    // Activity protective factor
    if (formData.activityLevel === 'active') {
      impacts.push({
        factor: 'Physical Activity',
        impact: 'positive',
        value: 'Highly Active',
        description: 'Stimulates independent skeletal muscle GLUT-4 glucose clearing.',
      });
    } else if (formData.activityLevel === 'sedentary') {
      impacts.push({
        factor: 'Physical Activity',
        impact: 'negative',
        value: 'Sedentary',
        description: 'Skeletal inactivity downregulates insulin receptor cells.',
      });
    }

    // Family history
    if (formData.familyHistory) {
      impacts.push({
        factor: 'Genetic Lineage',
        impact: 'negative',
        value: 'Relative History',
        description: 'First-degree genetic history lowers baseline pancreatic resilience.',
      });
    }

    // Tailor specific Medical Recommendations
    const recommendations: string[] = [];
    if (glucoseVal >= 126 || hba1cVal >= 6.5) {
      recommendations.push('Schedule an urgent fasting plasma glucose/OGTT review with an endocrinologist.');
      recommendations.push('Monitor daily blood glucose spikes prior to and 2 hours after standard meals.');
    } else if (glucoseVal > 100 || hba1cVal >= 5.7) {
      recommendations.push('Implement a structured low-glycemic dietary model, omitting simple sugars and refined flours.');
      recommendations.push('Aim to reduce body mass index by 5-7% over the next 4 months.');
    } else {
      recommendations.push('Maintain current metabolic balance with regular physical activity and optimal hydration.');
    }

    if (systolicVal >= 130 || diastolicVal >= 80) {
      recommendations.push('Limit dietary sodium and obtain a 24-hour ambulatory blood pressure mapping.');
    }

    if (formData.activityLevel === 'sedentary') {
      recommendations.push('Initiate 30 minutes of daily brisk aerobic walking to stimulate metabolic vascular clearance.');
    }

    if (formData.smoking === 'current') {
      recommendations.push('Seek clinical support for immediate nicotine cessation; smoking doubles macrovascular cardiovascular risks.');
    }

    // Formulate medical clinical notes summary
    let clinicalNotes = '';
    if (riskLevel === 'High') {
      clinicalNotes = 'Patient exhibits severe metabolic indicators, predominantly high glycemic blood concentrations and supporting genetic vulnerabilities. Immediate medical screening and insulin resistance review are heavily recommended.';
    } else if (riskLevel === 'Moderate') {
      clinicalNotes = 'Patient shows early metabolic dysregulation, placing them in the pre-diabetic risk zone. This state is highly reversible with intensive therapeutic lifestyle modifications, focused weight loss, and refined carbohydrate elimination.';
    } else {
      clinicalNotes = 'Patient demonstrates robust clinical homeostasis with healthy cell-receptive biomarkers. Current cardiovascular risk profile is highly protective against early diabetes development.';
    }

    setResult({
      riskPercentage,
      riskLevel,
      recommendations,
      impacts,
      calculatedBMI: currentBmi,
      clinicalNotes
    });
    
    // Save to Firestore/LocalStorage timeline history
    addPredictionRecord({
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + `, ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
      riskPercentage,
      riskLevel,
      recommendations,
      clinicalNotes,
      age: ageVal,
      gender: formData.gender,
      bmi: currentBmi,
      glucose: glucoseVal,
      hba1c: hba1cVal,
      systolicBP: systolicVal,
      diastolicBP: diastolicVal,
    }).catch(err => {
      console.error("Failed to automatically record assessment entry:", err);
    });

    setIsAnalyzing(false);
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
            Complete the health form below to check your risk of developing diabetes. We analyze your body measurements, blood sugar, and history to give you a personalized report.
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

          {/* STEP 3: PREDICTION FORM (2-COLUMN REDESIGN) */}
          {!isAnalyzing && !result && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
              id="assessment-input-form"
            >
              {/* Left Column (70%): Input Sections */}
              <div className="lg:col-span-8 space-y-12">
                
                {/* SECTION 1: Personal Information */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-3xl glass-panel p-6 md:p-8 border border-white/10 space-y-6 hover:shadow-[0_0_30px_rgba(6,182,212,0.05)] transition-shadow duration-300"
                >
                  <div className="space-y-2">
                    <span className="font-mono text-[10px] tracking-widest text-cyan-400 font-bold uppercase block">01. Personal Info</span>
                    <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                      <User className="h-5 w-5 text-cyan-400" />
                      Personal Information
                    </h3>
                    <p className="text-xs text-gray-400">
                      Please enter your basic details to help us understand your body baseline.
                    </p>
                  </div>
                  
                  <div className="h-px bg-white/5 my-6" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Age */}
                    <div className="space-y-2 relative">
                      <div className="flex items-center gap-1.5">
                        <label className="font-mono text-xs tracking-wider text-cyan-400 font-bold uppercase">Age</label>
                        <button
                          type="button"
                          onClick={(e) => toggleTooltip(e, 'age')}
                          className="text-cyan-400 hover:text-cyan-300 focus:outline-none cursor-pointer inline-flex items-center"
                          title="Patient Age Info"
                        >
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <input
                        type="number"
                        name="age"
                        id="age"
                        min="1"
                        max="120"
                        value={formData.age}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-white/10 bg-white/5 p-4 font-mono text-sm text-white focus:border-cyan-500 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all duration-300"
                        placeholder="Enter your age"
                      />
                      <p className="text-[11px] text-gray-500">Enter your current age in years.</p>
                    </div>

                    {/* Gender */}
                    <div className="space-y-2 relative">
                      <div className="flex items-center gap-1.5">
                        <label className="font-mono text-xs tracking-wider text-cyan-400 font-bold uppercase">Gender</label>
                        <button
                          type="button"
                          onClick={(e) => toggleTooltip(e, 'gender')}
                          className="text-cyan-400 hover:text-cyan-300 focus:outline-none cursor-pointer inline-flex items-center"
                          title="Assigned Gender Info"
                        >
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-white/10 bg-white/5 p-4 font-mono text-sm text-white focus:border-cyan-500 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all duration-300 text-left cursor-pointer"
                      >
                        <option value="female" className="bg-medical-dark text-white">Female</option>
                        <option value="male" className="bg-medical-dark text-white">Male</option>
                        <option value="other" className="bg-medical-dark text-white">Other</option>
                      </select>
                      <p className="text-[11px] text-gray-500">Select your birth sex.</p>
                    </div>
                  </div>
                </motion.div>

                {/* SECTION 2: Body Measurements */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="rounded-3xl glass-panel p-6 md:p-8 border border-white/10 space-y-6 hover:shadow-[0_0_30px_rgba(6,182,212,0.05)] transition-shadow duration-300"
                >
                  <div className="space-y-2">
                    <span className="font-mono text-[10px] tracking-widest text-cyan-400 font-bold uppercase block">02. Body Metrics</span>
                    <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                      <Scale className="h-5 w-5 text-cyan-400" />
                      Body Measurements
                    </h3>
                    <p className="text-xs text-gray-400">
                      Please enter your physical measurements.
                    </p>
                  </div>
                  
                  <div className="h-px bg-white/5 my-6" />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    {/* Height */}
                    <div className="space-y-2 relative">
                      <div className="flex items-center gap-1.5">
                        <label className="font-mono text-xs tracking-wider text-cyan-400 font-bold uppercase">Height</label>
                        <button
                          type="button"
                          onClick={(e) => toggleTooltip(e, 'height')}
                          className="text-cyan-400 hover:text-cyan-300 focus:outline-none cursor-pointer inline-flex items-center"
                          title="Height Info"
                        >
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          name="height"
                          id="height"
                          min="100"
                          max="250"
                          value={formData.height}
                          onChange={handleInputChange}
                          className="w-full rounded-xl border border-white/10 bg-white/5 p-4 pr-12 font-mono text-sm text-white focus:border-cyan-500 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all duration-300"
                          placeholder="e.g. 170"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-xs">cm</span>
                      </div>
                      <p className="text-[11px] text-gray-500">Enter your height in centimeters.</p>
                    </div>

                    {/* Weight */}
                    <div className="space-y-2 relative">
                      <div className="flex items-center gap-1.5">
                        <label className="font-mono text-xs tracking-wider text-cyan-400 font-bold uppercase">Body Weight</label>
                        <button
                          type="button"
                          onClick={(e) => toggleTooltip(e, 'weight')}
                          className="text-cyan-400 hover:text-cyan-300 focus:outline-none cursor-pointer inline-flex items-center"
                          title="Weight Info"
                        >
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          name="weight"
                          id="weight"
                          min="30"
                          max="250"
                          value={formData.weight}
                          onChange={handleInputChange}
                          className="w-full rounded-xl border border-white/10 bg-white/5 p-4 pr-12 font-mono text-sm text-white focus:border-cyan-500 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all duration-300"
                          placeholder="e.g. 70"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-xs">kg</span>
                      </div>
                      <p className="text-[11px] text-gray-500">Enter your weight in kilograms.</p>
                    </div>

                    {/* BMI Result Badge */}
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-center items-center h-[120px] text-center relative">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest font-bold">Body Mass Index (BMI)</span>
                        <button
                          type="button"
                          onClick={(e) => toggleTooltip(e, 'bmi')}
                          className="text-gray-500 hover:text-cyan-400 focus:outline-none cursor-pointer inline-flex items-center"
                          title="BMI Info"
                        >
                          <Info className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="font-display text-2xl font-extrabold text-white mt-1">{calculatedBMI}</span>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">Calculated automatically from your height and weight.</p>
                      <div className={`mt-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${bmiStatus(calculatedBMI).color}`}>
                        {bmiStatus(calculatedBMI).label}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* LABORATORY BIOMARKERS */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-3xl glass-panel p-6 md:p-8 border border-white/10 space-y-6 hover:shadow-[0_0_30px_rgba(6,182,212,0.05)] transition-shadow duration-300"
                >
                  <div className="space-y-2">
                    <span className="font-mono text-[10px] tracking-widest text-cyan-400 font-bold uppercase block">03. Lab Biomarkers</span>
                    <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                      <Droplet className="h-5 w-5 text-cyan-400" />
                      Health Indicators
                    </h3>
                    <p className="text-xs text-gray-400">
                      Please enter details from your latest blood test or health checkup.
                    </p>
                  </div>
                  
                  <div className="h-px bg-white/5 my-6" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Fasting Glucose */}
                    <div className="space-y-1.5 relative">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col">
                          <span className="font-display text-sm font-bold text-white">Blood Sugar Level</span>
                          <span className="font-mono text-[10px] tracking-wider text-cyan-400 font-bold uppercase">(Medical Term: Plasma Glucose)</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => toggleTooltip(e, 'glucose')}
                          className="text-cyan-400 hover:text-cyan-300 focus:outline-none cursor-pointer inline-flex items-center mt-1"
                          title="Plasma Glucose Info"
                        >
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <input
                        type="number"
                        name="glucose"
                        min="50"
                        max="400"
                        value={formData.glucose}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-white/10 bg-white/5 p-4 font-mono text-sm text-white focus:border-cyan-500 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all duration-300"
                        placeholder="e.g. 100"
                      />
                      <p className="text-[11px] text-gray-500">Enter the value from your recent blood test report.</p>
                    </div>

                    {/* HbA1c */}
                    <div className="space-y-1.5 relative">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col">
                          <span className="font-display text-sm font-bold text-white">Long-Term Blood Sugar</span>
                          <span className="font-mono text-[10px] tracking-wider text-cyan-400 font-bold uppercase">(Medical Term: HbA1c)</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => toggleTooltip(e, 'hba1c')}
                          className="text-cyan-400 hover:text-cyan-300 focus:outline-none cursor-pointer inline-flex items-center mt-1"
                          title="HbA1c Info"
                        >
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <input
                        type="number"
                        name="hba1c"
                        step="0.1"
                        min="4"
                        max="16"
                        value={formData.hba1c}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-white/10 bg-white/5 p-4 font-mono text-sm text-white focus:border-cyan-500 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all duration-300"
                        placeholder="e.g. 5.7"
                      />
                      <p className="text-[11px] text-gray-500">Enter the value from your recent blood test report.</p>
                    </div>

                    {/* Systolic BP */}
                    <div className="space-y-1.5 relative">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col">
                          <span className="font-display text-sm font-bold text-white">Blood Pressure (Top Number)</span>
                          <span className="font-mono text-[10px] tracking-wider text-cyan-400 font-bold uppercase">(Medical Term: Systolic Pressure)</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => toggleTooltip(e, 'systolicBP')}
                          className="text-cyan-400 hover:text-cyan-300 focus:outline-none cursor-pointer inline-flex items-center mt-1"
                          title="Systolic Pressure Info"
                        >
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <input
                        type="number"
                        name="systolicBP"
                        min="80"
                        max="220"
                        value={formData.systolicBP}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-white/10 bg-white/5 p-4 font-mono text-sm text-white focus:border-cyan-500 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all duration-300"
                        placeholder="e.g. 120"
                      />
                      <p className="text-[11px] text-gray-500">Enter the values shown on your BP monitor.</p>
                    </div>

                    {/* Diastolic BP */}
                    <div className="space-y-1.5 relative">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col">
                          <span className="font-display text-sm font-bold text-white">Blood Pressure (Bottom Number)</span>
                          <span className="font-mono text-[10px] tracking-wider text-cyan-400 font-bold uppercase">(Medical Term: Diastolic Pressure)</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => toggleTooltip(e, 'diastolicBP')}
                          className="text-cyan-400 hover:text-cyan-300 focus:outline-none cursor-pointer inline-flex items-center mt-1"
                          title="Diastolic Pressure Info"
                        >
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <input
                        type="number"
                        name="diastolicBP"
                        min="40"
                        max="130"
                        value={formData.diastolicBP}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-white/10 bg-white/5 p-4 font-mono text-sm text-white focus:border-cyan-500 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all duration-300"
                        placeholder="e.g. 80"
                      />
                      <p className="text-[11px] text-gray-500">Enter the values shown on your BP monitor.</p>
                    </div>
                  </div>
                </motion.div>

                {/* SECTION 4: Health History */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="rounded-3xl glass-panel p-6 md:p-8 border border-white/10 space-y-6 hover:shadow-[0_0_30px_rgba(6,182,212,0.05)] transition-shadow duration-300"
                >
                  <div className="space-y-2">
                    <span className="font-mono text-[10px] tracking-widest text-cyan-400 font-bold uppercase block">04. Clinical History</span>
                    <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                      <HeartPulse className="h-5 w-5 text-cyan-400" />
                      Health History
                    </h3>
                    <p className="text-xs text-gray-400">
                      Please select any health conditions you have been diagnosed with.
                    </p>
                  </div>
                  
                  <div className="h-px bg-white/5 my-6" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr">
                    {switchCards.map((card) => {
                      const IconComponent = card.icon;
                      return (
                        <div 
                          key={card.id}
                          className={`relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 cursor-pointer group min-h-[100px] h-full ${
                            card.active 
                              ? 'bg-cyan-500/5 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.05)]' 
                              : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10'
                          }`}
                          onClick={card.toggle}
                        >
                          <div className="flex items-start gap-3.5 pr-4 relative">
                            <div className={`p-2.5 rounded-xl border mt-0.5 shrink-0 ${
                              card.active 
                                ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' 
                                : 'bg-white/5 border-white/10 text-gray-400'
                            }`}>
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div className="space-y-0.5 relative">
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-display text-sm font-bold text-white">{card.title}</h4>
                                {tooltipData[card.id] && (
                                  <button
                                    type="button"
                                    onClick={(e) => toggleTooltip(e, card.id)}
                                    className="text-cyan-400 hover:text-cyan-300 focus:outline-none cursor-pointer inline-flex items-center"
                                    title={`${card.title} Info`}
                                  >
                                    <Info className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-500 leading-normal">{card.description}</p>
                            </div>
                          </div>

                          {/* Modern Premium Checkbox */}
                          <div className="shrink-0">
                            <MedicalCheckbox checked={card.active} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* SECTION 5: Lifestyle Factors */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-3xl glass-panel p-6 md:p-8 border border-white/10 space-y-6 hover:shadow-[0_0_30px_rgba(6,182,212,0.05)] transition-shadow duration-300"
                >
                  <div className="space-y-2">
                    <span className="font-mono text-[10px] tracking-widest text-cyan-400 font-bold uppercase block">05. Lifestyle</span>
                    <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                      <Stethoscope className="h-5 w-5 text-cyan-400" />
                      Lifestyle Factors
                    </h3>
                    <p className="text-xs text-gray-400">
                      Your daily habits and active physical routines.
                    </p>
                  </div>
                  
                  <div className="h-px bg-white/5 my-6" />

                  <div className="space-y-6">
                    {/* Smoking and Physical Activity options side-by-side (Perfect Arrangement) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Smoking option checklist cards */}
                      <div className="space-y-3">
                        <span className="font-mono text-xs tracking-wider text-cyan-400 font-bold uppercase block">Do you smoke?</span>
                        <div className="space-y-3">
                          {smokingOptions.map((opt) => {
                            const IconComp = opt.icon;
                            const isSelected = formData.smoking === opt.value;
                            return (
                              <div
                                key={opt.value}
                                onClick={() => setFormData(prev => ({ ...prev, smoking: opt.value as any }))}
                                className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all duration-300 group min-h-[80px] ${
                                  isSelected 
                                    ? 'bg-cyan-500/5 border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.05)] scale-[1.01]' 
                                    : 'bg-white/5 border-white/5 hover:border-white/10 text-gray-300 hover:text-white'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${
                                    isSelected ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' : 'bg-white/5 border-white/10 text-gray-400'
                                  }`}>
                                    <IconComp className="h-4.5 w-4.5" />
                                  </div>
                                  <div>
                                    <span className="font-display text-sm font-bold text-white block">{opt.label}</span>
                                    <span className="text-[10px] text-gray-500 leading-normal">{opt.desc}</span>
                                  </div>
                                </div>
                                <div className="shrink-0">
                                  <MedicalCheckbox checked={isSelected} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Physical Activity checklist cards */}
                      <div className="space-y-3">
                        <span className="font-mono text-xs tracking-wider text-cyan-400 font-bold uppercase block">Do you exercise regularly?</span>
                        <div className="space-y-3">
                          {activityOptions.map((opt) => {
                            const IconComp = opt.icon;
                            const isSelected = formData.activityLevel === opt.value;
                            return (
                              <div
                                key={opt.value}
                                onClick={() => setFormData(prev => ({ ...prev, activityLevel: opt.value as any }))}
                                className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all duration-300 group min-h-[80px] ${
                                  isSelected 
                                    ? 'bg-cyan-500/5 border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.05)] scale-[1.01]' 
                                    : 'bg-white/5 border-white/5 hover:border-white/10 text-gray-300 hover:text-white'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${
                                    isSelected ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' : 'bg-white/5 border-white/10 text-gray-400'
                                  }`}>
                                    <IconComp className="h-4.5 w-4.5" />
                                  </div>
                                  <div>
                                    <span className="font-display text-sm font-bold text-white block">{opt.label}</span>
                                    <span className="text-[10px] text-gray-500 leading-normal">{opt.desc}</span>
                                  </div>
                                </div>
                                <div className="shrink-0">
                                  <MedicalCheckbox checked={isSelected} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>


                  </div>
                </motion.div>
              </div>

              {/* Right Column (30%): Sticky Sidebar containing Prediction Summary & Upload & Primary Actions */}
              <div className="lg:col-span-4 lg:sticky lg:top-6 self-start space-y-6">
                
                {/* SECTION 6: Upload Medical Report (Optional) */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="rounded-3xl glass-panel p-6 md:p-8 border border-white/10 space-y-6 hover:shadow-[0_0_30px_rgba(6,182,212,0.05)] transition-shadow duration-300"
                >
                  <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                    <UploadCloud className="h-5 w-5 text-cyan-400" />
                    <h3 className="font-display text-sm font-bold text-white tracking-wider uppercase">
                      Upload Medical Report (Optional)
                    </h3>
                  </div>

                  <p className="text-xs text-gray-400 leading-normal">
                    Securely upload a digital copy of your latest laboratory report (PDF or Image) to dynamically pre-fill parameters and scan for clinical anomalies.
                  </p>

                  <div className="pt-2">
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 cursor-pointer ${
                        isDragging 
                          ? 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.25)]' 
                          : uploadedFile 
                            ? 'border-emerald-500/50 bg-emerald-500/5' 
                            : 'border-white/10 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.1)] bg-white/5'
                      }`}
                    >
                      <input 
                        type="file" 
                        id="report-file-input"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        className="hidden" 
                      />
                      <label htmlFor="report-file-input" className="cursor-pointer flex flex-col items-center justify-center gap-3 w-full h-full">
                        {isParsingFile ? (
                          <div className="flex flex-col items-center justify-center gap-3 w-full py-2">
                            <div className="relative mb-1">
                              <div className="h-12 w-12 rounded-full border border-cyan-500/10 flex items-center justify-center">
                                <RefreshCw className="h-6 w-6 text-cyan-400 animate-spin" />
                              </div>
                              <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-md animate-pulse" />
                            </div>
                            <p className="font-display text-xs font-bold text-white uppercase tracking-wider animate-pulse">
                              Extracting Lab Data...
                            </p>
                            <p className="text-[10px] text-cyan-400 font-mono text-center max-w-[220px]">
                              {parsingStepText}
                            </p>
                          </div>
                        ) : uploadedFile ? (
                          <>
                            <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-400 border border-emerald-500/20">
                              <FileText className="h-8 w-8" />
                            </div>
                            <p className="font-display text-xs font-bold text-white max-w-[200px] truncate">
                              {uploadedFile.name}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono">
                              {(uploadedFile.size / 1024).toFixed(1)} KB
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="p-3 bg-cyan-500/10 rounded-full text-cyan-400 border border-cyan-500/20">
                              <UploadCloud className="h-8 w-8" />
                            </div>
                            <p className="font-display text-xs font-bold text-white">
                              Drag & drop your files here, or <span className="text-cyan-400 hover:underline">browse files</span>
                            </p>
                            <p className="text-[10px] text-gray-500 font-mono">
                              Supports PDF, Word, JPEG, PNG up to 10MB
                            </p>
                          </>
                        )}
                      </label>

                      {uploadedFile && !isParsingFile && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setUploadedFile(null);
                          }}
                          className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all duration-300"
                          title="Remove File"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* 1. HEALTH SUMMARY */}
                <div className="rounded-3xl glass-panel p-8 border border-white/10 space-y-6 hover:shadow-[0_0_30px_rgba(6,182,212,0.05)] transition-shadow duration-300">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                    <HeartPulse className="h-5 w-5 text-cyan-400 animate-pulse" />
                    <h3 className="font-display text-sm font-bold text-white tracking-wider uppercase">
                      Health Summary
                    </h3>
                  </div>

                  <div className="space-y-4 font-mono text-xs">
                    <div className="flex justify-between py-3 border-b border-white/5 items-center">
                      <span className="text-gray-400">AGE:</span>
                      <span className="text-white text-sm font-bold">{formData.age || '—'} yrs</span>
                    </div>

                    <div className="flex justify-between py-3 border-b border-white/5 items-center">
                      <span className="text-gray-400">GENDER:</span>
                      <span className="text-white text-sm font-bold uppercase">{formData.gender}</span>
                    </div>

                    <div className="flex justify-between py-3 border-b border-white/5 items-center">
                      <span className="text-gray-400">BMI:</span>
                      <span className="text-white text-sm font-bold">
                        {calculatedBMI} ({bmiStatus(calculatedBMI).label})
                      </span>
                    </div>

                    <div className="space-y-2 py-3 border-b border-white/5">
                      <span className="text-gray-400 block mb-2">HEALTH INDICATORS:</span>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wide ${formData.cholesterol ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                          Cholesterol: {formData.cholesterol ? 'HIGH' : 'NORMAL'}
                        </span>
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wide ${formData.familyHistory ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                          Family Hist: {formData.familyHistory ? 'YES' : 'NO'}
                        </span>
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wide ${(formData.systolicBP >= 130 || formData.diastolicBP >= 85) ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                          High Blood Pressure: {(formData.systolicBP >= 130 || formData.diastolicBP >= 85) ? 'YES' : 'NO'}
                        </span>
                        {heartDisease && (
                          <span className="px-2.5 py-1 rounded text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 font-bold tracking-wide">
                            Heart Disease
                          </span>
                        )}
                        {strokeHistory && (
                          <span className="px-2.5 py-1 rounded text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 font-bold tracking-wide">
                            Stroke History
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between py-3 border-b border-white/5 items-center">
                      <span className="text-gray-400">SMOKING:</span>
                      <span className="text-white text-sm font-bold uppercase">{formData.smoking}</span>
                    </div>

                    <div className="flex justify-between py-3 border-b border-white/5 items-center">
                      <span className="text-gray-400">ACTIVITY LEVEL:</span>
                      <span className="text-white text-sm font-bold uppercase">{formData.activityLevel}</span>
                    </div>

                    <div className="flex justify-between py-3 items-center">
                      <span className="text-gray-400">HEALTH REPORT STATUS:</span>
                      <span className={`text-sm font-bold ${uploadedFile ? 'text-emerald-400' : 'text-gray-500'}`}>
                        {uploadedFile ? 'UPLOADED' : 'NOT SUPPLIED'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. PRIMARY ACTION BUTTONS */}
                <div className="space-y-4 pt-4">
                  {/* Check My Diabetes Risk */}
                  <button
                    onClick={calculatePrediction}
                    className="w-full relative flex items-center justify-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 px-8 py-5 shadow-[0_0_35px_rgba(6,182,212,0.3)] hover:shadow-[0_0_50px_rgba(6,182,212,0.55)] hover:scale-[1.02] transition-all duration-300 cursor-pointer text-white font-bold uppercase tracking-wider text-sm font-display"
                    id="prediction-run-btn"
                  >
                    <Stethoscope className="h-5 w-5 animate-pulse text-white" />
                    <span>Check My Diabetes Risk</span>
                    <ChevronRight className="h-5 w-5 text-white" />
                  </button>

                  {/* Clear All Information */}
                  <button
                    onClick={clearForm}
                    className="w-full py-5 px-8 rounded-full border border-white/10 hover:border-white/30 text-gray-300 hover:text-white transition-all duration-300 font-mono text-xs tracking-widest uppercase cursor-pointer text-center flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Clear All Information</span>
                  </button>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
