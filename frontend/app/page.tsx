import dynamic from 'next/dynamic';
import CoachPanel from './components/CoachPanel';

// react-chessboard references browser APIs — load it client-side only
const ChessBoard = dynamic(() => import('./components/ChessBoard'), { ssr: false });

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center gap-8 bg-zinc-950 p-8">
      <ChessBoard />
      <CoachPanel />
    </main>
  );
}
