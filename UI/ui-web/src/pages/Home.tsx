/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Activity, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative h-[calc(100vh-80px)] flex flex-col justify-center overflow-hidden" id="home-page-container">
      {/* Background Decorative Grid and Glows */}
      <div className="absolute inset-0 bg-grid-overlay opacity-5 z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none z-0 animate-pulse" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] rounded-full bg-blue-600/5 blur-[80px] pointer-events-none z-0" />

      {/* Hero Content Section - Perfectly Centered Column */}
      <div className="relative mx-auto max-w-5xl px-6 py-6 flex-grow flex flex-col items-center justify-center z-10 w-full">
        {/* Centered Hero Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center space-y-8 max-w-3xl"
        >
          {/* Large Display Titles */}
          <div className="space-y-4">
            <h1 className="font-display text-5xl sm:text-7xl font-extrabold tracking-tight text-slate-900 leading-none text-center">
              DIABETES PREDICTION
            </h1>
            <p className="font-display text-lg sm:text-2xl font-semibold tracking-wide text-cyan-600 text-center max-w-xl mx-auto">
              AI Powered Diabetes Risk Assessment System
            </p>
          </div>

          {/* Description */}
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-lg mx-auto text-center">
            Predict your diabetes risk using patient medical records and machine learning.
          </p>

          {/* Single Action Gradient Button with Outer Glow */}
          <div className="pt-4 flex flex-col items-center justify-center gap-4 w-full">
            <Link 
              to="/prediction" 
              id="home-cta-btn"
              className="group relative flex items-center justify-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 px-10 py-5 shadow-[0_8px_30px_rgba(6,182,212,0.3)] hover:shadow-[0_12px_40px_rgba(6,182,212,0.45)] hover:scale-[1.03] transition-all duration-300 w-full sm:w-auto"
            >
              <Activity className="h-5 w-5 text-white animate-pulse" />
              <span className="font-display text-base font-bold tracking-wider text-white">
                START PREDICTION
              </span>
              <ArrowRight className="h-5 w-5 text-white group-hover:translate-x-1 transition-transform duration-300" />
            </Link>

            {/* Footnote details */}
            <div className="font-mono text-[10px] sm:text-[11px] tracking-widest text-cyan-600 uppercase text-center mt-6 font-semibold">
              TAKES &lt; 2 MINUTES &bull; PRIVACY PROTECTED &bull; NO BLOOD DRAW REQUIRED
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
