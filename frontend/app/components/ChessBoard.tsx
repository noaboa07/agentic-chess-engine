'use client';

import { useState, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import { useGame } from '../context/GameContext';

export default function ChessBoard() {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const { submitMove, isAnalyzing } = useGame();

  const onPieceDrop = useCallback(
    (sourceSquare: Square, targetSquare: Square): boolean => {
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

      const moveUci = `${move.from}${move.to}${move.promotion ?? ''}`;
      void submitMove(prevFen, moveUci);

      return true;
    },
    [game, submitMove],
  );

  return (
    <div className="w-full max-w-[560px]">
      <div className={`transition-opacity duration-200 ${isAnalyzing ? 'opacity-70' : 'opacity-100'}`}>
        <Chessboard
          position={fen}
          onPieceDrop={onPieceDrop}
          boardWidth={560}
          customBoardStyle={{ borderRadius: '4px', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}
        />
      </div>
      {isAnalyzing && (
        <p className="mt-2 text-center text-xs text-zinc-400 animate-pulse">Analyzing…</p>
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
