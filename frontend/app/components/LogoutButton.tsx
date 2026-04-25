'use client';

import { useAuth } from '../context/AuthContext';

export default function LogoutButton() {
  const { signOut } = useAuth();

  return (
    <button
      onClick={() => void signOut()}
      className="fixed bottom-6 left-6 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
    >
      Sign out
    </button>
  );
}
