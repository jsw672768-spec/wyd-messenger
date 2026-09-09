'use client';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

let client: SupabaseClient | null = null;
let pending: Promise<string> | null = null;
let securityReady = false;

export function getSupabaseBrowser(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!client) client = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    global: { fetch: (input, init) => {
      const target = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
      if (!securityReady && target.pathname.startsWith('/rest/v1/') && target.pathname !== '/rest/v1/rpc/wyd_security_version') {
        return Promise.resolve(Response.json({ message: 'WYD security configuration pending', code: 'WYD_NOT_READY' }, { status: 503 }));
      }
      return fetch(input, init);
    } },
  });
  return client;
}

/** UI identity comes from Supabase Auth. Database RLS must still verify auth.uid().
 * Legacy wyd_sender_id values are deliberately never read, adopted or deleted.
 */
export async function ensureWydIdentity(): Promise<string> {
  if (pending) return pending;
  pending = (async () => {
    const db = getSupabaseBrowser();
    if (!db) throw new Error('행사 서비스 연결을 준비하고 있어요.');
    const session = await db.auth.getSession();
    if (session.error) throw new Error('참가자 인증을 확인하지 못했어요. 다시 시도해주세요.');
    if (!session.data.session) {
      const signed = await db.auth.signInAnonymously();
      if (signed.error) throw new Error('참가자 인증을 시작하지 못했어요. 운영자에게 연결 설정을 확인해주세요.');
    }
    const verified = await db.auth.getUser();
    if (verified.error || !verified.data.user) throw new Error('인증 연결이 끊겼어요. 다시 시도해주세요.');
    const contract = await db.rpc('wyd_security_version');
    if (contract.error || contract.data !== 1) throw new Error('행사 권한 설정을 준비하고 있어요. 잠시 후 다시 시도해주세요.');
    securityReady = true;
    return verified.data.user.id;
  })().finally(() => { pending = null; });
  return pending;
}

export function useWydIdentity() {
  const [senderId, setSenderId] = useState('');
  const [authError, setAuthError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const db = getSupabaseBrowser();
    if (!db) return;
    let active = true;
    ensureWydIdentity().then(id => {
      if (active) { setSenderId(id); setAuthError(''); }
    }).catch(error => { if (active) { setSenderId(''); setAuthError(error.message); } });
    const { data } = db.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT' && active) { securityReady = false; setSenderId(''); setAuthError('인증 연결이 끊겼어요. 다시 시도해주세요.'); }
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [attempt]);
  useEffect(() => {
    const retry = () => setAttempt(value => value + 1);
    window.addEventListener('wyd-auth-retry', retry);
    return () => window.removeEventListener('wyd-auth-retry', retry);
  }, []);
  return { senderId, authError, retryAuth: () => window.dispatchEvent(new Event('wyd-auth-retry')) };
}
