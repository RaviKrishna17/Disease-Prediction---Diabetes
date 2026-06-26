/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { HeartPulse, BookOpen, AlertCircle, Sparkles, Activity, ShieldCheck } from 'lucide-react';

export default function About() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as any } },
  };

  return (
    <div className="relative min-h-screen py-16 md:py-24 overflow-hidden" id="about-page-container">
      {/* Background elements */}
      <div className="absolute inset-0 bg-grid-overlay opacity-5 z-0" />
      <div className="absolute top-1/3 left-0 w-[400px] h-[400px] rounded-full bg-red-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[300px] h-[300px] rounded-full bg-slate-400/5 blur-[100px] pointer-events-none" />
      
      <div className="mx-auto max-w-7xl px-6 relative z-10">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-16 md:mb-20"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-mono text-red-600 mb-4 font-semibold">
            <BookOpen className="h-4 w-4 text-red-500" />
            <span>DIABETES INFORMATION & HELP</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-red-500">
            Diabetes
          </h1>
          <p className="mt-4 text-slate-500 text-base md:text-lg font-medium">
            A simple guide to understanding what diabetes is, what causes it, and how you can manage your daily health and blood sugar levels.
          </p>
        </motion.div>

        {/* Content Layout: Left SVG Diagram, Right Medical Guide */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start"
        >
          {/* Left Column: Premium Molecular SVG Illustration in Red & Gray */}
          <motion.div 
            variants={itemVariants}
            className="lg:col-span-5 w-full relative lg:sticky lg:top-28"
          >
            <div className="absolute inset-0 bg-red-500/5 blur-[50px] rounded-full pointer-events-none" />
            
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_12px_30px_rgba(239,68,68,0.06)]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <span className="font-mono text-xs text-red-500 font-semibold tracking-wider flex items-center gap-2">
                  <HeartPulse className="h-4 w-4 animate-pulse text-red-500" />
                  GLUCOSE MONITORING
                </span>
                <span className="font-mono text-[9px] bg-red-50 border border-red-200 rounded px-2 py-0.5 text-red-600 font-bold">
                  DIAGRAM 1.1
                </span>
              </div>

              {/* Vector SVG showing a highly recognizable glucometer device and blood droplet */}
              <svg viewBox="0 0 350 380" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
                {/* Decorative background grid/pulse line */}
                <path d="M 20 280 L 120 280 L 140 240 L 160 310 L 180 270 L 200 280 L 330 280" stroke="rgba(239, 68, 68, 0.15)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                
                {/* The Glucometer Device Group */}
                <g transform="translate(65, 10)">
                  {/* Soft Glow */}
                  <rect x="10" y="10" width="200" height="300" rx="40" fill="rgba(239, 68, 68, 0.02)" stroke="rgba(239, 68, 68, 0.05)" strokeWidth="6" />
                  
                  {/* Device Body */}
                  <rect x="15" y="15" width="190" height="290" rx="35" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="4" />
                  
                  {/* Decorative Red Accent Strip */}
                  <path d="M 15 120 L 205 120" stroke="#fca5a5" strokeWidth="2" />
                  <rect x="85" y="25" width="50" height="6" rx="3" fill="#ef4444" opacity="0.8" />

                  {/* Device Screen Frame */}
                  <rect x="30" y="45" width="160" height="130" rx="16" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                  
                  {/* Screen Content */}
                  <text x="110" y="115" fill="#f1f5f9" className="font-sans text-[48px] font-black tracking-tighter text-center" textAnchor="middle">104</text>
                  <text x="110" y="145" fill="#94a3b8" className="font-mono text-[11px] tracking-widest text-center uppercase font-bold" textAnchor="middle">mg / dL</text>
                  
                  <text x="45" y="70" fill="#ef4444" className="font-mono text-[9px] font-bold">GLUCOSE</text>
                  <rect x="145" y="60" width="25" height="12" rx="4" fill="rgba(239, 68, 68, 0.2)" stroke="#f87171" strokeWidth="1" />
                  <text x="157.5" y="69" fill="#f87171" className="font-mono text-[8px] font-bold text-center" textAnchor="middle">OK</text>

                  {/* Heart symbol on screen */}
                  <path d="M 45 138 C 42 135, 38 135, 36 138 C 34 140, 34 144, 36 146 L 45 154 L 54 146 C 56 144, 56 140, 54 138 C 52 135, 48 135, 45 138 Z" fill="#ef4444" />
                  <text x="62" y="147" fill="#64748b" className="font-mono text-[9px] font-bold">NORMAL</text>

                  {/* Device Buttons */}
                  <circle cx="110" cy="235" r="24" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="3" />
                  <circle cx="110" cy="235" r="16" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
                  <path d="M 104 235 L 116 235 M 110 229 L 110 241" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
                  
                  {/* Bottom Strip Slot */}
                  <rect x="90" y="295" width="40" height="14" rx="4" fill="#334155" />
                  <rect x="100" y="295" width="20" height="6" rx="1" fill="#ef4444" />
                </g>

                {/* Test Strip inserting from bottom */}
                <g transform="translate(155, 315)">
                  {/* The Strip */}
                  <rect x="5" y="0" width="30" height="40" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
                  <line x1="12" y1="10" x2="12" y2="30" stroke="#475569" strokeWidth="2" />
                  <line x1="28" y1="10" x2="28" y2="30" stroke="#475569" strokeWidth="2" />
                  <rect x="10" y="32" width="20" height="6" rx="1" fill="#ef4444" />
                </g>

                {/* Red Blood Droplet */}
                <g transform="translate(150, 332)">
                  <path d="M 20 5 C 20 5, 5 22, 5 32 C 5 40, 12 47, 20 47 C 28 47, 35 40, 35 32 C 35 22, 20 5, 20 5 Z" fill="#ef4444" stroke="#dc2626" strokeWidth="2.5" />
                  {/* Highlight reflect */}
                  <path d="M 14 26 C 11 29, 11 34, 14 37" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                </g>
              </svg>

              <div className="mt-4 border-t border-slate-100 pt-4 text-center">
                <span className="font-mono text-[10px] text-slate-500 font-medium">
                  Checking your blood sugar regularly helps you see how food, exercise, and habits affect your body.
                </span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Medical Narratives and Explanations */}
          <motion.div 
            variants={itemVariants}
            className="lg:col-span-7 space-y-12"
          >
            {/* Section 1: What is Diabetes */}
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-slate-900 tracking-wide flex items-center gap-2">
                <span className="text-red-500">01.</span> What is Diabetes?
              </h2>
              <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                Diabetes is a long-term health condition that affects how your body turns food into energy. When you eat, your body breaks down food into sugar (called glucose) and releases it into your bloodstream. Normally, a hormone made by your pancreas (called insulin) acts like a key to let that sugar into your cells to use for energy. 
              </p>
              <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                With diabetes, your body either doesn't make enough insulin or can't use it as well as it should. When there isn't enough insulin or cells stop responding to it, too much sugar stays in your bloodstream. Over time, having high blood sugar (also called hyperglycemia) can cause serious health problems.
              </p>
            </div>

            {/* Section 2: Core Causes & Risk Factors */}
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-slate-900 tracking-wide flex items-center gap-2">
                <span className="text-red-500">02.</span> What Causes Diabetes?
              </h2>
              <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                Learning what triggers diabetes is the first step in protecting yourself. The most common causes include:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="h-8 w-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center mb-3">
                    <Activity className="h-4.5 w-4.5" />
                  </div>
                  <h4 className="font-display font-bold text-slate-800 text-sm mb-1.5">Insulin Resistance</h4>
                  <p className="text-xs leading-relaxed text-slate-500">Your cells start ignoring the insulin "key." This blocks sugar from entering your cells and forces your pancreas to work overtime to make more insulin.</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="h-8 w-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center mb-3">
                    <AlertCircle className="h-4.5 w-4.5" />
                  </div>
                  <h4 className="font-display font-bold text-slate-800 text-sm mb-1.5">Family History & Genetics</h4>
                  <p className="text-xs leading-relaxed text-slate-500">If your parents or siblings have diabetes, you have a higher chance of getting it too because of inherited traits.</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="h-8 w-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center mb-3">
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                  <h4 className="font-display font-bold text-slate-800 text-sm mb-1.5">Daily Habits & Weight</h4>
                  <p className="text-xs leading-relaxed text-slate-500">Not getting enough physical activity, eating many sugary foods, and carrying extra body weight make it much harder for your body to manage sugar.</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="h-8 w-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center mb-3">
                    <ShieldCheck className="h-4.5 w-4.5" />
                  </div>
                  <h4 className="font-display font-bold text-slate-800 text-sm mb-1.5">Immune System Attacks</h4>
                  <p className="text-xs leading-relaxed text-slate-500">In Type 1 diabetes, the body's defense system mistakenly attacks and destroys the cells in the pancreas that produce insulin.</p>
                </div>
              </div>
            </div>

            {/* Section 3: Professional Care Instructions */}
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-slate-900 tracking-wide flex items-center gap-2">
                <span className="text-red-500">03.</span> How to Manage Diabetes
              </h2>
              <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                Managing diabetes is all about building healthy daily routines. Incorporate these simple habits into your day to keep your blood sugar in a safe, healthy range:
              </p>

              <div className="space-y-4 border-l-2 border-red-500 pl-4 py-1">
                <div>
                  <h5 className="font-display font-bold text-slate-800 text-sm">Eat a Balanced Diet</h5>
                  <p className="text-xs text-slate-500 mt-1">
                    Choose foods that release sugar slowly into your body, like vegetables, whole grains, and lean proteins. Try to limit sugary snacks, soda, and processed foods that cause sudden blood sugar spikes.
                  </p>
                </div>

                <div>
                  <h5 className="font-display font-bold text-slate-800 text-sm">Stay Active Regularly</h5>
                  <p className="text-xs text-slate-500 mt-1">
                    Try to get at least 30 minutes of physical activity (like walking, swimming, or biking) most days of the week. Exercise helps your body naturally burn blood sugar and makes your cells more responsive to insulin.
                  </p>
                </div>

                <div>
                  <h5 className="font-display font-bold text-slate-800 text-sm">Track Your Blood Sugar</h5>
                  <p className="text-xs text-slate-500 mt-1">
                    Check your blood sugar levels as recommended by your doctor. Getting a standard HbA1c blood test every 3 months gives you a clear average of your blood sugar levels to prevent future health complications.
                  </p>
                </div>
              </div>
            </div>

          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
