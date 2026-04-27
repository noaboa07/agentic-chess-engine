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
  pawnstorm_petey:             "I'm pushing. That's it. That's the plan.",
  grizelda_the_greedy:         "Give me your pieces. Give me ALL of them.",
  brother_oedric:              "I have... all the time... in the world...",
  sir_vance_the_vain:          "You know what's coming. Let's see if you remembered.",
  lady_cassandra_bloodwine:    "My family never declined a gambit. Neither will I.",
  the_hippomancer:             "The Hippo Formation is eternal. You are not.",
  magister_tobias_the_pedant:  "I have this memorized to move 22. I hope you're in the mainline.",
  wrathful_vex:                "There's a combination here somewhere. There's ALWAYS a combination.",
  the_mirror_maiden:           "You won't blunder. You'll just slowly run out of good moves.",
  lady_vipra_the_coiled:       "I was already winning on the clock before you touched a piece.",
  boros_the_time_devourer:     "Trade everything. We'll settle this where you're weakest.",
  the_reaper_of_pawns:         "A pawn is never just a pawn. Give me one and I will take your soul.",
  oracle_nyx_the_paranoid:     "Whatever you're planning, I've already closed the door.",
  the_fallen_champion:         "I was the greatest once. I remember how this ends.",
  dread_hades:                 "I have watched every soul that fell before you. I know exactly where you break.",
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
          <p className="text-sm italic text-zinc-400 mt-2">&quot;{BOSS_TAUNT[personaId]}&quot;</p>
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
