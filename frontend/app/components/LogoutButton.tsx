'use client';

import { useAuth } from '../context/AuthContext';

export default function LogoutButton() {
  const { signOut } = useAuth();

  return (
    <button
      onClick={() => void signOut()}
      className="fixed bottom-6 left-6 rounded-lg border border-red-500/40 bg-red-600/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-600/30 hover:border-red-500/70 transition-colors"
    >
      Sign out
    </button>
  );
}
