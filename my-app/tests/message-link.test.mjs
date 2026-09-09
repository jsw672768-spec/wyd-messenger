import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QRCodeSVG } from 'qrcode.react';
import { encodeMessage, decodeMessage, messagePath, MAX_MESSAGE_CHARACTERS, MAX_MESSAGE_TOKEN_LENGTH } from '../lib/message-link.ts';
import { joinPath } from '../lib/join-path.ts';

test('a shared QR link retains multilingual content, emoji, line breaks, and the source language', () => {
  const message = { source: 'ko', sender: '성우 🌍', text: '안녕하세요!\n성당에서 만나요. 👨‍👩‍👧‍👦\nHello · Español · 日本語 · 中文' };
  const url = new URL(messagePath(message), 'https://wyd.example');
  assert.deepEqual(decodeMessage(url.hash.slice(1)), message);
  assert.equal(url.search, '');
  assert.equal(url.pathname, '/message');
  assert.equal(joinPath(url.toString()), messagePath(message));
  assert.equal(joinPath(`https://another.example${url.pathname}/?ignored=1${url.hash}`), messagePath(message));
});
test('malformed or oversized fragments, invalid payloads, and executable links are rejected', () => {
  const tokenFor = (payload) => Buffer.from(JSON.stringify(payload)).toString('base64url');
  const invalid = ['', '***', 'x'.repeat(MAX_MESSAGE_TOKEN_LENGTH + 1), '_w', 'A', tokenFor([2, 'ko', '', 'hello']), tokenFor([1, 'zz', '', 'hello']), tokenFor([1, 'ko', '', ' ']), tokenFor([1, 'ko', 12, 'hello']), tokenFor([1, 'ko', '', {}]), tokenFor([1, 'ko', '', 'x'.repeat(MAX_MESSAGE_CHARACTERS + 1)]), tokenFor([1, 'ko', '', 'hello', 'extra'])];
  for (const token of invalid) { assert.equal(decodeMessage(token), null); assert.equal(joinPath(`/message#${token}`), null); }
  assert.equal(joinPath('javascript:alert(1)'), null);
  assert.equal(joinPath('/message?text=hello'), null);
  assert.equal(joinPath('/message/other#abc'), null);
});
test('maximum-size Unicode messages produce a QR with a real quiet zone', () => {
  const message = { source: 'ko', sender: '🌍'.repeat(30), text: '😀'.repeat(MAX_MESSAGE_CHARACTERS) };
  const token = encodeMessage(message);
  assert.ok(token.length <= MAX_MESSAGE_TOKEN_LENGTH);
  assert.deepEqual(decodeMessage(token), message);
  const qr = renderToStaticMarkup(React.createElement(QRCodeSVG, { value: `https://${'w'.repeat(100)}.example/message#${token}`, size: 360, level: 'M', marginSize: 4 }));
  assert.match(qr, /<svg/);
  assert.match(qr, /<path/);
  assert.ok(!qr.includes('<script'));
});
test('new message support preserves existing event and room invitations', () => {
  assert.equal(joinPath('https://old.example/event/abc123?x=1'), '/event/abc123');
  assert.equal(joinPath('/room/a-b_c'), '/room/a-b_c');
  assert.equal(joinPath('/room/%2fadmin'), null);
  assert.throws(() => encodeMessage({ source: 'ko', sender: '', text: '' }));
});
