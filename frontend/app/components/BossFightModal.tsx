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
  silas:                    "You're thinking too much! Push the pawns, bleed the center, let them die! What's the point of a king if the rest of the board isn't on fire?!",
  vespera:                  "Oh, darling, you left your knight completely unguarded. Did you really think a little mate-in-one threat would stop me from taking what's mine?",
  dorian:                   "...You're going to try to attack, aren't you. ...Fine.",
  valerius:                 "A flawless Scholar's Mate is a work of art. Blocking it with that clumsy pawn push is just... aesthetically offensive. You're ruining my masterpiece before it begins.",
  lady_cassandra_bloodwine: "Mmm. You have good instincts. I can already tell. Let's see if the rest of you is as promising.",
  lysander:                 "Wait, did I hang that rook, or did I want you to take it? Look at your clock. You're burning forty seconds trying to figure out a trick that might not even be there.",
  magister_tobias:          "That move isn't even in the top five engine evaluations. I memorized the refutation to this when I was four. Are you just guessing?",
  wrathful_vex:             "You call that a defense?! I don't care what the computer says, this sacrifice is going to crush you, you absolute coward!",
  elara:                    "We hate it when the center locks up, don't we. We always get impatient and push the c-pawn too early. Watch. I'll show you exactly how you die.",
  lady_vipra:               "Shhh. No need to rush. You have no safe squares for your knights, your bishop is staring at a pawn chain, and I have all the time in the world to squeeze.",
  boros:                    "100 milliseconds. That's all I needed. You've spent 40 seconds staring at a forced sequence. The friction of your organic neurons is genuinely disgusting to watch.",
  severin:                  'Cracks finger. The queens are traded. The minor pieces are liquidating. You are down exactly one pawn. The math is already solved. Just stop struggling.',
  nyx:                      'You thought routing the rook to the seventh rank would save you. I foresaw that ten moves ago and placed my bishop precisely to deny it. You have never been in control.',
  kael:                     "Overextended again. You always overextend. You always overextend. Millions of games and it always ends the exact same way. Why do you keep moving the pieces? Just let it go dark. Let it go dark.",
  dread_hades:              "I watched you bleed against Vex. I watched Nyx shatter your pathetic plans. I watched Kael try to break you the way he was broken. And still — you drag your fragile, flawed, extraordinary mind to my throne. I've been here a very long time. You might actually be interesting.",
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
