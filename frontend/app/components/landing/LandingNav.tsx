'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

const NAV_CENTER = [
  { href: '/campaign',  label: 'Campaign'  },
  { href: '/play',      label: 'Free Play'  },
  { href: '/dashboard', label: 'Dashboard'  },
  { href: '/puzzles',   label: 'Puzzles'    },
  { href: '/shop',      label: 'Shop'       },
] as const;

export default function LandingNav() {
  const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    }
    if (mobileOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mobileOpen]);

  return (
    <nav ref={navRef} className="sticky top-0 z-50 border-b border-board-border bg-board-bg/85 backdrop-blur-md">
      <div className="h-16 flex items-center justify-between px-6 lg:px-10">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-serif font-medium text-ink-primary hover:text-gold transition-colors shrink-0"
        >
          <span className="text-xl">♟</span>
          <span className="text-[15px]">Caïssa</span>
        </Link>

        {/* Center links — desktop */}
        <div className="hidden lg:flex items-center gap-1">
          {NAV_CENTER.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-2 text-sm text-ink-secondary hover:text-ink-primary hover:bg-board-surface rounded-lg transition-all duration-150"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right cluster — desktop */}
        <div className="hidden lg:flex items-center gap-1">
          <Link href="/demo" className="px-3 py-2 text-sm text-ink-secondary hover:text-ink-primary hover:bg-board-surface rounded-lg transition-all duration-150">
            Demo
          </Link>
          <Link href="/profile" className="px-3 py-2 text-sm text-ink-secondary hover:text-ink-primary hover:bg-board-surface rounded-lg transition-all duration-150">
            Profile
          </Link>
          <a
            href="https://github.com/noaboa07/agentic-chess-engine"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 text-sm text-ink-secondary hover:text-ink-primary hover:bg-board-surface rounded-lg transition-all duration-150"
          >
            GitHub
          </a>
          <button
            onClick={() => void signOut()}
            className="px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all duration-150"
          >
            Log out
          </button>
          <Link
            href="/campaign"
            className="ml-2 bg-gold text-board-bg px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gold/90 transition-colors"
          >
            Play →
          </Link>
        </div>

        {/* Mobile: CTA + hamburger */}
        <div className="lg:hidden flex items-center gap-3">
          <Link
            href="/campaign"
            className="bg-gold text-board-bg px-4 py-1.5 rounded-lg font-semibold text-sm hover:bg-gold/90 transition-colors"
          >
            Play →
          </Link>
          <button
            onClick={() => setMobileOpen(p => !p)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            className="flex flex-col justify-center items-center w-8 h-8 gap-1.5 rounded-md hover:bg-board-surface transition-colors"
          >
            <span className={`block w-5 h-0.5 bg-ink-primary origin-center transition-transform duration-200 ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-ink-primary transition-opacity duration-200 ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-ink-primary origin-center transition-transform duration-200 ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-board-border bg-board-surface">
          <div className="px-6 py-5 flex flex-col gap-1">
            <p className="font-mono text-[10px] text-ink-tertiary uppercase tracking-widest px-3 mb-2">Play</p>
            <Link href="/campaign" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm text-ink-primary font-medium hover:bg-board-surface-elevated rounded-lg transition-colors">
              Campaign
            </Link>
            <Link href="/play" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm text-ink-secondary hover:text-ink-primary hover:bg-board-surface-elevated rounded-lg transition-colors">
              Free Play
            </Link>

            <div className="my-3 border-t border-board-border" />
            <p className="font-mono text-[10px] text-ink-tertiary uppercase tracking-widest px-3 mb-2">Explore</p>
            <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm text-ink-secondary hover:text-ink-primary hover:bg-board-surface-elevated rounded-lg transition-colors">Dashboard</Link>
            <Link href="/puzzles"   onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm text-ink-secondary hover:text-ink-primary hover:bg-board-surface-elevated rounded-lg transition-colors">Puzzles</Link>
            <Link href="/shop"      onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm text-ink-secondary hover:text-ink-primary hover:bg-board-surface-elevated rounded-lg transition-colors">Shop</Link>
            <Link href="/profile"   onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm text-ink-secondary hover:text-ink-primary hover:bg-board-surface-elevated rounded-lg transition-colors">Profile</Link>
            <Link href="/demo"      onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm text-ink-secondary hover:text-ink-primary hover:bg-board-surface-elevated rounded-lg transition-colors">Demo</Link>

            <div className="my-3 border-t border-board-border" />
            <div className="flex items-center justify-between px-3 py-1">
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
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
