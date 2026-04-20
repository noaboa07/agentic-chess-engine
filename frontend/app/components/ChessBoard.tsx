'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import { useGame } from '../context/GameContext';

export default function ChessBoard() {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [boardLocked, setBoardLocked] = useState(false);
  const engineTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { submitMove, isAnalyzing, intensity, boardResetToken } = useGame();

  // Reset board on persona change or game conclusion (boardResetToken increments for both)
  useEffect(() => {
    if (engineTimeoutRef.current) {
      clearTimeout(engineTimeoutRef.current);
      engineTimeoutRef.current = null;
    }
    const fresh = new Chess();
    setGame(fresh);
    setFen(fresh.fen());
    setBoardLocked(false);
  }, [boardResetToken]);

  const onPieceDrop = useCallback(
    (sourceSquare: Square, targetSquare: Square): boolean => {
      if (boardLocked || isAnalyzing) return false;

      const prevFen = game.fen();
      const gameCopy = new Chess(prevFen);
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });

      if (move === null) return false;

      setGame(gameCopy);
      setFen(gameCopy.fen());
      setBoardLocked(true);

      const moveUci = `${move.from}${move.to}${move.promotion ?? ''}`;

      submitMove(prevFen, moveUci, move.san).then(result => {
        if (result?.engineMove && !gameCopy.isGameOver()) {
          engineTimeoutRef.current = setTimeout(() => {
            engineTimeoutRef.current = null;
            const afterEngine = new Chess(gameCopy.fen());
            const engineMoveResult = afterEngine.move(result.engineMove!);
            if (engineMoveResult) {
              setGame(afterEngine);
              setFen(afterEngine.fen());
            }
            setBoardLocked(false);
          }, 400);
        } else {
          setBoardLocked(false);
        }
      });

      return true;
    },
    [game, submitMove, boardLocked, isAnalyzing],
  );

  const glowStyle: Record<typeof intensity, string> = {
    calm:     '0 4px 24px rgba(0,0,0,0.4)',
    dramatic: '0 0 40px 6px rgba(220,38,38,0.4), 0 4px 24px rgba(0,0,0,0.4)',
    hype:     '0 0 40px 6px rgba(99,102,241,0.5), 0 4px 24px rgba(0,0,0,0.4)',
  };

  const isLocked = boardLocked || isAnalyzing;

  return (
    <div className="w-full max-w-[560px]">
      <div className={`transition-opacity duration-200 ${isLocked ? 'opacity-70' : 'opacity-100'}`}>
        <Chessboard
          position={fen}
          onPieceDrop={onPieceDrop}
          boardWidth={560}
          arePiecesDraggable={!isLocked}
          customBoardStyle={{ borderRadius: '4px', boxShadow: glowStyle[intensity], transition: 'box-shadow 1s ease' }}
        />
      </div>
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
    </div>
  );
}
