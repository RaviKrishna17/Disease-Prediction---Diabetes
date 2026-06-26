/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';

// Core layout components
import Navbar from './components/Navbar';
import ParticleBackground from './components/ParticleBackground';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import RiskFactors from './pages/RiskFactors';
import Symptoms from './pages/Symptoms';
import Prevention from './pages/Prevention';
import Prediction from './pages/Prediction';
import Profile from './pages/Profile';
import History from './pages/History';
import Login from './pages/Login';

// Firebase Auth context hook
import { useAuth } from './lib/firebase';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[60vh]">
        <div className="h-10 w-10 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AnimatedAppRoutes() {
  const location = useLocation();

  // Scroll to top on every path transition
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full flex-grow flex flex-col justify-start relative z-10"
      >
        <Routes location={location}>
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/about" element={
            <ProtectedRoute>
              <About />
            </ProtectedRoute>
          } />
          <Route path="/risk-factors" element={
            <ProtectedRoute>
              <RiskFactors />
            </ProtectedRoute>
          } />
          <Route path="/symptoms" element={
            <ProtectedRoute>
              <Symptoms />
            </ProtectedRoute>
          } />
          <Route path="/prevention" element={
            <ProtectedRoute>
              <Prevention />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route path="/prediction" element={
            <ProtectedRoute>
              <Prediction />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          } />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  const [diagnosticMode, setDiagnosticMode] = useState<boolean>(false);

  return (
    <Router>
      <div 
        className={`min-h-screen flex flex-col justify-between bg-medical-bg text-gray-100 transition-all duration-500 relative overflow-x-hidden ${
          diagnosticMode ? 'diagnostic-active bg-cyan-950/20' : ''
        }`}
        id="glucosense-root-container"
      >
        {/* Floating Glowing Particle Field */}
        <ParticleBackground />

        {/* Dynamic Scanline Overlay for Diagnostic Mode */}
        {diagnosticMode && (
          <div className="fixed inset-0 pointer-events-none z-40 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] opacity-10" />
        )}

        {/* Sticky Header */}
        <Navbar diagnosticMode={diagnosticMode} setDiagnosticMode={setDiagnosticMode} />

        {/* Dynamic Animated Content Stage */}
        <AnimatedAppRoutes />
      </div>
    </Router>
  );
}
