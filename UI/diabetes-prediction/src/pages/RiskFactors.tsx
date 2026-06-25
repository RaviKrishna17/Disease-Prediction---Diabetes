/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Flame, Heart, Users, Activity, Cigarette, Waves, ShieldAlert } from 'lucide-react';

interface RiskFactor {
  id: string;
  category: string;
  title: string;
  description: string;
  mechanism: string;
  stat: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function RiskFactors() {
  const factors: RiskFactor[] = [
    {
      id: '01',
      category: 'METABOLIC COMPOSITION',
      title: 'Obesity & Excess Visceral Fat',
      description: 'Accumulation of adipose tissue, particularly abdominal fat, triggers systemic subclinical inflammation and releases high concentrations of free fatty acids.',
      mechanism: 'Excess fatty acids inhibit critical phosphorylation in the insulin receptor substrate-1 (IRS-1) signaling pathway, causing high skeletal muscle and hepatic insulin resistance.',
      stat: 'BMI &ge; 30.0',
      icon: Flame,
    },
    {
      id: '02',
      category: 'CARDIOVASCULAR TENSION',
      title: 'High Blood Pressure (Hypertension)',
      description: 'Persistent arterial shear stress is highly comorbid with insulin resistance and endothelial microvascular dysfunction.',
      mechanism: 'Hypertension and high vascular tone are linked to altered intracellular calcium levels, which further impair insulin-mediated glucose transport.',
      stat: '&ge; 130 / 80 mmHg',
      icon: Heart,
    },
    {
      id: '03',
      category: 'GENETIC DISPOSITION',
      title: 'Hereditary & Family History',
      description: 'Inherited genetic variations affect pancreatic beta-cell insulin secretion, capacity, and early structural tissue decline.',
      mechanism: 'Polymorphisms in transcription factor genes (like TCF7L2) increase vulnerability to progressive insulin-secretion failures when paired with lifestyle stress.',
      stat: 'First-degree relative risk',
      icon: Users,
    },
    {
      id: '04',
      category: 'LIPID DERANGEMENT',
      title: 'Dyslipidemia / High Cholesterol',
      description: 'Elevated low-density lipoproteins (LDL), low high-density lipoproteins (HDL), and hypertriglyceridemia alter systemic cell membrane signaling.',
      mechanism: 'Intracellular accumulation of toxic lipid derivatives (diacylglycerols and ceramides) disrupts skeletal muscle glucose uptake.',
      stat: 'HDL &lt; 35 mg/dL',
      icon: Activity,
    },
    {
      id: '05',
      category: 'TOXIC INHALATION',
      title: 'Active Smoking & Nicotine',
      description: 'Nicotine is a potent chemical vasoconstrictor that triggers stress hormones (cortisol, catecholamines) and systemic oxidative damage.',
      mechanism: 'Nicotine direct binding to neuronal nicotinic receptors triggers autonomic sympathetic activation, directly causing insulin resistance.',
      stat: 'High relative hazard ratio',
      icon: Cigarette,
    },
    {
      id: '06',
      category: 'SEDENTARY METABOLISM',
      title: 'Physical Inactivity',
      description: 'Lack of regular muscle contractions leads to chronic muscle glycogen overload and a downregulation of insulin-receptive channels.',
      mechanism: 'Skeletal muscles require regular physical tension to trigger insulin-independent GLUT-4 translocation via AMP-activated protein kinase pathways.',
      stat: '&lt; 150 min active activity / week',
      icon: Waves,
    },
  ];

  return (
    <div className="relative min-h-screen py-16 md:py-24 overflow-hidden" id="risk-factors-page">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-grid-overlay opacity-5 z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 relative z-10">
        {/* Header Title and Description */}
        <div className="text-center max-w-3xl mx-auto mb-20 md:mb-28">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-mono text-red-600 mb-4 font-semibold">
            <ShieldAlert className="h-4 w-4 text-red-500" />
            <span>PRIMARY RISK MARKERS</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
            Clinical <span className="text-cyan-600">Risk Factors</span>
          </h1>
          <p className="mt-4 text-slate-500 text-base md:text-lg font-medium">
            An analysis of major biomarkers and lifestyle behaviors that biochemically accelerate pancreatic beta-cell depletion and cellular insulin resistance.
          </p>
        </div>

        {/* Premium Alternating Layout Grid */}
        <div className="space-y-12">
          {factors.map((factor, idx) => {
            const isEven = idx % 2 === 0;
            const Icon = factor.icon;

            return (
              <motion.div
                key={factor.id}
                initial={{ opacity: 0, x: isEven ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-120px" }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-stretch gap-6 w-full`}
                id={`risk-factor-${factor.id}`}
              >
                {/* Index / Visual Anchor Column */}
                <div className="w-full lg:w-1/4 flex flex-col justify-between p-6 rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <span className="font-display text-9xl font-black">{factor.id}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                      <Icon className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div>
                      <p className="font-mono text-[9px] tracking-widest text-cyan-500">{factor.category}</p>
                      <h3 className="font-display text-lg font-bold text-white">{factor.title}</h3>
                    </div>
                  </div>

                  <div className="mt-8 border-t border-white/10 pt-4">
                    <p className="font-mono text-[10px] text-gray-500">DIAGNOSTIC THRESHOLD</p>
                    <p className="font-mono text-sm font-semibold text-cyan-300 mt-0.5">{factor.stat}</p>
                  </div>
                </div>

                {/* Mechanistic Breakdown Column (Larger Card) */}
                <div className="flex-1 p-6 md:p-8 rounded-3xl glass-panel glass-panel-hover flex flex-col justify-center space-y-4">
                  <div>
                    <h4 className="font-display text-xs font-bold tracking-widest text-gray-400 uppercase">PATHOPHYSIOLOGY</h4>
                    <p className="text-gray-300 mt-2 text-sm md:text-base leading-relaxed">
                      {factor.description}
                    </p>
                  </div>

                  <div className="border-t border-white/5 pt-4">
                    <h4 className="font-mono text-[10px] font-bold tracking-widest text-cyan-400 uppercase">UNDERLYING BIOMECHANICAL CASCADE</h4>
                    <p className="text-gray-400 mt-2 text-xs md:text-sm leading-relaxed">
                      {factor.mechanism}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
