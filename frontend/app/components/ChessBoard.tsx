'use client';

import { useState, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';

export default function ChessBoard() {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());

  const onPieceDrop = useCallback(
    (sourceSquare: Square, targetSquare: Square): boolean => {
      const gameCopy = new Chess(game.fen());
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });

      if (move === null) return false;

      setGame(gameCopy);
      setFen(gameCopy.fen());
      return true;
    },
    [game],
  );

  return (
    <div className="w-full max-w-[560px]">
      <Chessboard
        position={fen}
        onPieceDrop={onPieceDrop}
        boardWidth={560}
        customBoardStyle={{ borderRadius: '4px', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}
      />
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
