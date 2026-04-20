import dynamic from 'next/dynamic';
import CoachPanel from './components/CoachPanel';
import PersonaPanel from './components/PersonaPanel';
import AtmosphereBackground from './components/AtmosphereBackground';
import { AuthProvider } from './context/AuthContext';
import { GameProvider } from './context/GameContext';

const ChessBoard = dynamic(() => import('./components/ChessBoard'), { ssr: false });

export default function HomePage() {
  return (
    <AuthProvider>
      <GameProvider>
        <AtmosphereBackground>
          <main className="flex min-h-screen items-center justify-center gap-8 p-8">
            <div className="flex flex-col items-center gap-3">
              <PersonaPanel />
              <ChessBoard />
            </div>
            <CoachPanel />
          </main>
        </AtmosphereBackground>
      </GameProvider>
    </AuthProvider>
  );
}
