import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Phone, 
  Calendar, 
  ArrowLeft,
  Activity,
  Shield,
  Key,
  Edit2,
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth, useProfile } from '../lib/firebase';

export default function Profile() {
  const { currentUser, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, updateProfile, changePassword } = useProfile();
  const navigate = useNavigate();

  // Modal / Form States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);

  // Edit Profile Inputs
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Change Password Inputs
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passLoading, setPassLoading] = useState(false);

  if (authLoading || profileLoading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[70vh]">
        <div className="relative flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
          <p className="font-mono text-xs text-gray-400 tracking-wider">LOADING SECURE PATIENT PROFILE...</p>
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

  const openEditModal = () => {
    setEditName(profile.name || '');
    setEditUsername(profile.username || '');
    setEditPhone(profile.phone || '');
    setEditError(null);
    setEditSuccess(null);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    setEditSuccess(null);

    if (!editName.trim()) {
      setEditError("Name is required.");
      return;
    }

    setEditLoading(true);
    try {
      await updateProfile({
        name: editName,
        username: editUsername,
        phone: editPhone
      });
      setEditSuccess("Profile details updated successfully.");
      setTimeout(() => setIsEditOpen(false), 1500);
    } catch (err: any) {
      setEditError(err.message || "Failed to update profile details.");
    } finally {
      setEditLoading(false);
    }
  };

  const openPasswordModal = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPassError(null);
    setPassSuccess(null);
    setIsPasswordOpen(true);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (!newPassword) {
      setPassError("New password is required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError("Confirm password does not match new password.");
      return;
    }

    setPassLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      setPassSuccess("Password updated successfully.");
      setTimeout(() => setIsPasswordOpen(false), 1500);
    } catch (err: any) {
      setPassError(err.message || "Failed to update password.");
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="flex-grow w-full max-w-4xl mx-auto px-4 py-8 md:py-12 relative text-slate-100">
      {/* Back button */}
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-xs font-mono text-cyan-600 hover:text-cyan-500 tracking-widest uppercase transition-colors duration-200 group cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
          Back to Home
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
            View and manage your patient profile credentials, account parameters, and medical predictive index.
          </p>
        </div>

        {/* Profile Card Header */}
        <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-200 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_8px_30px_rgba(18,110,96,0.04)] bg-white/90">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-cyan-500/5 blur-[50px] pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-center gap-6">
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

          {/* Edit / Password Actions */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={openEditModal}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider shadow-sm transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
            >
              <Edit2 className="h-4 w-4 text-cyan-600" />
              Edit Profile
            </button>
            {profile.provider === 'credentials' && (
              <button
                onClick={openPasswordModal}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase tracking-wider shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
              >
                <Key className="h-4 w-4" />
                Change Password
              </button>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Section 1: Account Parameters */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 space-y-5 shadow-lg bg-slate-900/60 backdrop-blur-md">
            <h3 className="font-display text-base font-bold text-white tracking-wide flex items-center gap-2 border-b border-white/5 pb-3">
              <User className="h-4 w-4 text-cyan-400" />
              Account Credentials
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-cyan-400 shrink-0">
                  <User className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-mono text-[9px] tracking-wider text-gray-400 uppercase block">Username</span>
                  <span className="text-white font-medium">{profile.username}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-cyan-400 shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-mono text-[9px] tracking-wider text-gray-400 uppercase block">Email Address</span>
                  <span className="text-white font-medium">{profile.email}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-cyan-400 shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-mono text-[9px] tracking-wider text-gray-400 uppercase block">Phone Number</span>
                  <span className="text-white font-medium">{profile.phone || "Not Configured"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Session & Metadata */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 space-y-5 shadow-lg bg-slate-900/60 backdrop-blur-md">
            <h3 className="font-display text-base font-bold text-white tracking-wide flex items-center gap-2 border-b border-white/5 pb-3">
              <Shield className="h-4 w-4 text-cyan-400" />
              Security Parameters
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-cyan-400 shrink-0">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-mono text-[9px] tracking-wider text-gray-400 uppercase block">Login Provider / Method</span>
                  <span className="text-cyan-400 font-bold capitalize">{profile.provider}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-cyan-400 shrink-0">
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-mono text-[9px] tracking-wider text-gray-400 uppercase block">Account Created Date</span>
                  <span className="text-white font-medium">{profile.createdAt}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-cyan-400 shrink-0">
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-mono text-[9px] tracking-wider text-gray-400 uppercase block">Last Login Time</span>
                  <span className="text-white font-medium">{profile.lastLogin}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-cyan-400 shrink-0">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-mono text-[9px] tracking-wider text-gray-400 uppercase block">Total Predictive Screenings</span>
                  <span className="text-emerald-400 font-black">{profile.predictionCount} Assessments</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Edit Profile Modal Dialog */}
      <AnimatePresence>
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200 shadow-2xl relative text-slate-800"
            >
              <h3 className="font-display text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-cyan-600" />
                Edit Profile Details
              </h3>
              <p className="text-xs text-slate-500 mb-6 font-medium">Update your account name, clinical username, and active contact number.</p>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                    placeholder="Full Name"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Username</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                    placeholder="Username"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Phone Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                    placeholder="Phone Number"
                  />
                </div>

                {editError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                    <span>{editError}</span>
                  </div>
                )}

                {editSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{editSuccess}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="flex-1 h-11 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 h-11 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-600/50 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {editLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Change Password Modal Dialog */}
      <AnimatePresence>
        {isPasswordOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200 shadow-2xl relative text-slate-800"
            >
              <h3 className="font-display text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Key className="h-5 w-5 text-cyan-600" />
                Change Account Password
              </h3>
              <p className="text-xs text-slate-500 mb-6 font-medium">Verify your current credentials and register a new secure access key.</p>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Current Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="Current Password"
                    />
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">New Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="New Password"
                    />
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="Confirm New Password"
                    />
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                {passError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                    <span>{passError}</span>
                  </div>
                )}

                {passSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{passSuccess}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPasswordOpen(false)}
                    className="flex-1 h-11 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={passLoading}
                    className="flex-1 h-11 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-600/50 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {passLoading ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
