'use client';
import { useWydIdentity } from '@/lib/supabase-browser';

export default function AuthStatus() {
  const { authError, retryAuth } = useWydIdentity();
  if (!authError) return null;
  return <div role="alert" className="relative z-[800] border-b border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
    {authError} <button className="ml-2 underline" onClick={retryAuth}>다시 연결</button>
  </div>;
}
