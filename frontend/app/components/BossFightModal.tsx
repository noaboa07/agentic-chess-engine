'use client';

import { useRouter } from 'next/navigation';
import type { PersonaId } from '../context/GameContext';

interface BossFightInfo {
  name: string;
  elo: number;
  lesson: string;
  watchOut: string;
  reward: string;
}

interface BossFightModalProps {
  personaId: PersonaId;
  info: BossFightInfo;
  onClose: () => void;
}

const BOSS_TAUNT: Record<PersonaId, string> = {
  roomba_noah:             "I bump into pieces randomly. You'll still find a way to lose.",
  clown_noah:              "Chaos is my strategy. Good luck preparing for nothing.",
  tilted_noah:             "I attack on move one. Your king is already nervous.",
  sleep_deprived_noah:     "I'm running on three hours of sleep. Still better than you.",
  gym_bro_noah:            "Every piece I have is a weapon. Watch your back rank.",
  coffee_shop_noah:        "I'll squeeze your position until you can't breathe.",
  tech_bro_noah:           "I optimize. You improvise. We both know how this ends.",
  rat_main_noah:           "Get to the endgame. I'll be waiting.",
  grandmaster_twitch_noah: "Chat already called your blunder. I'm just here to confirm it.",
  gpa_noah:                "I memorized your line deeper than you did.",
  devil_noah:              "One piece sacrifice. That's all it takes.",
  angel_noah:              "You'll exhaust yourself trying to crack me open.",
  god_noah:                "There is no move you can make that I have not already calculated.",
};

export default function BossFightModal({ personaId, info, onClose }: BossFightModalProps) {
  const router = useRouter();

  const handleStart = () => {
    router.push(`/play?campaign=${personaId}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm mx-4 rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-zinc-800">
          <p className="text-[10px] text-indigo-400 uppercase tracking-widest mb-1">Boss Fight</p>
          <h2 className="text-xl font-bold text-white">{info.name}</h2>
          <p className="text-xs text-zinc-500 mt-0.5">{info.elo} Elo</p>
          <p className="text-sm italic text-zinc-400 mt-2">"{BOSS_TAUNT[personaId]}"</p>
        </div>

        {/* Details */}
        <div className="px-6 py-5 space-y-4 text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">Lesson</p>
            <p className="text-zinc-200">{info.lesson}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">Watch Out</p>
            <p className="text-orange-300">{info.watchOut}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">Reward</p>
            <p className="text-emerald-400">{info.reward}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-zinc-700 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            Start Fight
          </button>
        </div>
      </div>
    </div>
  );
}
