/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Apple, Dumbbell, Scale, CalendarRange, Droplets, Smile, ShieldCheck } from 'lucide-react';

interface PreventionGuide {
  title: string;
  subtitle: string;
  description: string;
  guidelines: string[];
  icon: React.ComponentType<{ className?: string }>;
}

export default function Prevention() {
  const strategies: PreventionGuide[] = [
    {
      title: 'Healthy Diet',
      subtitle: 'Nutritional Balance & Glycemic Index',
      description: 'Prioritize a nutrition plan loaded with low-glycemic carbs, high dietary fibers, lean proteins, and unsaturated fats to prevent postprandial glucose surges.',
      guidelines: [
        'Select complex carbohydrates (leafy greens, whole wheat, oats).',
        'Avoid high-fructose syrups and processed simple sugars.',
        'Adopt the plate method: 50% non-starchy vegetables, 25% protein, 25% grains.'
      ],
      icon: Apple,
    },
    {
      title: 'Exercise & Activity',
      subtitle: 'Skeletal Insulin Reactivity Induction',
      description: 'Engage in structured cardiovascular training and resistance training. Muscle exertion acts as an insulin-independent glucose sink.',
      guidelines: [
        'A minimum of 150 minutes of moderate cardiovascular workout weekly.',
        'Perform strength exercises 2-3 times per week to build glucose storage.',
        'Break up sedentary office blocks with 5-minute active stretching intervals.'
      ],
      icon: Dumbbell,
    },
    {
      title: 'Weight Control',
      subtitle: 'Visceral Lipolysis Management',
      description: 'Reducing overall body mass by even 5% to 7% significantly minimizes active cellular resistance to circulating insulin signals.',
      guidelines: [
        'Maintain a targeted waist circumference below critical guidelines.',
        'Focus on permanent lifestyle changes rather than rapid, unstable crash diets.',
        'Track daily caloric load vs energy expenditure for negative metabolic balances.'
      ],
      icon: Scale,
    },
    {
      title: 'Regular Checkups',
      subtitle: 'Proactive Glycated Hemoglobin Screening',
      description: 'Early clinical intervention prevents mild glucose resistance from degrading into permanent, irreversible pancreatic beta-cell burnout.',
      guidelines: [
        'Obtain annual HbA1c tests (values under 5.7% are classified healthy).',
        'Check fasting blood sugar and resting lipid/blood pressure ranges.',
        'Review renal filtration markers and microvascular retinal health regularly.'
      ],
      icon: CalendarRange,
    },
    {
      title: 'Optimal Hydration',
      subtitle: 'Osmotic Dilution & Blood Viscosity',
      description: 'Sufficient water intake assists the kidneys in safely filtering and secreting excess plasma glucose, preventing chronic cellular dehydration.',
      guidelines: [
        'Drink filtered water throughout the day (avoid sweetened beverages).',
        'Aim for a personal goal of 2.5 to 3 liters based on active sweat loss.',
        'Monitor urine color (pale light yellow indicates optimal metabolic hydration).'
      ],
      icon: Droplets,
    },
    {
      title: 'Healthy Lifestyle',
      subtitle: 'Cortisol & Autonomic Regulation',
      description: 'High psychological stress and sleep deprivation trigger excess catecholamines and cortisol, which cause blood sugar surges.',
      guidelines: [
        'Target 7-9 hours of restorative sleep to regulate circadian cortisol.',
        'Incorporate mindfulness practices to reduce sympathetic nervous tone.',
        'Eliminate tobacco and limit alcohol to preserve cardiovascular lining.'
      ],
      icon: Smile,
    },
  ];

  return (
    <div className="relative min-h-screen py-16 md:py-24 overflow-hidden" id="prevention-strategies-page">
      {/* Background grids */}
      <div className="absolute inset-0 bg-grid-overlay opacity-5 z-0" />
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 relative z-10">
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-1.5 text-xs font-mono text-cyan-700 mb-4 font-semibold">
            <ShieldCheck className="h-4 w-4 text-cyan-600" />
            <span>CLINICAL PREVENTION GUIDELINES</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
            Diabetes <span className="text-cyan-600">Prevention</span>
          </h1>
          <p className="mt-4 text-slate-500 text-base md:text-lg font-medium">
            Evidence-based clinical guidelines and therapeutic lifestyle behaviors to prevent insulin receptor decay and maintain pancreatic beta-cell health.
          </p>
        </div>

        {/* Structured Minimalist Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8" id="prevention-cards-grid">
          {strategies.map((strat, idx) => {
            const Icon = strat.icon;

            return (
              <motion.div
                key={strat.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                className="rounded-3xl glass-panel p-6 border border-white/10 flex flex-col justify-between hover:border-cyan-500/20 hover:shadow-[0_10px_30px_rgba(6,182,212,0.06)] transition-all duration-300"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/25">
                      <Icon className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-bold text-white leading-tight">{strat.title}</h3>
                      <p className="font-mono text-[9px] text-cyan-500 tracking-wider uppercase mt-0.5">{strat.subtitle}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-300 text-xs leading-relaxed mb-6">
                    {strat.description}
                  </p>
                </div>

                {/* Bullets List */}
                <div className="border-t border-white/5 pt-4">
                  <h4 className="font-mono text-[9px] font-bold tracking-widest text-cyan-400 uppercase mb-3">CLINICAL DIRECTIVES</h4>
                  <ul className="space-y-2.5">
                    {strat.guidelines.map((bullet, bidx) => (
                      <li key={bidx} className="flex items-start gap-2.5 text-[11px] text-gray-400 leading-normal">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
