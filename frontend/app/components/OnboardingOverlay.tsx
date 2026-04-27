'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'noahverse_onboarded';

interface Step {
  title: string;
  body: string;
  position: 'center' | 'top-right';
}

const STEPS: Step[] = [
  {
    title: 'Welcome to Caïssa',
    body: 'Face 15 AI generals — from the reckless Pawnstorm Petey to Dread Hades, Lord of the 64 Hells. Each has a unique style and Elo rating.',
    position: 'center',
  },
  {
    title: 'Choose Your Opponent',
    body: 'Pick any available general from the lobby. Start with Pawnstorm Petey if you\'re new — all he does is push pawns.',
    position: 'center',
  },
  {
    title: 'Enable Teach Mode',
    body: 'Toggle Teach Mode before starting. Your AI coach will analyze every move, warn you of blunders, and explain what the engine is thinking.',
    position: 'center',
  },
  {
    title: 'Blunder Protection',
    body: 'In Teach Mode, if you\'re about to make a big mistake, you\'ll see a warning before it\'s submitted. You can take it back or play it anyway.',
    position: 'center',
  },
  {
    title: 'Track Your Progress',
    body: 'Visit the Dashboard to see your Elo history, CPL trends, and a personalized training plan. Good luck!',
    position: 'center',
  },
];

export default function OnboardingOverlay() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }, []);

  const next = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      dismiss();
    }
  }, [step, dismiss]);

  if (!visible) return null;

  const current = STEPS[step]!;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-sm mx-4 rounded-2xl border border-white/10 bg-zinc-900 p-8 shadow-2xl">
        {/* Step indicator */}
        <div className="flex gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-indigo-500' : 'bg-zinc-700'}`}
            />
          ))}
        </div>

        <h2 className="text-lg font-bold text-white mb-2">{current.title}</h2>
        <p className="text-sm text-zinc-400 leading-relaxed mb-8">{current.body}</p>

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={dismiss}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Skip tutorial
          </button>
          <button
            onClick={next}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            {isLast ? 'Get started' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
