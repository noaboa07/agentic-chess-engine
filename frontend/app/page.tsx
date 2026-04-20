import dynamic from 'next/dynamic';
import CoachPanel from './components/CoachPanel';
import { GameProvider } from './context/GameContext';

const ChessBoard = dynamic(() => import('./components/ChessBoard'), { ssr: false });

export default function HomePage() {
  return (
    <GameProvider>
      <main className="flex min-h-screen items-center justify-center gap-8 bg-zinc-950 p-8">
        <ChessBoard />
        <CoachPanel />
      </main>
    </GameProvider>
  );
}
