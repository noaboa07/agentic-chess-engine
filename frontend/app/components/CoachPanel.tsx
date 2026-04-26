'use client';

import { useEffect, useRef, useState } from 'react';
import { useGame, type Evaluation, type MoveClassification } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import LeaderboardModal from './LeaderboardModal';
import WeaknessPanel from './WeaknessPanel';
import DebatePanel from './DebatePanel';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

type BackendStatus = 'checking' | 'online' | 'offline';

const classificationStyles: Record<MoveClassification, string> = {
  brilliant: 'text-cyan-400',
  great:     'text-emerald-400',
  good:      'text-green-400',
  inaccuracy:'text-yellow-400',
  mistake:   'text-orange-400',
  blunder:   'text-red-400',
};

function EvalDisplay({ evaluation }: { evaluation: Evaluation }) {
  if (evaluation.type === 'mate') {
    return <span className="text-sm font-mono text-purple-400">M{Math.abs(evaluation.value)}</span>;
  }
  const cp = evaluation.value;
  const display = cp > 0 ? `+${(cp / 100).toFixed(2)}` : (cp / 100).toFixed(2);
  const color = cp > 50 ? 'text-white' : cp < -50 ? 'text-zinc-400' : 'text-zinc-300';
  return <span className={`text-sm font-mono ${color}`}>{display}</span>;
}

function MuteIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 3.586L7.707 8.879A1 1 0 017 9.172H4a1 1 0 00-1 1v3.656a1 1 0 001 1h3a1 1 0 01.707.293L13 20.414V3.586zM16.243 7.757a1 1 0 011.414 1.414L16.414 10.4l1.243 1.243a1 1 0 01-1.414 1.414L15 11.814l-1.243 1.243a1 1 0 01-1.414-1.414L13.586 10.4l-1.243-1.229a1 1 0 011.414-1.414L15 8.986l1.243-1.229z"/>
    </svg>
  );
}

function SoundIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 3.586L7.707 8.879A1 1 0 017 9.172H4a1 1 0 00-1 1v3.656a1 1 0 001 1h3a1 1 0 01.707.293L13 20.414V3.586zM15.536 8.464a5 5 0 010 7.072 1 1 0 01-1.414-1.414 3 3 0 000-4.244 1 1 0 011.414-1.414zM17.657 6.343a8 8 0 010 11.314 1 1 0 01-1.414-1.414 6 6 0 000-8.486 1 1 0 011.414-1.414z"/>
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

interface CoachPanelProps {
  onLeaveGame?: () => void;
}

