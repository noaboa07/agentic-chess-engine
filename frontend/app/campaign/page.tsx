'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../context/AuthContext';
import { PERSONAS } from '../context/GameContext';
import { getCampaignProgress, type CampaignStatus } from '../../lib/db';

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

const UNLOCK_REWARD: Record<string, string> = {
  roomba_noah:             'Unlocks: Clown Noah',
  clown_noah:              'Unlocks: Tilted Noah + Forest theme',
  tilted_noah:             'Unlocks: Sleep-Deprived Noah + Slate theme',
  sleep_deprived_noah:     'Unlocks: Gym Bro Noah + Rose theme',
  gym_bro_noah:            'Unlocks: Coffee Shop Noah + Gold Rush theme',
  coffee_shop_noah:        'Unlocks: Tech Bro Noah + Ice theme',
  tech_bro_noah:           'Unlocks: Rat Main Noah',
  rat_main_noah:           'Unlocks: Grandmaster Twitch Noah + Royal theme',
  grandmaster_twitch_noah: 'Unlocks: 4.0 GPA Noah + Obsidian theme',
  gpa_noah:                'Unlocks: Devil Noah + Inferno theme',
  devil_noah:              'Unlocks: Angel Noah',
  angel_noah:              'Unlocks: God Noah',
  god_noah:                'You have mastered the Noah Verse.',
};

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

export default function CampaignPage() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<Record<string, CampaignStatus>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getCampaignProgress(user.id)
      .then(setProgress)
      .catch(() => setProgress({}))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
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
          <div className="flex flex-col gap-3">
            {PERSONAS.map((persona, idx) => {
              const status = progress[persona.id] ?? (idx === 0 ? 'available' : 'locked');
              const isLocked = status === 'locked';
              const isAvailable = status === 'available';

              return (
                <div
                  key={persona.id}
                  className={`rounded-2xl border p-4 transition-all ${
                    isLocked
                      ? 'border-zinc-800 bg-zinc-900/40 opacity-60'
                      : status === 'complete'
                      ? 'border-emerald-800/50 bg-emerald-950/20'
                      : 'border-indigo-800/50 bg-zinc-900'
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
                        Lesson: {LESSON_FOCUS[persona.id]}
                      </p>
                      {!isLocked && (
                        <p className="text-[11px] text-zinc-600 mt-0.5">
                          {UNLOCK_REWARD[persona.id]}
                        </p>
                      )}
                    </div>

                    {/* Action */}
                    {isAvailable && (
                      <Link
                        href={`/play?campaign=${persona.id}`}
                        className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors whitespace-nowrap"
                      >
                        Challenge
                      </Link>
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
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
