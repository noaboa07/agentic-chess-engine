'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../context/AuthContext';
import { PERSONAS, type PersonaId, type DescentNumber } from '../context/GameContext';
import { getCampaignProgress, type CampaignStatus } from '../../lib/db';
import BossFightModal from '../components/BossFightModal';

const BOSS_DESCRIPTION: Record<string, string> = {
  pawnstorm_petey:             'Shoves every pawn forward on turn one and hangs pieces constantly. Pure chaos.',
  grizelda_the_greedy:         'Captures every piece she can reach regardless of consequences. Beware surprise material grabs.',
  brother_oedric:              'Pure passive setup — pieces behind pawns, never initiates. Punishes impatience and premature breaks.',
  sir_vance_the_vain:          "Plays the Scholar's Mate setup every game. Folds completely if you defend f7 properly.",
  lady_cassandra_bloodwine:    "All romantic-era gambits — King's Gambit, Danish, Smith-Morra. Brutal attacks if you accept.",
  the_hippomancer:             'Summons the ancient Hippo Formation and never breaks it. An unmovable presence.',
  magister_tobias_the_pedant:  'Memorized 22 moves of mainline theory. Completely lost the moment you play a sideline.',
  wrathful_vex:                "Forces tactics in every position, even when they don't exist. Sacs unsoundly.",
  the_mirror_maiden:           'No tactics — just accumulating tiny advantages. Better pawn structure, better square, better piece.',
  lady_vipra_the_coiled:       'Premoves everything, plays for flag, sound but not deep. Cracks under long thinks.',
  boros_the_time_devourer:     'Trades down to endgames at every opportunity. Surgical technique in simplified positions.',
  the_reaper_of_pawns:         'Hunts every loose pawn with prophylactic precision. Converts material advantage clinically.',
  oracle_nyx_the_paranoid:     'Denies your plans before you form them. Every move does two things at once.',
  the_fallen_champion:         'A universal style forged in defeat — adapts mid-game to your specific weaknesses.',
  dread_hades:                 'Final boss. Lord of all 64 Hells. Knows your campaign history. Adapts to everything.',
};

const WATCH_OUT: Record<string, string> = {
  pawnstorm_petey:             "Even random pawn pushes create threats if you don't develop immediately.",
  grizelda_the_greedy:         "She'll grab material even when it loses tempo — she may come out ahead anyway.",
  brother_oedric:              "Don't rush. Every premature pawn break hands him a free target.",
  sir_vance_the_vain:          "Defend f7 on move 2. Then punish the exposed queen before he regroups.",
  lady_cassandra_bloodwine:    "Never accept a gambit you haven't studied. The attack is surprisingly sharp.",
  the_hippomancer:             "The Hippo has teeth. Don't let the position fully close — you'll run out of moves.",
  magister_tobias_the_pedant:  "Play a sideline early. His strength collapses completely off-book.",
  wrathful_vex:                "Calculate everything. Half his combinations are real. Half are hallucinations.",
  the_mirror_maiden:           "Don't let the position close. Create imbalances before she suffocates you.",
  lady_vipra_the_coiled:       "Don't rush on the clock. Her inaccuracies compound — stay patient.",
  boros_the_time_devourer:     "Avoid piece trades unless you win material. Every simplification favors him.",
  the_reaper_of_pawns:         "Protect every pawn. Defend before it becomes a target, not after.",
  oracle_nyx_the_paranoid:     "Don't play natural-looking moves. She's already prevented the follow-up.",
  the_fallen_champion:         "She has studied your campaign weaknesses. Play your strengths, not your habits.",
  dread_hades:                 "He has watched every general you defeated. He knows exactly where you break.",
};

const UNLOCK_REWARD: Record<string, string> = {
  pawnstorm_petey:             'Unlocks Grizelda the Greedy',
  grizelda_the_greedy:         'Unlocks Brother Oedric the Slothful',
  brother_oedric:              'Unlocks Sir Vance the Vain — and the Second Descent',
  sir_vance_the_vain:          'Unlocks Lady Cassandra Bloodwine',
  lady_cassandra_bloodwine:    'Unlocks The Hippomancer',
  the_hippomancer:             'Unlocks Magister Tobias the Pedant — and the Third Descent',
  magister_tobias_the_pedant:  'Unlocks Wrathful Vex',
  wrathful_vex:                'Unlocks The Mirror Maiden',
  the_mirror_maiden:           'Unlocks Lady Vipra the Coiled',
  lady_vipra_the_coiled:       'Unlocks Boros the Time Devourer — and the Fourth Descent',
  boros_the_time_devourer:     'Unlocks The Reaper of Pawns',
  the_reaper_of_pawns:         'Unlocks Oracle Nyx the Paranoid',
  oracle_nyx_the_paranoid:     'Unlocks The Fallen Champion',
  the_fallen_champion:         'Unlocks Dread Hades, Lord of the 64 Hells',
  dread_hades:                 'You have descended through all 64 Hells. The Caïssa weeps.',
};

