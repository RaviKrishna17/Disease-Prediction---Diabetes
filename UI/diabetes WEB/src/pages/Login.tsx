import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ShieldAlert, 
  Dna, 
  Stethoscope, 
  Heart, 
  Globe, 
  ChevronDown, 
  Eye, 
  EyeOff, 
  User, 
  Lock 
} from 'lucide-react';
import { useAuth } from '../lib/firebase';

export default function Login() {
  const { 
    currentUser, 
    loginWithGoogle, 
    registerWithEmailAndPassword, 
    loginWithEmailAndPassword, 
    loading: authLoading 
  } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [language, setLanguage] = useState('En');
  const [langOpen, setLangOpen] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (currentUser) {
      navigate('/prediction');
    }
  }, [currentUser, navigate]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsSigningIn(true);
    try {
      await loginWithGoogle();
      navigate('/prediction');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to complete Google authentication.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email) {
      setError("Please enter your email or phone number.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    if (isSignUpMode && !fullName) {
      setError("Please enter your full name.");
      return;
    }

    setIsSigningIn(true);
    try {
      if (isSignUpMode) {
        await registerWithEmailAndPassword(email, password, fullName);
      } else {
        await loginWithEmailAndPassword(email, password);
      }
      navigate('/prediction');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Authentication failed. Please verify your credentials and try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-screen bg-[#F4F8F7]">
        <div className="relative flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-2 border-[#26A69A]/20 border-t-[#26A69A] animate-spin" />
          <p className="font-mono text-xs text-[#4F6D69] tracking-wider uppercase">VERIFYING SECURE SESSION...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow w-full min-h-screen flex items-center justify-center bg-gradient-to-tr from-[#157E74] via-[#1D998D] to-[#2EAEA4] relative overflow-hidden font-sans p-4 sm:p-8" id="medical-login-viewport">
      
      {/* Huge subtle glowing white sphere at the bottom center matching the uploaded format */}
      <div className="absolute bottom-[-15%] left-1/2 -translate-x-1/2 w-[90%] md:w-[70%] h-[40%] bg-white/15 rounded-[100%] blur-[40px] pointer-events-none z-0" />

      {/* Floating glass-like bubbles containing medical icons with gentle floating animations */}
      {/* Left Bubble: DNA */}
      <div className="absolute left-[8%] top-[30%] hidden md:block z-10 animate-float" style={{ animationDelay: '0s' }}>
        <div className="relative flex items-center justify-center h-28 w-28 rounded-full bg-white/10 border border-white/20 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
          <Dna className="h-10 w-10 text-white/90" />
        </div>
      </div>

      {/* Top Bubble: Heart */}
      <div className="absolute left-[33%] top-[10%] hidden lg:block z-10 animate-float" style={{ animationDelay: '1.5s' }}>
        <div className="relative flex items-center justify-center h-20 w-20 rounded-full bg-white/10 border border-white/20 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
          <Heart className="h-7 w-7 text-white/90" fill="rgba(255,255,255,0.2)" />
        </div>
      </div>

      {/* Right Bubble: Stethoscope */}
      <div className="absolute right-[8%] top-[45%] hidden md:block z-10 animate-float" style={{ animationDelay: '3s' }}>
        <div className="relative flex items-center justify-center h-32 w-32 rounded-full bg-white/10 border border-white/20 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
          <Stethoscope className="h-12 w-12 text-white/90" />
        </div>
      </div>

      {/* Elegant ECG Heartbeat wave spanning across the bottom half of the screen */}
      <div className="absolute bottom-[10%] inset-x-0 w-full pointer-events-none opacity-40 z-0">
        <svg className="w-full h-32" viewBox="0 0 1440 120" fill="none" preserveAspectRatio="none">
          <path
            d="M0,60 H400 L415,45 L425,75 L435,20 L445,100 L455,60 H650 L665,45 L675,75 L685,15 L695,105 L705,60 H1000 L1015,45 L1025,75 L1035,25 L1045,95 L1055,60 H1440"
            stroke="rgba(255, 255, 255, 0.7)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Language Selector at the Top Right corner (hidden as not required) */}
      {false && (
        <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-30">
          <div className="relative">
            <button 
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 text-white hover:bg-black/30 border border-white/10 text-xs font-medium cursor-pointer transition-colors"
            >
              <span className="text-[14px]">🇺🇸</span>
              <span>{language}</span>
              <ChevronDown className="h-3 w-3 opacity-80" />
            </button>
            
            {langOpen && (
              <div className="absolute right-0 mt-2 py-1 w-24 bg-white rounded-xl shadow-lg border border-slate-100 text-xs text-slate-800">
                <button 
                  onClick={() => { setLanguage('En'); setLangOpen(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2"
                >
                  <span>🇺🇸</span> English
                </button>
                <button 
                  onClick={() => { setLanguage('Id'); setLangOpen(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2"
                >
                  <span>🇮🇩</span> Indo
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Frosted Central Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[460px] bg-white rounded-[24px] p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-white/20 relative z-20 flex flex-col items-center"
      >
        {/* Custom Medical plus logo with notch */}
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full mb-6">
          <svg className="h-14 w-14 text-[#26A69A]" viewBox="0 0 54 54" fill="none">
            {/* Soft background circle accent */}
            <circle cx="27" cy="27" r="27" fill="#E4EFEF" />
            {/* The elegant plus sign */}
            <path
              d="M27 12V42M12 27H42"
              stroke="#26A69A"
              strokeWidth="7"
              strokeLinecap="round"
            />
            {/* Top right circular accent dot/notch */}
            <circle cx="37" cy="17" r="3.5" fill="#126E60" stroke="white" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Welcome Text */}
        <div className="text-center space-y-2 mb-8">
          <h2 className="font-display text-2xl font-bold text-slate-800 tracking-tight">
            {isSignUpMode ? "Create an Account" : "Welcome Back!"}
          </h2>
        </div>

        {/* Form elements with bottom underline styles */}
        <form onSubmit={handleFormSubmit} className="w-full space-y-6">
          
          {/* Full Name input block (only in Sign Up mode) */}
          {isSignUpMode && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-1.5"
            >
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">
                Full Name
              </label>
              <div className="portal-input-container">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="portal-input"
                  placeholder="Enter your full name"
                />
                <User className="h-4.5 w-4.5 portal-input-icon" />
              </div>
            </motion.div>
          )}

          {/* Email input block */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-[#1D998D] uppercase tracking-wider pl-0.5">
              Email or No. Handphone
            </label>
            <div className="portal-input-container">
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="portal-input"
                placeholder="Enter your email or handphone"
              />
              <User className="h-4.5 w-4.5 portal-input-icon" />
            </div>
          </div>

          {/* Password input block */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">
              Password
            </label>
            <div className="portal-input-container">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="portal-input"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="portal-input-icon hover:text-[#26A69A] transition-colors focus:outline-none cursor-pointer"
                style={{ pointerEvents: 'auto' }}
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
            

          </div>

          {/* Verification / error failures info */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2.5"
            >
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <p className="leading-relaxed text-left font-medium">{error}</p>
            </motion.div>
          )}

          {/* Sign In/Up primary button */}
          <button
            type="submit"
            disabled={isSigningIn}
            className="w-full h-11 bg-[#26A69A] hover:bg-[#1D998D] disabled:bg-[#26A69A]/70 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-[0_4px_12px_rgba(38,166,154,0.2)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2"
          >
            {isSigningIn ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                <span>{isSignUpMode ? "SIGNING UP..." : "SIGNING IN..."}</span>
              </>
            ) : (
              <span>{isSignUpMode ? "SIGN UP" : "SIGN IN"}</span>
            )}
          </button>
        </form>

        {/* OR Divider Line */}
        <div className="w-full flex items-center justify-center gap-3 my-5">
          <div className="h-[1px] bg-slate-200 flex-grow" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">or</span>
          <div className="h-[1px] bg-slate-200 flex-grow" />
        </div>

        {/* Continue with Google SSO Trigger Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isSigningIn}
          className="w-full h-11 px-4 rounded-xl bg-white hover:bg-slate-50 disabled:bg-slate-100 text-slate-700 font-semibold text-xs tracking-wider transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer shadow-sm border border-slate-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 outline-none select-none"
        >
          {isSigningIn ? (
            <>
              <div className="h-4 w-4 rounded-full border-2 border-slate-700/10 border-t-slate-700 animate-spin" />
              <span className="text-slate-500">SIGNING IN...</span>
            </>
          ) : (
            <>
              {/* Official Google Vector logo */}
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3.01A11.917 11.917 0 0012 0C7.27 0 3.193 2.59 1.011 6.417l4.255 3.348z"
                />
                <path
                  fill="#34A853"
                  d="M16.04 15.345c-1.013.714-2.4 1.155-4.04 1.155-2.927 0-5.414-1.982-6.3-4.645L1.383 15.17A11.967 11.967 0 0012 24c3.245 0 6.19-1.073 8.354-2.918l-4.314-5.737z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.275c0-.825-.075-1.62-.21-2.39H12v4.51h6.46A5.523 5.523 0 0116.04 15.34l4.314 5.74c2.522-2.327 3.968-5.753 3.968-9.805z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.7 11.855a7.07 7.07 0 010-2.09L1.445 6.417a11.948 11.948 0 000 10.87L5.7 11.855z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Don't have an account registration footnote */}
        <div className="text-center pt-5 text-[11px] text-slate-500 font-medium">
          {isSignUpMode ? (
            <>
              Already have an account ? <span onClick={() => { setIsSignUpMode(false); setError(null); }} className="text-[#26A69A] font-bold hover:underline cursor-pointer">Sign In</span>
            </>
          ) : (
            <>
              Dont have an account ? <span onClick={() => { setIsSignUpMode(true); setError(null); }} className="text-[#26A69A] font-bold hover:underline cursor-pointer">Sign Up</span>
            </>
          )}
        </div>

      </motion.div>
    </div>
  );
}
