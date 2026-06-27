import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  User, 
  Phone, 
  Droplet, 
  Calendar, 
  ArrowLeft,
  Activity,
  Heart,
  Scale
} from 'lucide-react';
import { useAuth, useProfile } from '../lib/firebase';

export default function Profile() {
  const { currentUser, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const navigate = useNavigate();

  if (authLoading || profileLoading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[70vh]">
        <div className="relative flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
          <p className="font-mono text-xs text-gray-400 tracking-wider">LOADING METABOLIC PROFILE...</p>
        </div>
      </div>
    );
  }

  // Fallback if not logged in
  if (!currentUser || !profile) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
        <div className="max-w-md glass-panel p-8 rounded-3xl border border-white/5 space-y-6">
          <div className="h-16 w-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto">
            <User className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h3 className="font-display text-xl font-bold text-white">Authentication Required</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Please sign in to access your secure patient profile and screening results.
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

  return (
    <div className="flex-grow w-full max-w-4xl mx-auto px-4 py-8 md:py-12 relative">
      {/* Back button */}
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
        {/* Page Title */}
        <div className="space-y-1">
          <span className="font-mono text-[10px] tracking-widest text-cyan-600 font-bold uppercase block">Secure Portal</span>
          <h1 className="font-display text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <User className="h-8 w-8 text-cyan-600" />
            My Profile
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            View and manage your clinical data, physiological markers, and patient credentials.
          </p>
        </div>

        {/* Profile Card Header */}
        <div className="glass-panel p-6 md:p-8 rounded-3xl border border-medical-border relative overflow-hidden flex flex-col md:flex-row items-center gap-6 shadow-[0_8px_30px_rgba(18,110,96,0.04)]">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-cyan-500/5 blur-[50px] pointer-events-none" />
          
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 blur-md opacity-20" />
            <img 
              src={currentUser.photoURL || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150"} 
              alt={profile.name} 
              className="relative h-24 w-24 rounded-full object-cover border-2 border-cyan-400"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="text-center md:text-left space-y-2">
            <h2 className="font-display text-2xl font-bold text-slate-900 tracking-wide">{profile.name}</h2>
            <p className="text-sm text-slate-500 font-medium">{profile.email}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-1">
              <span className="px-3 py-1 text-[10px] font-mono tracking-wider font-bold text-cyan-600 bg-cyan-50 rounded-full border border-cyan-100 uppercase">
                Active Patient
              </span>
              <span className="px-3 py-1 text-[10px] font-mono tracking-wider font-bold text-teal-600 bg-teal-50 rounded-full border border-teal-100 uppercase">
                ID: {profile.patientId}
              </span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Section 1: Personal Information */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 space-y-5 shadow-lg">
            <h3 className="font-display text-base font-bold text-white tracking-wide flex items-center gap-2 border-b border-white/5 pb-3">
              <User className="h-4 w-4 text-cyan-400" />
              Personal Information
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-cyan-400 shrink-0">
                  <User className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-mono text-[9px] tracking-wider text-gray-400 uppercase block">Full Name</span>
                  <span className="text-white font-medium">{profile.name}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-cyan-400 shrink-0">
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-mono text-[9px] tracking-wider text-gray-400 uppercase block">Date of Birth / Age</span>
                  <span className="text-white font-medium">{profile.dob}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-cyan-400 shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-mono text-[9px] tracking-wider text-gray-400 uppercase block">Contact Number</span>
                  <span className="text-white font-medium">{profile.phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Medical Information */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 space-y-5 shadow-lg">
            <h3 className="font-display text-base font-bold text-white tracking-wide flex items-center gap-2 border-b border-white/5 pb-3">
              <Heart className="h-4 w-4 text-cyan-400" />
              Medical Information
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-cyan-400 shrink-0">
                  <Droplet className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-mono text-[9px] tracking-wider text-gray-400 uppercase block">Blood Classification</span>
                  <span className="text-cyan-400 font-bold">{profile.bloodGroup}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-cyan-400 shrink-0">
                  <Scale className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-mono text-[9px] tracking-wider text-gray-400 uppercase block">Physiological Metrics (Height / Weight / BMI)</span>
                  <span className="text-white font-medium">{profile.heightWeight}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-cyan-400 shrink-0">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-mono text-[9px] tracking-wider text-gray-400 uppercase block">Clinical ID Reference</span>
                  <span className="text-white font-mono font-bold">{profile.patientId}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
