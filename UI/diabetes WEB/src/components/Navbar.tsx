/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Stethoscope, Shield, ChevronDown, Menu, X, Moon, User, History, LogOut } from 'lucide-react';
import { useAuth } from '../lib/firebase';

interface NavbarProps {
  diagnosticMode: boolean;
  setDiagnosticMode: (mode: boolean) => void;
}

export default function Navbar({ diagnosticMode, setDiagnosticMode }: NavbarProps) {
  const { currentUser, logout, loading: authLoading } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Prediction', path: '/prediction' },
    { name: 'About', path: '/about' },
  ];

  // Close menus on path change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileOpen(false);

    // Keep active item matching path
    if (location.pathname === '/profile') setActiveItem('profile');
    else if (location.pathname === '/history') setActiveItem('history');
    else setActiveItem(null);
  }, [location]);

  const handleSignOut = async () => {
    setProfileOpen(false);
    setActiveItem(null);
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error("Sign out failed", err);
    }
  };

    const isLoginPage = location.pathname === '/login';

    return (
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md transition-all duration-300">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <Link 
            to="/" 
            id="nav-logo-link"
            className="flex items-center gap-3 group"
          >
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-400 shadow-[0_4px_15px_rgba(239,68,68,0.2)] group-hover:scale-105 transition-all duration-300">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-[10px] font-bold tracking-widest text-red-500">
                DIABETES
              </span>
              <span className="font-display text-base font-extrabold tracking-wider text-slate-900">
                PREDICTION
              </span>
            </div>
          </Link>
  
          {/* Desktop Navigation */}
          {!isLoginPage && (
            <nav className="hidden lg:flex items-center gap-2" id="desktop-navbar">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    id={`nav-link-${item.path.replace('/', 'home')}`}
                    className={`relative px-5 py-2.5 font-display text-sm font-semibold tracking-wide transition-all duration-300 ${
                      isActive 
                        ? 'text-red-500 font-bold' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          )}
  
          {/* Right Actions */}
          {!isLoginPage && (
            <div className="hidden lg:flex items-center gap-4">
              {/* User Profile Avatar / Sign In */}
              {!authLoading && (
                currentUser ? (
                  <div className="relative">
                    <button
                      onClick={() => setProfileOpen(!profileOpen)}
                      id="nav-profile-btn"
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-300 cursor-pointer"
                    >
                      <div className="h-9 w-9 overflow-hidden rounded-full border border-slate-200">
                        <img 
                          src={currentUser.photoURL || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150"} 
                          alt={currentUser.displayName || "Patient Avatar"} 
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-300 ${profileOpen ? 'rotate-180' : ''}`} />
                    </button>
  
                    {/* Redesigned Premium Profile Dropdown */}
                    <AnimatePresence>
                      {profileOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="absolute right-0 mt-3 w-[300px] rounded-2xl bg-white border border-slate-200 shadow-[0_10px_35px_rgba(0,0,0,0.1)] z-50 overflow-hidden"
                          id="nav-profile-dropdown"
                        >
                          {/* Top Profile Section */}
                          <div className="flex flex-col items-center p-5 border-b border-slate-100 text-center">
                            <div className="relative mb-3">
                              <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-sm" />
                              <img 
                                src={currentUser.photoURL || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150"} 
                                alt={currentUser.displayName || "Patient"} 
                                className="relative h-16 w-16 rounded-full object-cover border-2 border-slate-200"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <h4 className="font-display text-base font-bold text-slate-900 tracking-wide">{currentUser.displayName || "Patient"}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">{currentUser.email}</p>
                          </div>
  
                          {/* Menu Items */}
                          <div className="p-2 space-y-1">
                            {/* My Patient Profile Row */}
                            <button
                              onClick={() => {
                                setActiveItem('profile');
                                setProfileOpen(false);
                                navigate('/profile');
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-left cursor-pointer ${
                                activeItem === 'profile'
                                  ? 'bg-cyan-50 text-cyan-600 border border-cyan-100 shadow-[0_4px_12px_rgba(6,182,212,0.08)] font-bold'
                                  : 'text-slate-700 hover:bg-slate-50 hover:text-cyan-600 border border-transparent'
                              }`}
                            >
                              <User className="h-4.5 w-4.5 shrink-0" />
                              <span className="font-display text-sm font-medium">My Patient Profile</span>
                            </button>
  
                            {/* My Assessment History Row */}
                            <button
                              onClick={() => {
                                setActiveItem('history');
                                setProfileOpen(false);
                                navigate('/history');
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-left cursor-pointer ${
                                activeItem === 'history'
                                  ? 'bg-cyan-50 text-cyan-600 border border-cyan-100 shadow-[0_4px_12px_rgba(6,182,212,0.08)] font-bold'
                                  : 'text-slate-700 hover:bg-slate-50 hover:text-cyan-600 border border-transparent'
                              }`}
                            >
                              <History className="h-4.5 w-4.5 shrink-0" />
                              <span className="font-display text-sm font-medium">My Assessment History</span>
                            </button>
                          </div>
  
                          {/* Separator before Sign Out */}
                          <div className="h-px bg-slate-100 my-1" />
  
                          {/* Sign Out Section */}
                          <div className="p-2">
                            <button
                              onClick={handleSignOut}
                              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-all duration-300 text-left cursor-pointer"
                            >
                              <LogOut className="h-4.5 w-4.5 shrink-0" />
                              <span className="font-display text-sm font-medium">Sign Out</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <button
                    onClick={() => navigate('/login')}
                    className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-display text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-[0_4px_15px_rgba(239,68,68,0.2)] cursor-pointer"
                  >
                    Sign In
                  </button>
                )
              )}
            </div>
          )}
  
          {/* Mobile Hamburger Toggle */}
          {!isLoginPage && (
            <div className="flex lg:hidden items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                id="nav-mobile-hamburger"
                className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 cursor-pointer"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          )}
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-slate-200 bg-white/95 backdrop-blur-lg overflow-hidden"
            id="mobile-nav-drawer"
          >
            <div className="p-6 space-y-4">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`block px-4 py-3 rounded-xl font-display text-base font-medium transition-all duration-200 ${
                      isActive ? 'bg-red-50 text-red-500 border border-red-100' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}

              {/* Redesigned Premium Mobile Profile Menu inside Drawer */}
              {!authLoading && (
                currentUser ? (
                  <div className="border-t border-slate-100 pt-6 mt-4 space-y-4">
                    <div className="flex items-center gap-4 px-4">
                      <div className="relative shrink-0">
                        <img 
                          src={currentUser.photoURL || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150"} 
                          alt={currentUser.displayName || "Patient"} 
                          className="h-12 w-12 rounded-full object-cover border border-cyan-100"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <p className="font-display text-sm font-semibold text-slate-900">{currentUser.displayName || "Patient"}</p>
                        <p className="text-[11px] text-slate-500">{currentUser.email}</p>
                        <p className="inline-block mt-1.5 px-2 py-0.5 text-[8px] font-mono tracking-wider font-bold text-cyan-600 bg-cyan-50 rounded-full border border-cyan-100 uppercase">
                          Patient Profile
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setActiveItem('profile');
                          navigate('/profile');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 active:bg-cyan-50 active:text-cyan-600 transition-all duration-200 text-left cursor-pointer"
                      >
                        <User className="h-4.5 w-4.5 text-cyan-600" />
                        <span className="font-display text-sm font-medium">My Patient Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setActiveItem('history');
                          navigate('/history');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 active:bg-cyan-50 active:text-cyan-600 transition-all duration-200 text-left cursor-pointer"
                      >
                        <History className="h-4.5 w-4.5 text-cyan-600" />
                        <span className="font-display text-sm font-medium">My Assessment History</span>
                      </button>

                      <div className="h-px bg-slate-100 my-2" />

                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-600 hover:bg-rose-50 transition-all duration-200 text-left cursor-pointer"
                      >
                        <LogOut className="h-4.5 w-4.5 text-rose-500" />
                        <span className="font-display text-sm font-medium">Sign Out</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate('/login');
                      }}
                      className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-display text-sm font-bold uppercase tracking-wider text-center cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
