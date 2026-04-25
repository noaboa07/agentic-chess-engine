import { GameProvider } from '../context/GameContext';
import AtmosphereBackground from '../components/AtmosphereBackground';
import type { ReactNode } from 'react';

export default function PlayLayout({ children }: { children: ReactNode }) {
  return (
    <GameProvider>
      <AtmosphereBackground>
        {children}
      </AtmosphereBackground>
    </GameProvider>
  );
}
