// Messages are carried in the URL fragment; there is no message database behind this flow.
export const MESSAGE_LANGUAGES = ['ko', 'en', 'es', 'fr', 'it', 'pt', 'de', 'pl', 'ja', 'zh'] as const;
export const MAX_MESSAGE_CHARACTERS = 240;
export const MAX_SENDER_CHARACTERS = 30;
export const MAX_MESSAGE_TOKEN_LENGTH = 1600;
export type SharedMessage = { source: string; sender: string; text: string };

export function validMessage(value: unknown): value is SharedMessage {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.source === 'string' && MESSAGE_LANGUAGES.some((code) => code === item.source)
    && typeof item.sender === 'string' && Array.from(item.sender).length <= MAX_SENDER_CHARACTERS
    && typeof item.text === 'string' && Boolean(item.text.trim())
    && Array.from(item.text).length <= MAX_MESSAGE_CHARACTERS;
}

export function encodeMessage(message: SharedMessage): string {
  if (!validMessage(message)) throw new Error('Invalid message');
  const bytes = new TextEncoder().encode(JSON.stringify([1, message.source, message.sender.trim(), message.text.trim()]));
  const token = btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
  if (token.length > MAX_MESSAGE_TOKEN_LENGTH) throw new Error('Message too long');
  return token;
}

export function decodeMessage(token: string): SharedMessage | null {
  if (!token || token.length > MAX_MESSAGE_TOKEN_LENGTH || !/^[a-zA-Z0-9_-]+$/.test(token)) return null;
  try {
    const bytes = Uint8Array.from(atob(token.replaceAll('-', '+').replaceAll('_', '/')), (char) => char.charCodeAt(0));
    const payload: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (!Array.isArray(payload) || payload.length !== 4 || payload[0] !== 1) return null;
    const message = { source: payload[1], sender: payload[2], text: payload[3] };
    return validMessage(message) ? message : null;
  } catch { return null; }
}

export function messagePath(message: SharedMessage) {
  return `/message#${encodeMessage(message)}`;
}
