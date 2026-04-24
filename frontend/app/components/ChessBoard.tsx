'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import { useGame, type GameResult } from '../context/GameContext';
import ChessClock from './ChessClock';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
const BOARD_WIDTH = 560;
const SQUARE_SIZE = BOARD_WIDTH / 8;
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const ARROW_COLOR = 'rgba(255, 170, 0, 0.75)';
const ARROW_LINE_WIDTH = SQUARE_SIZE * 0.18;
const ARROW_HEAD_LEN  = SQUARE_SIZE * 0.44;

type ArrowTuple = [Square, Square];

// ── Sound effects ─────────────────────────────────────────────────────────────
type ChessSound = 'move-self' | 'move-opponent' | 'capture' | 'castle' | 'promote' | 'check';
const sfxCache = new Map<ChessSound, HTMLAudioElement>();

function playChessSound(name: ChessSound, muted: boolean): void {
  if (muted || typeof window === 'undefined') return;
  let audio = sfxCache.get(name);
  if (!audio) {
    audio = new Audio(`/audio/sfx/${name}.mp3`);
    sfxCache.set(name, audio);
  }
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function getMoveSound(
  flags: string,
  captured: string | undefined,
  gameAfter: Chess,
  isPlayer: boolean,
): ChessSound {
  if (flags.includes('k') || flags.includes('q')) return 'castle';
  if (flags.includes('p')) return 'promote';
  if (captured || flags.includes('e')) return 'capture';
  if (gameAfter.isCheck()) return 'check';
  return isPlayer ? 'move-self' : 'move-opponent';
}
// ─────────────────────────────────────────────────────────────────────────────

function uciToMove(uci: string) {
  return {
    from: uci.slice(0, 2) as Square,
    to: uci.slice(2, 4) as Square,
    ...(uci.length > 4 ? { promotion: uci[4] } : {}),
  };
}

// Pixel coords → square
function coordsToSquare(x: number, y: number, orientation: 'white' | 'black'): Square | null {
  const col = Math.min(7, Math.max(0, Math.floor(x / SQUARE_SIZE)));
  const row = Math.min(7, Math.max(0, Math.floor(y / SQUARE_SIZE)));
  return orientation === 'white'
    ? (`${FILES[col]}${8 - row}` as Square)
    : (`${FILES[7 - col]}${row + 1}` as Square);
}

// Square → canvas center coords
function squareToCenter(square: Square, orientation: 'white' | 'black') {
  const file = square.charCodeAt(0) - 97;
  const rank = parseInt(square[1], 10) - 1;
  const col = orientation === 'white' ? file : 7 - file;
  const row = orientation === 'white' ? 7 - rank : rank;
  return { x: col * SQUARE_SIZE + SQUARE_SIZE / 2, y: row * SQUARE_SIZE + SQUARE_SIZE / 2 };
}

function isKnightMove(from: Square, to: Square): boolean {
  const fd = Math.abs(to.charCodeAt(0) - from.charCodeAt(0));
  const rd = Math.abs(parseInt(to[1], 10) - parseInt(from[1], 10));
  return (fd === 1 && rd === 2) || (fd === 2 && rd === 1);
}

// Returns the corner square of the L-path (longer leg drawn first)
function knightElbow(from: Square, to: Square): Square {
  const fromFile = from.charCodeAt(0) - 97;
  const fromRank = parseInt(from[1], 10) - 1;
  const toFile   = to.charCodeAt(0) - 97;
  const toRank   = parseInt(to[1], 10) - 1;
  const rd = Math.abs(toRank - fromRank);
  // If rank changes by 2, go vertical first → elbow at (fromFile, toRank)
  // If file changes by 2, go horizontal first → elbow at (toFile, fromRank)
  return rd === 2
    ? (`${FILES[fromFile]}${toRank + 1}` as Square)
    : (`${FILES[toFile]}${fromRank + 1}` as Square);
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  from: Square,
  to: Square,
  orientation: 'white' | 'black',
) {
  const start = squareToCenter(from, orientation);
  const end   = squareToCenter(to, orientation);

  ctx.strokeStyle = ARROW_COLOR;
  ctx.fillStyle   = ARROW_COLOR;
  ctx.lineWidth   = ARROW_LINE_WIDTH;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';

  if (isKnightMove(from, to)) {
    const elbow    = squareToCenter(knightElbow(from, to), orientation);
    const angle    = Math.atan2(end.y - elbow.y, end.x - elbow.x);
    const tailEndX = end.x - Math.cos(angle) * ARROW_HEAD_LEN * 0.55;
    const tailEndY = end.y - Math.sin(angle) * ARROW_HEAD_LEN * 0.55;

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(elbow.x, elbow.y);
    ctx.lineTo(tailEndX, tailEndY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(end.x - ARROW_HEAD_LEN * Math.cos(angle - Math.PI / 6), end.y - ARROW_HEAD_LEN * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(end.x - ARROW_HEAD_LEN * Math.cos(angle + Math.PI / 6), end.y - ARROW_HEAD_LEN * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  } else {
    const angle    = Math.atan2(end.y - start.y, end.x - start.x);
    const tailEndX = end.x - Math.cos(angle) * ARROW_HEAD_LEN * 0.55;
    const tailEndY = end.y - Math.sin(angle) * ARROW_HEAD_LEN * 0.55;

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(tailEndX, tailEndY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(end.x - ARROW_HEAD_LEN * Math.cos(angle - Math.PI / 6), end.y - ARROW_HEAD_LEN * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(end.x - ARROW_HEAD_LEN * Math.cos(angle + Math.PI / 6), end.y - ARROW_HEAD_LEN * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }
}

export default function ChessBoard() {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [boardLocked, setBoardLocked] = useState(false);
  const [arrows, setArrows] = useState<ArrowTuple[]>([]);

  const engineTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const engineFirstMoveFiredRef = useRef(false);
  const preMovePositionsRef = useRef<string[]>([]);
  const arrowStartRef = useRef<Square | null>(null);
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastTakeBackTokenRef = useRef(0);

  const {
    submitMove, concludeGame, isAnalyzing, intensity,
    boardResetToken, playerColor, flipPlayerColor,
    moveCount, activePersona, takeBack, takeBackToken, teachMode,
    currentOpening, startClock, timeControl, globalMuted,
  } = useGame();

  const detectResult = useCallback((g: Chess): GameResult => {
    if (g.isCheckmate()) return g.turn() === 'w' ? 'loss' : 'win';
    return 'draw';
  }, []);

  // Redraw arrows on canvas whenever arrows or orientation changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, BOARD_WIDTH, BOARD_WIDTH);
    for (const [from, to] of arrows) drawArrow(ctx, from, to, playerColor);
  }, [arrows, playerColor]);

  // Reset board on new game
  useEffect(() => {
    if (engineTimeoutRef.current) { clearTimeout(engineTimeoutRef.current); engineTimeoutRef.current = null; }
    engineFirstMoveFiredRef.current = false;
    preMovePositionsRef.current = [];
    setArrows([]);
    const fresh = new Chess();
    setGame(fresh);
    setFen(fresh.fen());
    setBoardLocked(false);
  }, [boardResetToken]);

  // Restore board position on take-back
  useEffect(() => {
    if (takeBackToken === lastTakeBackTokenRef.current) return;
    lastTakeBackTokenRef.current = takeBackToken;
    if (engineTimeoutRef.current) { clearTimeout(engineTimeoutRef.current); engineTimeoutRef.current = null; }
    const restoredFen = preMovePositionsRef.current.pop();
    if (!restoredFen) return;
    const restored = new Chess(restoredFen);
    setGame(restored);
    setFen(restoredFen);
    setArrows([]);
    setBoardLocked(false);
  }, [takeBackToken]);

  // When player is black, trigger engine's opening move
  useEffect(() => {
    if (playerColor !== 'black' || moveCount > 0 || engineFirstMoveFiredRef.current) return;
    engineFirstMoveFiredRef.current = true;
    setBoardLocked(true);
    fetch(`${BACKEND_URL}/api/engine-first-move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fen: new Chess().fen(), persona: activePersona.id }),
    })
      .then(res => res.json())
      .then((data: { engine_move?: string }) => {
        if (data.engine_move) {
          const after = new Chess();
          after.move(uciToMove(data.engine_move));
          setGame(after);
          setFen(after.fen());
        }
        // Engine opened — start player's clock
        if (timeControl && timeControl.initialMs > 0) startClock(playerColor);
        setBoardLocked(false);
      })
      .catch(() => setBoardLocked(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerColor, boardResetToken]);

  const onPieceDrop = useCallback(
    (sourceSquare: Square, targetSquare: Square): boolean => {
      if (boardLocked || isAnalyzing) return false;
      const prevFen = game.fen();
      const gameCopy = new Chess(prevFen);
      const move = gameCopy.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
      if (move === null) return false;

      playChessSound(getMoveSound(move.flags, move.captured, gameCopy, true), globalMuted);

      preMovePositionsRef.current.push(prevFen);
      setArrows([]);
      setGame(gameCopy);
      setFen(gameCopy.fen());
      setBoardLocked(true);

      // Player moved — start opponent's clock immediately
      const opponentColor = playerColor === 'white' ? 'black' : 'white';
      if (timeControl && timeControl.initialMs > 0) startClock(opponentColor);

      const moveUci = `${move.from}${move.to}${move.promotion ?? ''}`;
      submitMove(prevFen, moveUci, move.san).then(result => {
        if (gameCopy.isGameOver()) { setBoardLocked(false); void concludeGame(detectResult(gameCopy)); return; }
        if (result?.engineMove) {
          engineTimeoutRef.current = setTimeout(() => {
            engineTimeoutRef.current = null;
            const afterEngine = new Chess(gameCopy.fen());
            const engineMoveResult = afterEngine.move(uciToMove(result.engineMove!));
            if (engineMoveResult) {
              playChessSound(getMoveSound(engineMoveResult.flags, engineMoveResult.captured, afterEngine, false), globalMuted);
              setGame(afterEngine);
              setFen(afterEngine.fen());
              if (afterEngine.isGameOver()) { void concludeGame(detectResult(afterEngine)); return; }
            }
            // Engine move applied — start player's clock
            if (timeControl && timeControl.initialMs > 0) startClock(playerColor);
            setBoardLocked(false);
          }, 400);
        } else {
          setBoardLocked(false);
        }
      });
      return true;
    },
    [game, submitMove, concludeGame, detectResult, boardLocked, isAnalyzing, playerColor, timeControl, startClock, globalMuted],
  );

  // Arrow drawing — right-click drag, legal moves only
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 2) return;
    const rect = boardContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    arrowStartRef.current = coordsToSquare(e.clientX - rect.left, e.clientY - rect.top, playerColor);
  }, [playerColor]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 2 || !arrowStartRef.current) return;
    const rect = boardContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const from = arrowStartRef.current;
    const to = coordsToSquare(e.clientX - rect.left, e.clientY - rect.top, playerColor);
    arrowStartRef.current = null;

    if (!to || to === from) return;

    // Only draw arrows for legal moves from that square
    const legalDestinations = new Set(
      game.moves({ square: from, verbose: true }).map(m => m.to as Square)
    );
    if (!legalDestinations.has(to)) return;

    setArrows(prev => {
      const exists = prev.findIndex(a => a[0] === from && a[1] === to);
      return exists >= 0 ? prev.filter((_, i) => i !== exists) : [...prev, [from, to]];
    });
  }, [playerColor, game]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 0 && arrows.length > 0) setArrows([]);
  }, [arrows.length]);

  const glowStyle: Record<typeof intensity, string> = {
    calm:     '0 4px 24px rgba(0,0,0,0.4)',
    dramatic: '0 0 40px 6px rgba(220,38,38,0.4), 0 4px 24px rgba(0,0,0,0.4)',
    hype:     '0 0 40px 6px rgba(99,102,241,0.5), 0 4px 24px rgba(0,0,0,0.4)',
  };

  const isLocked = boardLocked || isAnalyzing;
  const playerPiecePrefix = playerColor === 'white' ? 'w' : 'b';

  return (
    <div className="w-full max-w-[560px]">
      {moveCount === 0 && (
        <button
          onClick={flipPlayerColor}
          className="mb-2 flex items-center gap-1.5 rounded-md bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
        >
          ⇅ Flip Board — playing as <span className="font-semibold text-white capitalize ml-1">{playerColor}</span>
        </button>
      )}

      <ChessClock>
        <div
          ref={boardContainerRef}
          className={`relative select-none transition-opacity duration-200 ${isLocked ? 'opacity-70' : 'opacity-100'}`}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onClick={handleClick}
          onContextMenu={e => e.preventDefault()}
        >
          <Chessboard
            position={fen}
            onPieceDrop={onPieceDrop}
            boardOrientation={playerColor}
            boardWidth={BOARD_WIDTH}
            isDraggablePiece={({ piece }) => !isLocked && piece.startsWith(playerPiecePrefix)}
            areArrowsAllowed={false}
            customBoardStyle={{ borderRadius: '4px', boxShadow: glowStyle[intensity], transition: 'box-shadow 1s ease' }}
          />
          <canvas
            ref={canvasRef}
            width={BOARD_WIDTH}
            height={BOARD_WIDTH}
            className="absolute inset-0 pointer-events-none"
          />
        </div>
      </ChessClock>

      {currentOpening && (
        <p className="mt-2 text-center text-[10px] text-zinc-400 bg-zinc-800/60 rounded px-2 py-1 truncate">
          {currentOpening}
        </p>
      )}
      {isLocked && (
        <p className="mt-2 text-center text-xs text-zinc-400 animate-pulse">
          {isAnalyzing ? 'Analyzing…' : 'Opponent is thinking…'}
        </p>
      )}
      {game.isGameOver() && (
        <p className="mt-3 text-center text-sm font-medium text-red-400">
          Game over —{' '}
          {game.isCheckmate()
            ? `${game.turn() === 'w' ? 'Black' : 'White'} wins by checkmate`
            : 'Draw'}
        </p>
      )}
      {teachMode && moveCount > 0 && !isLocked && (
        <button
          onClick={takeBack}
          className="mt-2 w-full rounded-md bg-zinc-800 px-4 py-2 text-xs font-medium text-amber-400 hover:bg-zinc-700 border border-amber-400/20 hover:border-amber-400/40 transition-colors"
        >
          ↩ Take Back Move
        </button>
      )}
    </div>
  );
}
