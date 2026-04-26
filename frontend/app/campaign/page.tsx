'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../context/AuthContext';
import { PERSONAS, type PersonaId } from '../context/GameContext';
import { getCampaignProgress, type CampaignStatus } from '../../lib/db';
import BossFightModal from '../components/BossFightModal';

const LESSON_FOCUS: Record<string, string> = {
  roomba_noah:             'Moving pieces legally',
  clown_noah:              'Basic captures',
  tilted_noah:             'Opening principles',
  sleep_deprived_noah:     'Avoiding blunders',
  gym_bro_noah:            'Tactics — forks & pins',
  coffee_shop_noah:        'Pawn structure',
  tech_bro_noah:           'Positional play',
  rat_main_noah:           'Endgame fundamentals',
  grandmaster_twitch_noah: 'Attack patterns',
  gpa_noah:                'Strategic planning',
  devil_noah:              'Complex combinations',
  angel_noah:              'Defense & counterplay',
  god_noah:                'Full game mastery',
};

const BOSS_DESCRIPTION: Record<string, string> = {
  roomba_noah:             'Bumbles around the board at random — but still knows how pawns move.',
  clown_noah:              'Unpredictable and chaotic. Learns to capture your pieces while honking.',
  tilted_noah:             'Tilted from ladder games. Plays fast openings and makes rash decisions.',
  sleep_deprived_noah:     'Running on 3 hours of sleep. Blunders often, but occasionally plays a gem.',
  gym_bro_noah:            'Aggressive and loud. Loves tactical shots and forgets about defense.',
  coffee_shop_noah:        'Methodical and caffeinated. Builds a solid pawn structure and waits.',
  tech_bro_noah:           'Optimizes everything positionally. Trades off complexity for structure.',
  rat_main_noah:           'A marathon runner. Grinds you down in the endgame with perfect technique.',
  grandmaster_twitch_noah: 'Streams while playing. Charismatic, sharp, and surprisingly dangerous.',
  gpa_noah:                'Calculated and clinical. Studies every opening line and rarely blunders.',
  devil_noah:              'Tactical genius wrapped in chaos. Sacrifices pieces for devastating attacks.',
  angel_noah:              'Patient and defensive. Turns your aggression against you every time.',
  god_noah:                'The final boss. Plays near-perfect chess with surgical precision.',
};

const WATCH_OUT: Record<string, string> = {
  roomba_noah:             "Even random play can fork you if you're not paying attention.",
  clown_noah:              "Will gladly take free pieces — don't hang anything.",
  tilted_noah:             'Aggressive d4/e4 openings. Punishes passive play quickly.',
  sleep_deprived_noah:     'Occasionally plays a brilliant move out of nowhere.',
  gym_bro_noah:            'Knight forks on every open file. Watch your back rank.',
  coffee_shop_noah:        "Slow-builds a positional squeeze. Don't let the position close.",
  tech_bro_noah:           'Dominates with the bishop pair in open positions.',
  rat_main_noah:           'Will trade into a K+P endgame and outplay you every time.',
  grandmaster_twitch_noah: 'Sharp tactical sequences from move 10. Calculate carefully.',
  gpa_noah:                'Punishes every opening inaccuracy. Study your lines.',
  devil_noah:              'Piece sacrifices that look wrong but are completely sound.',
  angel_noah:              'Turns your own attack into a counterattack. Stay solid.',
  god_noah:                "There are no weaknesses. You'll need to create yours.",
};

const UNLOCK_REWARD: Record<string, string> = {
  roomba_noah:             'Unlocks Clown Noah',
  clown_noah:              'Unlocks Tilted Noah + Forest theme',
  tilted_noah:             'Unlocks Sleep-Deprived Noah + Slate theme',
  sleep_deprived_noah:     'Unlocks Gym Bro Noah + Rose theme',
  gym_bro_noah:            'Unlocks Coffee Shop Noah + Gold Rush theme',
  coffee_shop_noah:        'Unlocks Tech Bro Noah + Ice theme',
  tech_bro_noah:           'Unlocks Rat Main Noah',
  rat_main_noah:           'Unlocks Grandmaster Twitch Noah + Royal theme',
  grandmaster_twitch_noah: 'Unlocks 4.0 GPA Noah + Obsidian theme',
  gpa_noah:                'Unlocks Devil Noah + Inferno theme',
  devil_noah:              'Unlocks Angel Noah',
  angel_noah:              'Unlocks God Noah',
  god_noah:                'You have mastered the Noah Verse.',
};

const TIERS: { label: string; ids: string[] }[] = [
  { label: 'Beginner Chaos',    ids: ['roomba_noah', 'clown_noah'] },
  { label: 'Fundamentals',      ids: ['tilted_noah', 'sleep_deprived_noah', 'gym_bro_noah'] },
  { label: 'Tactical Arena',    ids: ['coffee_shop_noah', 'tech_bro_noah', 'rat_main_noah'] },
  { label: 'Positional Masters',ids: ['grandmaster_twitch_noah', 'gpa_noah'] },
  { label: 'Final Bosses',      ids: ['devil_noah', 'angel_noah', 'god_noah'] },
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

interface FightTarget { personaId: PersonaId; name: string; elo: number }

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

  const personaMap = Object.fromEntries(PERSONAS.map(p => [p.id, p]));

  return (
    <main className="h-full overflow-y-auto bg-zinc-950 text-white">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">← Back</Link>
          <div>
            <h1 className="text-2xl font-bold">Campaign</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Defeat each Noah to climb the ladder</p>
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
            {TIERS.map((tier, tierIdx) => (
              <div key={tier.label}>
                {/* Tier header */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{tier.label}</span>
                  <div className="flex-1 h-px bg-zinc-800" />
                </div>

                {/* Persona cards */}
                <div className="flex flex-col">
                  {tier.ids.map((id, cardIdx) => {
                    const persona = personaMap[id];
                    if (!persona) return null;
                    const globalIdx = PERSONAS.findIndex(p => p.id === id);
                    const status = progress[id] ?? (globalIdx === 0 ? 'available' : 'locked');
                    const isLocked = status === 'locked';
                    const isAvailable = status === 'available';

                    return (
                      <div key={id}>
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
                                  {LESSON_FOCUS[persona.id]}
                                </p>
                              )}
                            </div>

                            {/* Action */}
                            {isAvailable && (
                              <button
                                onClick={() => setFightTarget({ personaId: persona.id as PersonaId, name: persona.name, elo: persona.elo })}
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

                        {/* Connector line between cards */}
                        {cardIdx < tier.ids.length - 1 && (
                          <div className="flex justify-center py-1">
                            <div className={`w-px h-4 ${
                              progress[id] === 'complete' && progress[tier.ids[cardIdx + 1]] !== 'locked'
                                ? 'bg-emerald-700'
                                : 'bg-zinc-800'
                            }`} />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Connector between tiers */}
                  {tierIdx < TIERS.length - 1 && (
                    <div className="flex justify-center py-1">
                      <div className="w-px h-4 bg-zinc-800" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {fightTarget && (
        <BossFightModal
          personaId={fightTarget.personaId}
          info={{
            name:     fightTarget.name,
            elo:      fightTarget.elo,
            lesson:   LESSON_FOCUS[fightTarget.personaId] ?? '',
            watchOut: WATCH_OUT[fightTarget.personaId] ?? '',
            reward:   UNLOCK_REWARD[fightTarget.personaId] ?? '',
          }}
          onClose={() => setFightTarget(null)}
        />
      )}
    </main>
  );
}