export default function CoachPanel({ onLeaveGame }: CoachPanelProps = {}) {
  const [status, setStatus] = useState<BackendStatus>('checking');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { signOut } = useAuth();
  const {
    evaluation, lastClassification, bestMove, coachMessage,
    isAnalyzing, teachMode, lastMoveContext, requestHint,
    globalMuted, setGlobalMuted, moveCount, resignGame,
    explainMessage, isExplaining,
  } = useGame();

  // TTS playback — gated by teach mode and global mute
  useEffect(() => {
    if (!coachMessage || globalMuted || !teachMode) return;
    const play = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: coachMessage }),
        });
        if (!res.ok) return;
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        if (audioRef.current) {
          audioRef.current.pause();
          URL.revokeObjectURL(audioRef.current.src);
        }
        audioRef.current = new Audio(url);
        void audioRef.current.play();
      } catch {
        // TTS failure is non-fatal
      }
    };
    void play();
  }, [coachMessage, globalMuted, teachMode]);

  // Stop TTS immediately when globally muted
  useEffect(() => {
    if (globalMuted && audioRef.current) {
      audioRef.current.pause();
    }
  }, [globalMuted]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
    };
  }, []);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(3000) });
        setStatus(res.ok ? 'online' : 'offline');
      } catch {
        setStatus('offline');
      }
    };
    check();
  }, []);

  const statusColor: Record<BackendStatus, string> = {
    checking: 'bg-yellow-500',
    online: 'bg-green-500',
    offline: 'bg-red-500',
  };

  return (
    <div className="flex flex-col h-full w-full rounded-lg border border-white/10 bg-zinc-900 p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">AI Coach</h2>
          {moveCount > 0 && (
            <button
              onClick={() => void resignGame()}
              className="rounded px-2 py-0.5 text-xs font-medium text-red-400 border border-red-400/30 hover:bg-red-400/10 hover:border-red-400/60 transition-colors"
            >
              Resign
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Global mute — kills music + TTS */}
          <button
            onClick={() => setGlobalMuted(!globalMuted)}
            className={`transition-colors ${globalMuted ? 'text-red-400 hover:text-red-300' : 'text-zinc-400 hover:text-zinc-200'}`}
            title={globalMuted ? 'Unmute all sound' : 'Mute all sound'}
          >
            {globalMuted ? <MuteIcon /> : <SoundIcon />}
          </button>
          <button
            onClick={() => void signOut()}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Sign out"
          >
            <SignOutIcon />
          </button>
          {/* Status dot */}
          <span className="flex items-center gap-2 text-xs text-zinc-400">
            <span className={`h-2 w-2 rounded-full ${statusColor[status]}`} />
            {status === 'checking' ? 'Connecting…' : status === 'online' ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Leave game */}
      {onLeaveGame && (
        <button
          onClick={onLeaveGame}
          className="mb-4 w-full rounded-md border border-white/10 bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
        >
          ← Change Opponent
        </button>
      )}

      {/* Analysis area */}
      {isAnalyzing ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-zinc-400 animate-pulse">Analyzing position…</p>
        </div>
      ) : evaluation ? (
        <div className="flex flex-col gap-3">
          {teachMode && coachMessage && (
            <div className="rounded-md bg-zinc-800 px-4 py-3">
              <p className="text-xs text-zinc-400 uppercase tracking-wide mb-2">Coach</p>
              <p className="text-sm text-zinc-100 leading-relaxed">{coachMessage}</p>
            </div>
          )}
          <div className="flex items-center justify-between rounded-md bg-zinc-800 px-4 py-3">
            <span className="text-xs text-zinc-400 uppercase tracking-wide">Evaluation</span>
            <EvalDisplay evaluation={evaluation} />
          </div>
          {lastClassification && (
            <div className="flex items-center justify-between rounded-md bg-zinc-800 px-4 py-3">
              <span className="text-xs text-zinc-400 uppercase tracking-wide">Last Move</span>
              <span className={`text-sm font-medium capitalize ${classificationStyles[lastClassification]}`}>
                {lastClassification}
              </span>
            </div>
          )}
          {teachMode && bestMove && (
            <div className="flex items-center justify-between rounded-md bg-zinc-800 px-4 py-3">
              <span className="text-xs text-zinc-400 uppercase tracking-wide">Best Move</span>
              <span className="text-sm font-mono text-zinc-200">{bestMove}</span>
            </div>
          )}
          {teachMode && lastMoveContext && (
            <button
              onClick={() => void requestHint()}
              className="mt-1 w-full rounded-md bg-zinc-700 px-4 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-600 transition-colors"
            >
              Explain last move
            </button>
          )}
          {teachMode && (isExplaining || explainMessage) && (
            <div className="rounded-md border border-sky-500/25 bg-sky-950/40 px-4 py-3">
              <p className="text-[10px] text-sky-400 uppercase tracking-wide mb-1.5">Why Not?</p>
              {isExplaining ? (
                <p className="text-xs text-zinc-400 animate-pulse">Analyzing candidate move…</p>
              ) : (
                <p className="text-xs text-zinc-200 leading-relaxed">{explainMessage}</p>
              )}
            </div>
          )}
          {teachMode && <DebatePanel />}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-zinc-500 text-center">
            {teachMode ? 'Make a move to see analysis.' : 'Teach Mode is off — playing fast chess.'}
          </p>
        </div>
      )}
      {/* Footer */}
      <div className="mt-auto pt-4 flex flex-col gap-2">
        <WeaknessPanel />
        <button
          onClick={() => setShowLeaderboard(true)}
          className="w-full rounded-md bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
        >
          Global Leaderboard
        </button>
      </div>

      {showLeaderboard && <LeaderboardModal onClose={() => setShowLeaderboard(false)} />}
    </div>
  );
}
