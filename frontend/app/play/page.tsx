'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useGame, type PersonaId, type TimeControl } from '../context/GameContext';
import LobbyScreen from '../components/LobbyScreen';
import PersonaPanel from '../components/PersonaPanel';
import CoachPanel from '../components/CoachPanel';
import CoachReportModal from '../components/CoachReportModal';

const ChessBoard = dynamic(() => import('../components/ChessBoard'), { ssr: false });

type Phase = 'lobby' | 'game';

export default function PlayPage() {
  const [phase, setPhase] = useState<Phase>('lobby');
  const [showReport, setShowReport] = useState(false);
  const router = useRouter();
  const { setPersona, setTimeControl, setTeachMode, coachReport, dismissCoachReport } = useGame();

  const handleStartGame = useCallback((
    personaId: PersonaId,
    timeControl: TimeControl | null,
    teachMode: boolean,
  ) => {
    setPersona(personaId);
    setTimeControl(timeControl);
    setTeachMode(teachMode);
    setPhase('game');
  }, [setPersona, setTimeControl, setTeachMode]);

  const handleBackToLobby = useCallback(() => {
    setPhase('lobby');
  }, []);

  const handleGoHome = useCallback(() => {
    router.push('/');
  }, [router]);

  const handleViewReport = useCallback(() => setShowReport(true), []);

  const handleCloseReport = useCallback(() => {
    setShowReport(false);
    dismissCoachReport();
  }, [dismissCoachReport]);

  if (phase === 'lobby') {
    return (
      <div className="h-full overflow-y-auto">
        <LobbyScreen onStartGame={handleStartGame} onBack={handleGoHome} />
      </div>
    );
  }

  return (
    <>
      <main className="h-full w-full flex items-stretch">
        {/* Left column: persona bar + board */}
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 min-w-0">
          <PersonaPanel />
          <ChessBoard
            onChangeOpponent={handleBackToLobby}
            onGoHome={handleGoHome}
            onViewReport={handleViewReport}
          />
        </div>
        {/* Right column: coach panel */}
        <div className="w-[340px] flex-shrink-0 flex flex-col p-4">
          <CoachPanel onLeaveGame={handleBackToLobby} />
        </div>
      </main>
      {showReport && coachReport && (
        <CoachReportModal report={coachReport} onClose={handleCloseReport} />
      )}
    </>
  );
}
