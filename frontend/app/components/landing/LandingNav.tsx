'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

export default function LandingNav() {
  const { signOut } = useAuth();
  const [showPlayMenu, setShowPlayMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowPlayMenu(false);
      }
    }
    if (showPlayMenu) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPlayMenu]);

  return (
    <nav className="sticky top-0 z-50 h-16 flex items-center justify-between px-6 lg:px-10 border-b border-board-border bg-board-bg/85 backdrop-blur-md">
      <Link href="/" className="flex items-center gap-2 font-serif font-medium text-ink-primary hover:text-gold transition-colors">
        <span className="text-xl">♟</span>
        <span className="text-[15px]">The Noah Verse</span>
      </Link>

      <div className="flex items-center gap-5">
        <Link href="/demo" className="text-sm text-ink-secondary hover:text-ink-primary transition-colors">
          Demo
        </Link>
        <Link href="/profile" className="text-sm text-ink-secondary hover:text-ink-primary transition-colors">
          Profile
        </Link>
        <a
          href="https://github.com/noaboa07/agentic-chess-engine"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-ink-secondary hover:text-ink-primary transition-colors"
        >
          GitHub
        </a>
        <button
          onClick={() => void signOut()}
          className="text-sm text-red-400 hover:text-red-300 transition-colors"
        >
          Log out
        </button>

        {/* Play → dropdown */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setShowPlayMenu(p => !p)}
            className="bg-gold text-board-bg px-4 py-1.5 rounded-lg font-semibold text-sm hover:bg-gold/90 transition-colors"
          >
            Play →
          </button>
          {showPlayMenu && (
            <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-board-border bg-board-surface shadow-xl overflow-hidden">
              <Link
                href="/campaign"
                onClick={() => setShowPlayMenu(false)}
                className="flex items-center gap-2 px-4 py-3 text-sm text-ink-primary hover:bg-board-surface-elevated transition-colors border-b border-board-border"
              >
                <span className="text-gold">♟</span>
                Campaign
              </Link>
              <Link
                href="/play"
                onClick={() => setShowPlayMenu(false)}
                className="flex items-center gap-2 px-4 py-3 text-sm text-ink-primary hover:bg-board-surface-elevated transition-colors"
              >
                <span className="text-ink-tertiary">⚡</span>
                Free Play
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
