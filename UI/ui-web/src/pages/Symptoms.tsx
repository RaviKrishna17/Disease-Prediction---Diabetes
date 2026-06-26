/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Droplet, Droplets, Eye, BatteryLow, ShieldAlert, HeartPulse } from 'lucide-react';

interface Symptom {
  id: string;
  title: string;
  medicalTerm: string;
  description: string;
  mechanism: string;
  icon: React.ComponentType<{ className?: string }>;
  svgIllustration: React.ReactNode;
}

export default function Symptoms() {
  const symptoms: Symptom[] = [
    {
      id: '01',
      title: 'Frequent Urination',
      medicalTerm: 'Polyuria',
      description: 'The patient experiences a frequent, high volume of urination, particularly during nocturnal cycles.',
      mechanism: 'Excess blood glucose exceeds the kidney renal threshold, leaking glucose into urine. This creates a high osmotic gradient that pulls massive water along, creating constant renal fluid excretion.',
      icon: Droplets,
      svgIllustration: (
        <svg viewBox="0 0 160 120" className="w-24 h-24 text-cyan-400" fill="none">
          {/* Kidney outline representation */}
          <path d="M40,30 Q60,10 90,30 Q120,50 110,80 Q100,110 60,100 Q30,90 40,30" stroke="currentColor" strokeWidth="2" strokeDasharray="3,3" />
          {/* Glomerulus filter diagram */}
          <circle cx="75" cy="55" r="14" stroke="#0ea5e9" strokeWidth="2.5" />
          <path d="M 68,55 L 82,55" stroke="#10b981" strokeWidth="2" />
          <path d="M 75,48 L 75,62" stroke="#10b981" strokeWidth="2" />
          {/* Water flow out */}
          <path d="M 75,70 L 75,100" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" className="animate-pulse" />
          <text x="65" y="112" fill="rgba(6,182,212,0.8)" className="font-mono text-[8px] font-bold">RENAL WATER EFFLUX</text>
        </svg>
      )
    },
    {
      id: '02',
      title: 'Excessive Thirst',
      medicalTerm: 'Polydipsia',
      description: 'An intense, unquenchable sensation of dryness and dehydration despite massive fluid intake.',
      mechanism: 'As Polyuria drains body fluids, extracellular fluid volume falls. The resulting high blood osmolality triggers sensory receptors in the hypothalamic thirst center, demanding constant rehydration.',
      icon: Droplet,
      svgIllustration: (
        <svg viewBox="0 0 160 120" className="w-24 h-24 text-cyan-400" fill="none">
          {/* Cellular water exit diagram */}
          <rect x="30" y="30" width="100" height="60" rx="16" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
          <circle cx="80" cy="60" r="18" stroke="#ef4444" strokeWidth="2" />
          {/* Water leaving cells arrow */}
          <path d="M 80,60 L 125,60" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 115,55 L 125,60 L 115,65" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" />
          <text x="45" y="24" fill="rgba(239,68,68,0.8)" className="font-mono text-[8px] font-bold">CELL SHRISKAGE / DRYNESS</text>
        </svg>
      )
    },
    {
      id: '03',
      title: 'Blurred Vision',
      medicalTerm: 'Transient Lens Refraction',
      description: 'Sudden or progressive reduction in vision clarity, creating trouble focusing on near or distant structures.',
      mechanism: 'Extremely high blood glucose creates an osmotic gradient that pulls water directly into the lens of the eyes. This causes temporary swelling, altering the focal point of light on the retinal backplane.',
      icon: Eye,
      svgIllustration: (
        <svg viewBox="0 0 160 120" className="w-24 h-24 text-cyan-400" fill="none">
          {/* Eye lens drawing */}
          <path d="M40,60 Q80,20 120,60 Q80,100 40,60" stroke="currentColor" strokeWidth="2" />
          {/* Rays of light getting distorted */}
          <line x1="15" y1="60" x2="60" y2="60" stroke="#f59e0b" strokeWidth="1.5" />
          <path d="M60,60 L110,45" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,3" />
          <path d="M60,60 L110,75" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,3" />
          <circle cx="60" cy="60" r="14" fill="rgba(6,182,212,0.1)" stroke="#06b6d4" strokeWidth="2" />
          <text x="35" y="112" fill="rgba(245,158,11,0.8)" className="font-mono text-[8px] font-bold">LENS REFRACTION SHIFT</text>
        </svg>
      )
    },
    {
      id: '04',
      title: 'Persistent Fatigue',
      medicalTerm: 'Mitochondrial Glucose Starvation',
      description: 'Generalized muscle weakness, chronic exhaustion, and low energy levels despite getting proper rest.',
      mechanism: 'Because insulin signaling fails, glucose cannot pass into skeletal muscles and vital tissues. Cells remain starved of their basic fuel, disabling critical cellular ATP production processes.',
      icon: BatteryLow,
      svgIllustration: (
        <svg viewBox="0 0 160 120" className="w-24 h-24 text-cyan-400" fill="none">
          {/* Battery boundary */}
          <rect x="35" y="40" width="80" height="40" rx="8" stroke="currentColor" strokeWidth="2" />
          <rect x="115" y="50" width="8" height="20" rx="2" fill="currentColor" />
          {/* Empty red cell */}
          <rect x="43" y="46" width="16" height="28" rx="4" fill="#ef4444" className="animate-pulse" />
          <text x="30" y="104" fill="rgba(239,68,68,0.8)" className="font-mono text-[8px] font-bold">DISRUPTED CELLULAR ATP</text>
        </svg>
      )
    },
    {
      id: '05',
      title: 'Slow-Healing Wounds',
      medicalTerm: 'Delayed Endothelial Tissue Clotting',
      description: 'Minor scratches, cuts, or bruises take weeks or months to close, escalating the risk of severe bacterial infections.',
      mechanism: 'Excessive glucose thickens blood walls, impeding oxygen flow. Neuropathy reduces local circulation signals, and glucose impairs collagen synthesis and tissue regeneration functions.',
      icon: ShieldAlert,
      svgIllustration: (
        <svg viewBox="0 0 160 120" className="w-24 h-24 text-cyan-400" fill="none">
          {/* Skin layers */}
          <line x1="20" y1="80" x2="60" y2="80" stroke="currentColor" strokeWidth="2.5" />
          <line x1="100" y1="80" x2="140" y2="80" stroke="currentColor" strokeWidth="2.5" />
          {/* Wounded gap in skin with red cells */}
          <path d="M 60,80 Q 80,105 100,80" stroke="#ef4444" strokeWidth="2" strokeDasharray="3,3" />
          <circle cx="80" cy="85" r="4" fill="#ef4444" />
          <circle cx="68" cy="92" r="3" fill="#ef4444" />
          <circle cx="92" cy="92" r="3" fill="#ef4444" />
          <text x="32" y="112" fill="rgba(239,68,68,0.8)" className="font-mono text-[8px] font-bold">IMPEDED REGENERATIVE MATRIX</text>
        </svg>
      )
    },
  ];

  return (
    <div className="relative min-h-screen py-16 md:py-24 overflow-hidden" id="symptoms-timeline-page">
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid-overlay opacity-5 z-0" />
      <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full bg-cyan-500/5 blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 relative z-10">
        {/* Header section */}
        <div className="text-center max-w-3xl mx-auto mb-20 md:mb-32">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-1.5 text-xs font-mono text-cyan-700 mb-4 font-semibold">
            <HeartPulse className="h-4 w-4 text-cyan-600 animate-pulse" />
            <span>PATHOLOGY SCREENING TIMELINE</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
            Primary <span className="text-cyan-600">Symptoms</span>
          </h1>
          <p className="mt-4 text-slate-500 text-base md:text-lg font-medium">
            Investigating classical diabetes warning signs and the underlying cellular cascades that trigger metabolic dysfunction.
          </p>
        </div>

        {/* Timeline representation */}
        <div className="relative">
          {/* Central Line for Desktop */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-cyan-500/30 via-white/10 to-transparent hidden lg:block" />

          <div className="space-y-16 lg:space-y-24">
            {symptoms.map((symptom, idx) => {
              const isEven = idx % 2 === 0;
              const Icon = symptom.icon;

              return (
                <div 
                  key={symptom.id}
                  className="relative flex flex-col lg:flex-row items-center w-full"
                  id={`symptom-node-${symptom.id}`}
                >
                  {/* central glow node for desktop */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-20 hidden lg:flex h-8 w-8 items-center justify-center rounded-full bg-medical-bg border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                    <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  </div>

                  {/* Content panels */}
                  {/* Left-aligned block for even items, placeholder for odd items */}
                  <div className={`w-full lg:w-1/2 flex justify-center ${isEven ? 'lg:justify-end lg:pr-16' : 'lg:order-2 lg:justify-start lg:pl-16'}`}>
                    <motion.div
                      initial={{ opacity: 0, x: isEven ? -40 : 40 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className="w-full max-w-lg p-6 md:p-8 rounded-3xl glass-panel glass-panel-hover border border-white/10 flex flex-col md:flex-row items-center gap-6"
                    >
                      {/* Left icon & text */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/30">
                            <Icon className="h-5 w-5 text-cyan-400" />
                          </div>
                          <div>
                            <span className="font-mono text-[9px] tracking-widest text-cyan-500 uppercase">{symptom.medicalTerm}</span>
                            <h3 className="font-display text-lg font-bold text-white leading-tight">{symptom.title}</h3>
                          </div>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {symptom.description}
                        </p>
                        <p className="text-gray-500 text-xs leading-relaxed border-t border-white/5 pt-3">
                          <strong className="text-cyan-500 font-mono text-[9px] uppercase tracking-wider block mb-1">CLINICAL MECHANISM</strong>
                          {symptom.mechanism}
                        </p>
                      </div>

                      {/* Right vector illustration */}
                      <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-white/5 border border-white/10 p-2">
                        {symptom.svgIllustration}
                      </div>
                    </motion.div>
                  </div>

                  {/* Empty space filler column on opposite side for desktop layout symmetry */}
                  <div className="w-full lg:w-1/2 hidden lg:block" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
