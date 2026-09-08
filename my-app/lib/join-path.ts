import { decodeMessage } from './message-link.ts';

export function joinPath(value: string): string | null {
  try {
    const url = new URL(value.trim(), 'https://wyd.invalid');
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    if (url.pathname === '/message' || url.pathname === '/message/') {
      const token = url.hash.slice(1);
      return decodeMessage(token) ? `/message#${token}` : null;
    }
    return /^\/(event|room)\/[a-zA-Z0-9_-]+\/?$/.test(url.pathname) ? url.pathname : null;
  } catch { return null; }
}
