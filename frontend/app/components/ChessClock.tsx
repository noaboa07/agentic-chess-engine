'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useGame, type PlayerColor, type GameResult } from '../context/GameContext';
import { playSfx } from '../../lib/audio';

function formatMs(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (ms < 10_000) {
    const tenths = Math.floor((ms % 1000) / 100);
    return `${minutes}:${String(seconds).padStart(2, '0')}.${tenths}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

interface ClockRowProps {
  label: string;
  ms: number;
  active: boolean;
}

function ClockRow({ label, ms, active }: ClockRowProps) {
  const isLow = ms > 0 && ms < 10_000;
  return (
    <div className={`flex items-center justify-between rounded-lg px-4 py-2 transition-colors duration-150 ${
      active ? 'bg-zinc-700' : 'bg-zinc-800/60'
    }`}>
      <span className="text-xs text-zinc-400 truncate">{label}</span>
      <span className={`font-mono text-lg font-bold tabular-nums ${
        isLow ? 'text-red-400' : active ? 'text-white' : 'text-zinc-300'
      }`}>
        {formatMs(ms)}
      </span>
    </div>
  );
}

interface ChessClockProps {
  children: ReactNode;
  onTimeout?: (result: GameResult) => void;
}

export default function ChessClock({ children, onTimeout }: ChessClockProps) {
  const {
    timeControl, clockActiveColor, playerColor,
    boardResetToken, activePersona, concludeGame, globalMuted,
  } = useGame();

  const [whiteMs, setWhiteMs] = useState(timeControl?.initialMs ?? 0);
  const [blackMs, setBlackMs] = useState(timeControl?.initialMs ?? 0);

  const prevActiveRef = useRef<PlayerColor | null>(null);
  const timeoutFiredRef = useRef(false);
  const tenSecondsPlayedRef = useRef(new Set<PlayerColor>());
  const globalMutedRef = useRef(globalMuted);
  globalMutedRef.current = globalMuted;

  // Reset clocks on new game or time control change
  useEffect(() => {
    setWhiteMs(timeControl?.initialMs ?? 0);
    setBlackMs(timeControl?.initialMs ?? 0);
    timeoutFiredRef.current = false;
    prevActiveRef.current = null;
    tenSecondsPlayedRef.current = new Set();
  }, [boardResetToken, timeControl]);

  // Apply increment to the color that just finished their turn
  useEffect(() => {
    const prev = prevActiveRef.current;
    if (prev !== null && prev !== clockActiveColor && timeControl && timeControl.incrementMs > 0) {
      if (prev === 'white') setWhiteMs(ms => ms + timeControl.incrementMs);
      else setBlackMs(ms => ms + timeControl.incrementMs);
    }
    prevActiveRef.current = clockActiveColor;
  }, [clockActiveColor, timeControl]);

  // Countdown — restarts whenever the active color switches
  useEffect(() => {
    if (!timeControl || timeControl.initialMs === 0 || clockActiveColor === null) return;
    const id = setInterval(() => {
      if (clockActiveColor === 'white') setWhiteMs(prev => Math.max(0, prev - 100));
      else setBlackMs(prev => Math.max(0, prev - 100));
    }, 100);
    return () => clearInterval(id);
  }, [clockActiveColor, timeControl]);

  // 10-second audio warning (fires once per player per game)
  useEffect(() => {
    if (!clockActiveColor || !timeControl || timeControl.initialMs === 0) return;
    const activeMs = clockActiveColor === 'white' ? whiteMs : blackMs;
    if (activeMs > 0 && activeMs <= 10_000 && !tenSecondsPlayedRef.current.has(clockActiveColor)) {
      tenSecondsPlayedRef.current.add(clockActiveColor);
      playSfx('tenseconds', globalMutedRef.current);
    }
  }, [whiteMs, blackMs, clockActiveColor, timeControl]);

  // Timeout detection
  useEffect(() => {
    if (timeoutFiredRef.current || clockActiveColor === null || !timeControl || timeControl.initialMs === 0) return;
    const activeMs = clockActiveColor === 'white' ? whiteMs : blackMs;
    if (activeMs === 0) {
      timeoutFiredRef.current = true;
      const result: GameResult = clockActiveColor === playerColor ? 'loss' : 'win';
      if (onTimeout) {
        onTimeout(result);
      } else {
        playSfx('game-end', globalMutedRef.current);
        void concludeGame(result);
      }
    }
  }, [whiteMs, blackMs, clockActiveColor, timeControl, concludeGame, playerColor, onTimeout]);

  const isTimed = !!timeControl && timeControl.initialMs > 0;
  const opponentColor: PlayerColor = playerColor === 'white' ? 'black' : 'white';
  const opponentMs = opponentColor === 'white' ? whiteMs : blackMs;
  const playerMs   = playerColor  === 'white' ? whiteMs : blackMs;

  return (
    <div className="flex flex-col gap-1 w-full">
      {isTimed && (
        <ClockRow
          label={activePersona.name}
          ms={opponentMs}
          active={clockActiveColor === opponentColor}
        />
      )}
      {children}
      {isTimed && (
        <ClockRow
          label="You"
          ms={playerMs}
          active={clockActiveColor === playerColor}
        />
      )}
    </div>
  );
}
