'use client';

import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '../context/AuthContext';
import { useGame, PERSONAS, type PersonaId, type TimeControl } from '../context/GameContext';
import { completePersona, unlockPersona } from '../../lib/db';
import LobbyScreen from '../components/LobbyScreen';
import PersonaPanel from '../components/PersonaPanel';
import CoachPanel from '../components/CoachPanel';
import CoachReportModal from '../components/CoachReportModal';
import OnboardingOverlay from '../components/OnboardingOverlay';

const ChessBoard = dynamic(() => import('../components/ChessBoard'), { ssr: false });

type Phase = 'lobby' | 'game';

function PlayPageInner() {
  const [phase, setPhase] = useState<Phase>('lobby');
  const [showReport, setShowReport] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignPersonaId = searchParams.get('campaign') as PersonaId | null;
  const { user } = useAuth();
  const { setPersona, setTimeControl, setTeachMode, coachReport, dismissCoachReport, gameOverPending } = useGame();
  const campaignUpdatedRef = useRef(false);

  // Auto-start game when arriving from campaign page
  useEffect(() => {
    if (!campaignPersonaId) return;
    setPersona(campaignPersonaId);
    setTimeControl(null);
    setTeachMode(true);
    setPhase('game');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update campaign progress on win
  useEffect(() => {
    if (!campaignPersonaId || !user || !gameOverPending || campaignUpdatedRef.current) return;
    if (gameOverPending.result !== 'win') return;
    campaignUpdatedRef.current = true;
    const idx = PERSONAS.findIndex(p => p.id === campaignPersonaId);
    const next = PERSONAS[idx + 1];
    void Promise.all([
      completePersona(user.id, campaignPersonaId),
      next ? unlockPersona(user.id, next.id) : Promise.resolve(),
    ]);
  }, [gameOverPending, campaignPersonaId, user]);

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
    if (campaignPersonaId) { router.push('/campaign'); return; }
    setPhase('lobby');
  }, [campaignPersonaId, router]);

  const handleGoHome = useCallback(() => {
    router.push(campaignPersonaId ? '/campaign' : '/');
  }, [campaignPersonaId, router]);

  const handleViewReport = useCallback(() => setShowReport(true), []);

  const handleCloseReport = useCallback(() => {
    setShowReport(false);
    dismissCoachReport();
  }, [dismissCoachReport]);

  if (phase === 'lobby') {
    return (
      <div className="h-full overflow-y-auto">
        <OnboardingOverlay />
        <LobbyScreen onStartGame={handleStartGame} onBack={handleGoHome} />
      </div>
    );
  }

  return (
    <>
      <main className="h-full w-full flex items-stretch">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 min-w-0">
          <PersonaPanel />
          <ChessBoard
            onChangeOpponent={handleBackToLobby}
            onGoHome={handleGoHome}
            onViewReport={handleViewReport}
          />
        </div>
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

export default function PlayPage() {
  return (
    <Suspense>
      <PlayPageInner />
    </Suspense>
  );
}
