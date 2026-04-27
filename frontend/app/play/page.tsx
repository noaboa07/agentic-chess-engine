'use client';

import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '../context/AuthContext';
import { useGame, PERSONAS, type PersonaId, type TimeControl } from '../context/GameContext';
import { useAchievements } from '../context/AchievementContext';
import { completePersona, unlockPersona, getCampaignProgress } from '../../lib/db';
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
  const { awardAchievement } = useAchievements();
  const { setPersona, setTimeControl, setTeachMode, coachReport, dismissCoachReport, gameOverPending } = useGame();
  const campaignUpdatedRef = useRef(false);

  // Auto-start game when arriving from campaign page
  useEffect(() => {
    if (!campaignPersonaId) return;
    setPersona(campaignPersonaId);
    setTimeControl(null);
    setTeachMode(false);
    setPhase('game');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update campaign progress and award achievements on campaign win
  useEffect(() => {
    if (!campaignPersonaId || !user || !gameOverPending || campaignUpdatedRef.current) return;
    if (gameOverPending.result !== 'win') return;
    campaignUpdatedRef.current = true;
    const idx = PERSONAS.findIndex(p => p.id === campaignPersonaId);
    const next = PERSONAS[idx + 1];
    void (async () => {
      await Promise.all([
        completePersona(user.id, campaignPersonaId),
        next ? unlockPersona(user.id, next.id) : Promise.resolve(),
      ]);
      void awardAchievement(user.id, 'boss_slayer');
      if (campaignPersonaId === 'dread_hades') void awardAchievement(user.id, 'god_slayer');
      try {
        const progress = await getCampaignProgress(user.id);
        const completed = Object.values(progress).filter(s => s === 'complete').length;
        if (completed >= 5) void awardAchievement(user.id, 'ladder_climber');
      } catch {
        // Non-fatal — achievement check failure doesn't break campaign flow
      }
    })();
  }, [gameOverPending, campaignPersonaId, user, awardAchievement]);

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
