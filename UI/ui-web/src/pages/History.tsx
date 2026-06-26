import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  ArrowLeft, 
  Calendar, 
  AlertTriangle, 
  Sparkles,
  Search,
  Trash2,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Info,
  Clock,
  User,
  Heart,
  FileText
} from 'lucide-react';
import { useAuth, useHistory, PredictionRecord } from '../lib/firebase';

export default function History() {
  const { currentUser, loading: authLoading } = useAuth();
  const { history, totalCount, loading: historyLoading, fetchHistory, deletePredictionRecord } = useHistory();
  const navigate = useNavigate();

  // Search, Pagination, Sorting State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('id_desc');
  const [page, setPage] = useState(1);
  const limit = 5; // 5 cards per page

  // Selected details modal state
  const [selectedRecord, setSelectedRecord] = useState<PredictionRecord | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Trigger search and page queries
  useEffect(() => {
    if (currentUser) {
      fetchHistory(searchTerm, sortBy, page, limit);
    }
  }, [currentUser, sortBy, page]);

  // Debounced search trigger (manual trigger or typing with reset to page 1)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchHistory(searchTerm, sortBy, 1, limit);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this prediction history record?")) {
      setIsDeletingId(id);
      try {
        await deletePredictionRecord(id);
        // Refresh list
        const maxPages = Math.ceil((totalCount - 1) / limit) || 1;
        const targetPage = page > maxPages ? maxPages : page;
        setPage(targetPage);
        fetchHistory(searchTerm, sortBy, targetPage, limit);
      } catch (err) {
        console.error("Delete prediction failed:", err);
      } finally {
        setIsDeletingId(null);
      }
    }
  };

  const handleDownload = (record: PredictionRecord) => {
    // Generate a simple CSV/Text diagnostic report for the user to download
    const reportContent = `--------------------------------------------------
DIABETES RISK PREDICTION ASSESSMENT REPORT
--------------------------------------------------
ID: #${record.id}
Date: ${record.date}
Risk Level: ${record.riskLevel.toUpperCase()} RISK
Risk Percentage: ${record.riskPercentage}%
Predicted Class: ${record.prediction}

PATIENT CLINICAL BIOMARKERS:
Age: ${record.age} Years
Gender: ${record.gender}
Height: ${record.height} cm
Weight: ${record.weight} kg
Calculated BMI: ${record.bmi}
Fasting Blood Sugar: ${record.glucose} mg/dL
Long-Term HbA1c: ${record.hba1c}%
Blood Pressure: ${record.systolicBP}/${record.diastolicBP} mmHg

HEALTH CONTEXT:
Family History: ${record.health_history.familyHistory ? 'Yes' : 'No'}
High Cholesterol: ${record.health_history.cholesterol ? 'Yes' : 'No'}
Heart Disease: ${record.health_history.heartDisease ? 'Yes' : 'No'}
Stroke History: ${record.health_history.strokeHistory ? 'Yes' : 'No'}

LIFESTYLE METRICS:
Activity Level: ${record.lifestyle_factors.activityLevel}
Smoking Status: ${record.lifestyle_factors.smoking}

OCR EXTRACTED REPORT FILENAME:
${record.uploaded_report_name || 'No medical report uploaded (manual entry)'}

CLINICAL DIAGNOSIS SUMMARY:
${record.clinicalNotes}

PRECISION RECOMMENDATIONS:
${record.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}
--------------------------------------------------`;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Diabetes_Report_${record.id}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (authLoading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[70vh]">
        <div className="relative flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
          <p className="font-mono text-xs text-gray-400 tracking-wider">RETRIEVING HISTORICAL LOGS...</p>
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

  const totalPages = Math.ceil(totalCount / limit) || 1;

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

  return (
    <div className="flex-grow w-full max-w-5xl mx-auto px-4 py-8 md:py-12 relative text-slate-100">
      {/* Back to dashboard */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-xs font-mono text-cyan-600 hover:text-cyan-500 tracking-widest uppercase transition-colors duration-200 group cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
          Back to Home
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
              Review and audit all historical diabetes risk prediction records securely stored in your patient profile.
            </p>
          </div>
        </div>

        {/* Search and Filter Row */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-950/30 p-4 rounded-2xl border border-white/5">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by risk level, prediction result, date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-white/5 bg-white/5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 transition-all duration-300 font-display"
            />
          </form>

          {/* Sorting Dropdown */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <span className="text-xs text-gray-400 font-mono uppercase tracking-wider shrink-0">Sort By</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-56 px-3.5 py-2.5 rounded-xl border border-white/5 bg-slate-900 text-xs text-white focus:outline-none focus:border-cyan-400/50 transition-all duration-300"
            >
              <option value="id_desc">Newest Prediction First</option>
              <option value="id_asc">Oldest Prediction First</option>
              <option value="risk_percentage_desc">Risk Percentage: High to Low</option>
              <option value="risk_percentage_asc">Risk Percentage: Low to High</option>
            </select>
          </div>
        </div>

        {/* Main Records Stage */}
        {historyLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="h-8 w-8 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
            <p className="font-mono text-xs text-gray-400">LOADING LOG HISTORY...</p>
          </div>
        ) : history.length === 0 ? (
          /* Empty State */
          <div className="glass-panel p-10 md:p-16 rounded-3xl border border-white/5 text-center max-w-lg mx-auto space-y-6 shadow-xl relative overflow-hidden bg-slate-900/40">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
            <div className="h-20 w-20 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <Activity className="h-10 w-10 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-display text-xl font-bold text-white">No assessment history available.</h3>
              <p className="text-sm text-gray-400 leading-relaxed max-w-sm mx-auto">
                You haven't run any diabetes risk predictions yet. Go back to dashboard to run your first screening.
              </p>
            </div>
            
            <button
              onClick={() => navigate('/prediction')}
              className="px-8 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer inline-flex items-center gap-2"
            >
              Start Prediction Screen
              <Sparkles className="h-4 w-4" />
            </button>
          </div>
        ) : (
          /* History Cards List */
          <div className="space-y-5">
            {history.map((record) => {
              const riskInfo = getRiskColor(record.riskLevel);
              const isDeleting = isDeletingId === record.id;

              return (
                <div 
                  key={record.id}
                  className="glass-panel border border-white/5 hover:border-white/10 rounded-2xl overflow-hidden transition-all duration-300 relative bg-slate-900/40 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  {/* Date and ID */}
                  <div className="flex items-start gap-4">
                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-cyan-400 shrink-0">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-gray-400">ID: #{record.id}</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                        <span className="font-mono text-[9px] tracking-wide text-cyan-400 uppercase font-bold px-2 py-0.5 rounded bg-cyan-400/10 border border-cyan-400/20">
                          {record.prediction.toUpperCase()}
                        </span>
                      </div>
                      <h3 className="font-display text-white text-base font-bold">{record.date}</h3>
                    </div>
                  </div>

                  {/* Quick Risk Indicator */}
                  <div className="flex items-center gap-4">
                    <div className={`px-4 py-2 rounded-xl border ${riskInfo.bg} ${riskInfo.glow} flex flex-col items-center justify-center min-w-[125px]`}>
                      <span className="font-mono text-[9px] tracking-wider text-gray-400 uppercase block">RISK STATUS</span>
                      <span className="font-display font-black text-xs tracking-wider">{record.riskLevel.toUpperCase()} RISK</span>
                    </div>

                    <div className="flex flex-col">
                      <span className="font-mono text-[9px] text-gray-400 uppercase">Risk Index</span>
                      <span className={`font-display text-2xl font-black ${riskInfo.text}`}>{record.riskPercentage}%</span>
                    </div>
                  </div>

                  {/* Biometrics Preview Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white/5 rounded-xl p-4 border border-white/5 flex-grow lg:max-w-xs">
                    <div className="space-y-0.5">
                      <span className="font-mono text-[9px] tracking-wider text-gray-400 uppercase block">Age / Sex</span>
                      <span className="text-white text-xs font-medium capitalize">{record.age} yrs / {record.gender}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="font-mono text-[9px] tracking-wider text-gray-400 uppercase block">BMI</span>
                      <span className="text-white text-xs font-medium">{record.bmi}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="font-mono text-[9px] tracking-wider text-gray-400 uppercase block">Blood Sugar</span>
                      <span className="text-white text-xs font-medium">{record.glucose}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="font-mono text-[9px] tracking-wider text-gray-400 uppercase block">HbA1c</span>
                      <span className="text-white text-xs font-medium">{record.hba1c}%</span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center gap-2.5 select-none shrink-0 self-end lg:self-center">
                    <button
                      onClick={() => setSelectedRecord(record)}
                      className="p-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-cyan-500/20 text-white hover:text-cyan-400 transition-all duration-200 cursor-pointer"
                      title="View Details"
                    >
                      <Eye className="h-4.5 w-4.5" />
                    </button>
                    <button
                      onClick={() => handleDownload(record)}
                      className="p-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-cyan-500/20 text-white hover:text-cyan-400 transition-all duration-200 cursor-pointer"
                      title="Download Report"
                    >
                      <Download className="h-4.5 w-4.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(record.id)}
                      disabled={isDeleting}
                      className="p-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-rose-500/10 hover:border-rose-500/30 text-white hover:text-rose-400 disabled:opacity-40 transition-all duration-200 cursor-pointer"
                      title="Delete Record"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-6 border-t border-white/5">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="p-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-mono text-gray-400">
                  Page <span className="text-white font-bold">{page}</span> of <span className="text-white font-bold">{totalPages}</span>
                </span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="p-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* View Detailed Profile Modal Dialog */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="w-full max-w-2xl bg-slate-900 border border-slate-700/50 rounded-3xl p-6 md:p-8 shadow-2xl relative text-slate-300 my-8 max-h-[90vh] overflow-y-auto"
            >
              {/* Top Summary Banner */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-white/5 mb-6">
                <div>
                  <span className="text-[9px] font-mono tracking-widest text-cyan-500 uppercase font-bold block">Biometric Record Detail</span>
                  <h3 className="font-display text-xl font-bold text-white flex items-center gap-2 mt-0.5">
                    <Activity className="h-5 w-5 text-cyan-400" />
                    ID: #{selectedRecord.id}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span>Logged on {selectedRecord.date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1.5 rounded-xl border ${getRiskColor(selectedRecord.riskLevel).bg} text-xs font-bold font-display uppercase tracking-wider`}>
                    {selectedRecord.riskLevel} Risk ({selectedRecord.riskPercentage}%)
                  </div>
                </div>
              </div>

              {/* Data Sections */}
              <div className="space-y-6">
                {/* 1. Primary Inputs Grid */}
                <div className="space-y-2.5">
                  <h4 className="font-display text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    Patient Physiological Markers
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-500 block">Age</span>
                      <span className="text-white font-medium">{selectedRecord.age} Years</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">Gender</span>
                      <span className="text-white font-medium capitalize">{selectedRecord.gender}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">Height</span>
                      <span className="text-white font-medium">{selectedRecord.height} cm</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">Weight</span>
                      <span className="text-white font-medium">{selectedRecord.weight} kg</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">Body Mass Index (BMI)</span>
                      <span className="text-white font-bold text-cyan-400">{selectedRecord.bmi}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">Blood Sugar Level</span>
                      <span className="text-white font-medium">{selectedRecord.glucose} mg/dL</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">Glycated HbA1c</span>
                      <span className="text-white font-medium">{selectedRecord.hba1c}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">Blood Pressure</span>
                      <span className="text-white font-medium">{selectedRecord.systolicBP}/{selectedRecord.diastolicBP} mmHg</span>
                    </div>
                  </div>
                </div>

                {/* 2. Medical History & Lifestyle Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Medical History */}
                  <div className="space-y-2">
                    <h4 className="font-display text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Heart className="h-3.5 w-3.5" />
                      Family & Medical History
                    </h4>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Family Genetic Lineage</span>
                        <span className={`font-bold ${selectedRecord.health_history.familyHistory ? 'text-red-400' : 'text-emerald-400'}`}>
                          {selectedRecord.health_history.familyHistory ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">High Cholesterol History</span>
                        <span className={`font-bold ${selectedRecord.health_history.cholesterol ? 'text-red-400' : 'text-emerald-400'}`}>
                          {selectedRecord.health_history.cholesterol ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Cholesterol Checked</span>
                        <span className={`font-bold ${selectedRecord.health_history.cholesterolChecked ? 'text-cyan-400' : 'text-gray-500'}`}>
                          {selectedRecord.health_history.cholesterolChecked ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Coronary Heart Disease</span>
                        <span className={`font-bold ${selectedRecord.health_history.heartDisease ? 'text-red-400' : 'text-emerald-400'}`}>
                          {selectedRecord.health_history.heartDisease ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Cerebrovascular Stroke History</span>
                        <span className={`font-bold ${selectedRecord.health_history.strokeHistory ? 'text-red-400' : 'text-emerald-400'}`}>
                          {selectedRecord.health_history.strokeHistory ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lifestyle */}
                  <div className="space-y-2">
                    <h4 className="font-display text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      Lifestyle Factors
                    </h4>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Physical Activity Index</span>
                        <span className="font-bold text-white capitalize">
                          {selectedRecord.lifestyle_factors.activityLevel}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Smoking Habit</span>
                        <span className="font-bold text-white capitalize">
                          {selectedRecord.lifestyle_factors.smoking}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 pt-2.5 border-t border-white/5">
                        <span className="text-[10px] text-gray-500">Report Reference</span>
                        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono">
                          <FileText className="h-3.5 w-3.5 shrink-0 text-cyan-500" />
                          <span className="truncate max-w-[180px]">
                            {selectedRecord.uploaded_report_name || "Manual Biomarker Entry"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. OCR Extracted Report Values (If Report Name present) */}
                {selectedRecord.uploaded_report_name && (
                  <div className="space-y-2">
                    <h4 className="font-display text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      OCR Extracted Values From Document
                    </h4>
                    <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/10 text-xs text-gray-300 leading-relaxed flex items-start gap-2.5">
                      <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        Values for <strong className="text-cyan-400">Age, Gender, Height, Weight, Fasting Glucose, HbA1c, and BP</strong> were parsed and extracted directly from the uploaded medical PDF/Image report file (<span className="font-mono text-[10px]">{selectedRecord.uploaded_report_name}</span>).
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Predictions & Recommendations */}
                <div className="space-y-3">
                  <h4 className="font-display text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                    <TrendingDown className="h-3.5 w-3.5" />
                    Clinical Analysis Summary
                  </h4>
                  <p className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xs text-slate-300 leading-relaxed">
                    {selectedRecord.clinicalNotes}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {selectedRecord.recommendations.map((rec, i) => (
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

              {/* Action buttons */}
              <div className="flex gap-4 border-t border-white/5 pt-6 mt-6">
                <button
                  onClick={() => handleDownload(selectedRecord)}
                  className="flex-1 h-11 rounded-xl border border-white/10 hover:bg-white/5 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4 text-cyan-500" />
                  Download Report
                </button>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="flex-1 h-11 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Close details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