const DESCENTS: { descent: DescentNumber; label: string }[] = [
  { descent: 1, label: 'First Descent — The Outer Hells' },
  { descent: 2, label: 'Second Descent — The Middle Hells' },
  { descent: 3, label: 'Third Descent — The Deep Hells' },
  { descent: 4, label: 'Fourth Descent — The Abyss' },
];

function StatusBadge({ status }: { status: CampaignStatus | undefined }) {
  if (status === 'complete') {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
        ✓ Complete
      </span>
    );
  }
  if (status === 'available') {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full">
        Available
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs font-semibold text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">
      🔒 Locked
    </span>
  );
}

interface FightTarget { personaId: PersonaId; name: string; elo: number; description: string }

export default function CampaignPage() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<Record<string, CampaignStatus>>({});
  const [loading, setLoading] = useState(true);
  const [fightTarget, setFightTarget] = useState<FightTarget | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getCampaignProgress(user.id)
      .then(setProgress)
      .catch(() => setProgress({}))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <main className="h-full overflow-y-auto bg-zinc-950 text-white">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700/60 bg-zinc-800/40 hover:bg-zinc-800 text-sm text-zinc-400 hover:text-zinc-100 transition-all duration-150">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Campaign</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Descend through the hells and defeat each General</p>
          </div>
        </div>

        {!user && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-300 mb-6">
            Sign in to track your campaign progress.
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-200" />
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {DESCENTS.map((d, descentIdx) => {
              const descentPersonas = PERSONAS.filter(p => p.descent === d.descent);
              return (
                <div key={d.descent}>
                  {/* Descent header */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{d.label}</span>
                    <div className="flex-1 h-px bg-zinc-800" />
                  </div>

                  {/* Persona cards */}
                  <div className="flex flex-col">
                    {descentPersonas.map((persona, cardIdx) => {
                      const globalIdx = PERSONAS.findIndex(p => p.id === persona.id);
                      const status = progress[persona.id] ?? (globalIdx === 0 ? 'available' : 'locked');
                      const isLocked = status === 'locked';
                      const isAvailable = status === 'available';

                      return (
                        <div key={persona.id}>
                          <div
                            className={`rounded-2xl border p-4 transition-all ${
                              isLocked
                                ? 'border-zinc-800 bg-zinc-900/40 opacity-60'
                                : status === 'complete'
                                ? 'border-emerald-800/50 bg-emerald-950/20'
                                : 'border-indigo-500/40 bg-zinc-900 ring-1 ring-indigo-500/30 shadow-[0_0_16px_rgba(99,102,241,0.2)] animate-pulse'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              {/* Avatar */}
                              <div className={`shrink-0 rounded-xl overflow-hidden ${isLocked ? 'grayscale' : ''}`}>
                                <Image
                                  src={`/avatars/${persona.id}.svg`}
                                  alt={persona.name}
                                  width={56}
                                  height={56}
                                  className="object-cover"
                                />
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-sm">{persona.name}</span>
                                  <span className="text-xs text-zinc-500">{persona.elo} Elo</span>
                                  <StatusBadge status={status} />
                                </div>
                                <p className="text-xs text-zinc-400 mt-0.5">
                                  {BOSS_DESCRIPTION[persona.id]}
                                </p>
                                {!isLocked && (
                                  <p className="text-[11px] text-zinc-600 mt-0.5">
                                    {persona.description}
                                  </p>
                                )}
                              </div>

                              {/* Action */}
                              {isAvailable && (
                                <button
                                  onClick={() => setFightTarget({ personaId: persona.id, name: persona.name, elo: persona.elo, description: persona.description })}
                                  className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors whitespace-nowrap"
                                >
                                  Fight Boss
                                </button>
                              )}
                              {status === 'complete' && (
                                <Link
                                  href={`/play?campaign=${persona.id}`}
                                  className="shrink-0 rounded-lg border border-emerald-700/40 px-4 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-900/20 transition-colors whitespace-nowrap"
                                >
                                  Rematch
                                </Link>
                              )}
                            </div>
                          </div>

                          {/* Connector line between cards within descent */}
                          {cardIdx < descentPersonas.length - 1 && (
                            <div className="flex justify-center py-1">
                              <div className={`w-px h-4 ${
                                progress[persona.id] === 'complete' && progress[descentPersonas[cardIdx + 1].id] !== 'locked'
                                  ? 'bg-emerald-700'
                                  : 'bg-zinc-800'
                              }`} />
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Connector between descents */}
                    {descentIdx < DESCENTS.length - 1 && (
                      <div className="flex justify-center py-1">
                        <div className="w-px h-4 bg-zinc-800" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {fightTarget && (
        <BossFightModal
          personaId={fightTarget.personaId}
          info={{
            name:     fightTarget.name,
            elo:      fightTarget.elo,
            lesson:   fightTarget.description,
            watchOut: WATCH_OUT[fightTarget.personaId] ?? '',
            reward:   UNLOCK_REWARD[fightTarget.personaId] ?? '',
          }}
          onClose={() => setFightTarget(null)}
        />
      )}
    </main>
  );
}
