import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  ArrowLeft, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  Heart, 
  User, 
  Sparkles,
  Search,
  Plus
} from 'lucide-react';
import { useAuth, useHistory, PredictionRecord } from '../lib/firebase';

export default function History() {
  const { currentUser, loading: authLoading } = useAuth();
  const { history, loading: historyLoading } = useHistory();
  const navigate = useNavigate();
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  if (authLoading || historyLoading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[70vh]">
        <div className="relative flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
          <p className="font-mono text-xs text-gray-400 tracking-wider">RETRIEVING ASSESSMENT LOGS...</p>
        </div>
      </div>
    );
  }

  // Handle unauthenticated state
  if (!currentUser) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
        <div className="max-w-md glass-panel p-8 rounded-3xl border border-white/5 space-y-6">
          <div className="h-16 w-16 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-2xl flex items-center justify-center mx-auto">
            <Activity className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h3 className="font-display text-xl font-bold text-white">Access Verification Required</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Please sign in to securely fetch your historical clinical screenings and risk assessments.
            </p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display text-sm font-bold uppercase tracking-wider transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Filter history records based on search term
  const filteredHistory = history.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.riskLevel.toLowerCase().includes(searchLower) ||
      item.date.toLowerCase().includes(searchLower) ||
      item.id.toLowerCase().includes(searchLower)
    );
  });

  const getRiskColor = (level: 'Low' | 'Moderate' | 'High') => {
    switch (level) {
      case 'High':
        return {
          bg: 'bg-red-500/10 border-red-500/30 text-red-400',
          text: 'text-red-400',
          badge: 'bg-red-500 text-slate-950',
          glow: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]'
        };
      case 'Moderate':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          text: 'text-amber-400',
          badge: 'bg-amber-500 text-slate-950',
          glow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]'
        };
      case 'Low':
      default:
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          text: 'text-emerald-400',
          badge: 'bg-emerald-500 text-slate-950',
          glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]'
        };
    }
  };

  const toFiniteNumber = (value: unknown): number | null => {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const formatBMI = (value: unknown): string => {
    const bmi = toFiniteNumber(value);
    if (bmi === null) {
      return '-- kg/m²';
    }
    return `${bmi.toFixed(1)} kg/m²`;
  };

  const formatAgeSex = (age: unknown, gender: string): string => {
    const ageNum = toFiniteNumber(age);
    const normalizedGender = gender ? `${gender}`.trim().toLowerCase() : '--';
    const displayGender = normalizedGender === '--'
      ? '--'
      : normalizedGender.charAt(0).toUpperCase() + normalizedGender.slice(1);
    return `${ageNum !== null ? Math.round(ageNum) : '--'} Yrs / ${displayGender}`;
  };

  const formatGlucose = (value: unknown): string => {
    const glucose = toFiniteNumber(value);
    if (glucose === null) {
      return '-- mg/dL';
    }
    return `${Math.round(glucose)} mg/dL`;
  };

  const formatBloodPressure = (systolic: unknown, diastolic: unknown): string => {
    const sys = toFiniteNumber(systolic);
    const dia = toFiniteNumber(diastolic);

    // Display only clinically plausible values to avoid malformed rendering like 2/20.
    if (sys === null || dia === null || sys < 70 || sys > 260 || dia < 40 || dia > 160) {
      return '-- / -- mmHg';
    }

    return `${Math.round(sys)} / ${Math.round(dia)} mmHg`;
  };

  return (
    <div className="flex-grow w-full max-w-5xl mx-auto px-4 py-8 md:py-12">
      {/* Back to dashboard */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/prediction')}
          className="flex items-center gap-2 text-xs font-mono text-cyan-600 hover:text-cyan-500 tracking-widest uppercase transition-colors duration-200 group cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
          Back to Dashboard
        </button>
      </div>

      <div className="space-y-8">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <span className="font-mono text-[10px] tracking-widest text-cyan-600 font-bold uppercase block">METABOLIC TIMELINE</span>
            <h1 className="font-display text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <Activity className="h-8 w-8 text-cyan-600" />
              Assessment History
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Review and audit all historical diabetes risk prediction records securely logged on the blockchain ledger.
            </p>
          </div>

          {history.length > 0 && (
            <button
              onClick={() => navigate('/prediction')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:scale-[1.02] text-white font-display text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-[0_4px_12px_rgba(18,110,96,0.12)] cursor-pointer self-start md:self-auto"
            >
              <Plus className="h-4 w-4" />
              New Prediction
            </button>
          )}
        </div>

        {/* Search Bar / Filters */}
        {history.length > 0 && (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search assessment records by risk levels, dates, or screening IDs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/5 bg-white/5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 transition-all duration-300 font-display"
            />
          </div>
        )}

        {/* Main Records Stage */}
        {history.length === 0 ? (
          /* Empty State */
          <div className="glass-panel p-10 md:p-16 rounded-3xl border border-white/5 text-center max-w-lg mx-auto space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
            <div className="h-20 w-20 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <Activity className="h-10 w-10 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-display text-xl font-bold text-white">No assessment history available.</h3>
              <p className="text-sm text-gray-400 leading-relaxed max-w-sm mx-auto">
                You haven't run any diabetes risk screenings yet. Take your first digital health assessment to begin tracking your biometric patterns.
              </p>
            </div>

            <button
              onClick={() => navigate('/prediction')}
              className="px-8 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer inline-flex items-center gap-2"
            >
              Start Your First Prediction
              <Sparkles className="h-4 w-4" />
            </button>
          </div>
        ) : filteredHistory.length === 0 ? (
          /* Search Empty State */
          <div className="text-center py-12 space-y-2">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
            <h4 className="text-white font-display font-medium text-base">No matching records found</h4>
            <p className="text-gray-400 text-xs">Try adjusting your search query or keywords.</p>
          </div>
        ) : (
          /* History Cards List */
          <div className="space-y-5">
            {filteredHistory.map((record) => {
              const riskInfo = getRiskColor(record.riskLevel);
              const isExpanded = expandedCardId === record.id;

              return (
                <div 
                  key={record.id}
                  className={`glass-panel border rounded-2xl overflow-hidden transition-all duration-300 relative ${
                    isExpanded ? 'border-cyan-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)]' : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Date and ID */}
                    <div className="flex items-start gap-4">
                      <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-cyan-400 shrink-0">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-gray-400">ID: #{record.id}</span>
                          <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                          <span className="font-mono text-[10px] tracking-wide text-emerald-400 uppercase font-bold px-2 py-0.5 rounded bg-emerald-400/10 border border-emerald-400/20">
                            COMPLETED
                          </span>
                        </div>
                        <h3 className="font-display text-white text-base font-bold">{record.date}</h3>
                      </div>
                    </div>

                    {/* Quick Risk Indicator */}
                    <div className="flex items-center gap-4">
                      <div className={`px-4 py-2 rounded-xl border ${riskInfo.bg} ${riskInfo.glow} flex flex-col items-center justify-center min-w-[120px]`}>
                        <span className="font-mono text-[9px] tracking-wider text-gray-400 uppercase block">RISK STATUS</span>
                        <span className="font-display font-black text-sm tracking-wider">{record.riskLevel.toUpperCase()} RISK</span>
                      </div>

                      <div className="flex flex-col">
                        <span className="font-mono text-[9px] text-gray-400 uppercase">Risk Index</span>
                        <span className={`font-display text-2xl font-black ${riskInfo.text}`}>{record.riskPercentage}%</span>
                      </div>
                    </div>

                    {/* Biometrics Preview row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-4 gap-y-3 bg-white/5 rounded-xl p-4 border border-white/5 flex-grow lg:max-w-md">
                      <div className="min-w-0 space-y-1">
                        <span className="font-mono text-[9px] tracking-wider text-gray-400 uppercase block">Age / Sex</span>
                        <span className="text-white text-xs font-medium whitespace-nowrap block overflow-hidden text-ellipsis">{formatAgeSex(record.age, record.gender)}</span>
                      </div>
                      <div className="min-w-0 space-y-1">
                        <span className="font-mono text-[9px] tracking-wider text-gray-400 uppercase block">BMI</span>
                        <span className="text-white text-xs font-medium whitespace-nowrap block overflow-hidden text-ellipsis">{formatBMI(record.bmi)}</span>
                      </div>
                      <div className="min-w-0 space-y-1">
                        <span className="font-mono text-[9px] tracking-wider text-gray-400 uppercase block">Fasting Glucose</span>
                        <span className="text-white text-xs font-medium whitespace-nowrap block overflow-hidden text-ellipsis">{formatGlucose(record.glucose)}</span>
                      </div>
                      <div className="min-w-0 space-y-1">
                        <span className="font-mono text-[9px] tracking-wider text-gray-400 uppercase block">BP</span>
                        <span className="text-white text-xs font-medium whitespace-nowrap block overflow-hidden text-ellipsis">{formatBloodPressure(record.systolicBP, record.diastolicBP)}</span>
                      </div>
                    </div>

                    {/* View Details Toggle */}
                    <button
                      onClick={() => setExpandedCardId(isExpanded ? null : record.id)}
                      className="px-4 py-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 text-xs font-display font-bold text-white tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-colors duration-200 select-none shrink-0"
                    >
                      {isExpanded ? 'Hide Details' : 'View Details'}
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-cyan-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </button>
                  </div>

                  {/* Collapsible Details Panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-white/5 bg-slate-950/45"
                      >
                        <div className="p-6 md:p-8 space-y-6 text-sm">
                          {/* Clinical Notes */}
                          <div className="space-y-2">
                            <h4 className="font-display font-bold text-white tracking-wide flex items-center gap-2 text-xs uppercase">
                              <Activity className="h-3.5 w-3.5 text-cyan-400" />
                              Clinical Summary & Diagnosis
                            </h4>
                            <p className="text-gray-300 leading-relaxed text-xs p-4 rounded-xl bg-white/5 border border-white/5">
                              {record.clinicalNotes}
                            </p>
                          </div>

                          {/* Specific Recommendations */}
                          <div className="space-y-3">
                            <h4 className="font-display font-bold text-white tracking-wide flex items-center gap-2 text-xs uppercase">
                              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                              Precision Medical Recommendations
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {record.recommendations.map((rec, i) => (
                                <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs text-gray-300">
                                  <span className="h-5 w-5 shrink-0 rounded-full bg-cyan-400/10 text-cyan-400 flex items-center justify-center font-bold text-[10px]">
                                    {i + 1}
                                  </span>
                                  <span>{rec}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
