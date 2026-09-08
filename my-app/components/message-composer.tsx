'use client';
import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { MAX_MESSAGE_CHARACTERS, MAX_SENDER_CHARACTERS, messagePath } from '@/lib/message-link';
import { languageName } from '@/lib/languages';
import { Icon, LanguageSelect, Modal } from '@/components/wyd-ui';
import TranslatedMessage from '@/components/translated-message';

export default function MessageComposer({ language }: { language: string }) {
  const ko = language === 'ko';
  const es = language === 'es';
  const [source, setSource] = useState(language);
  const [target, setTarget] = useState(language === 'en' ? 'ko' : 'en');
  const [sender, setSender] = useState('');
  const [text, setText] = useState('');
  const [preview, setPreview] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [canShare, setCanShare] = useState(false);
  const linkRef = useRef<HTMLInputElement>(null);
  const size = Array.from(text).length;
  const valid = Boolean(text.trim()) && size <= MAX_MESSAGE_CHARACTERS && Array.from(sender).length <= MAX_SENDER_CHARACTERS;
  useEffect(() => { setCanShare(typeof navigator.share === 'function'); }, []);
  function createQr() {
    if (!valid) return;
    try {
      setShareUrl(`${window.location.origin}${messagePath({ source, sender, text })}`);
      setFeedback(''); setError('');
    } catch { setError(ko ? '내용을 조금 줄인 뒤 다시 만들어주세요.' : 'Please shorten the message and try again.'); }
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(shareUrl); setFeedback(ko ? '링크를 복사했어요.' : es ? 'Enlace copiado.' : 'Link copied.'); }
    catch { linkRef.current?.focus(); linkRef.current?.select(); setFeedback(ko ? '아래 링크를 길게 눌러 복사해주세요.' : 'Select and copy the link below.'); }
  }
  async function share() {
    try { await navigator.share({ title: 'WYD Messenger', url: shareUrl }); }
    catch (error) { if (!(error instanceof Error && error.name === 'AbortError')) setFeedback(ko ? '공유가 열리지 않으면 링크를 복사해주세요.' : 'Copy the link if sharing is unavailable.'); }
  }
  return <section id="write" className="wyd-composer wyd-card" aria-labelledby="composer-title">
    <header className="wyd-section-heading"><span className="wyd-step">02</span><div><h2 id="composer-title">{ko ? '내 메시지 전달하기' : es ? 'Comparte tu mensaje' : 'Share your message'}</h2><p>{ko ? '한 번 쓰고, 각자의 언어로 읽어요.' : es ? 'Escribe una vez. Cada persona elige su idioma.' : 'Write once. Everyone reads in their language.'}</p></div><Icon name="write"/></header>
    <div className="wyd-compose-fields">
      <div className="wyd-field-pair"><LanguageSelect value={source} label={ko ? '작성 언어' : es ? 'Idioma original' : 'Writing language'} onChange={(value) => { setSource(value); setPreview(false); }}/><div><label htmlFor="sender-name" className="wyd-label">{ko ? '보내는 이름' : es ? 'Tu nombre' : 'Your name'} <span className="wyd-optional">{ko ? '선택' : es ? 'Opcional' : 'Optional'}</span></label><input id="sender-name" value={sender} autoComplete="nickname" maxLength={MAX_SENDER_CHARACTERS} placeholder={ko ? '예: 성우' : es ? 'Tu nombre' : 'Your name'} onChange={(event) => setSender(event.target.value)} className="wyd-input"/></div></div>
      <label htmlFor="message-text" className="wyd-label">{ko ? '전달할 내용' : es ? 'Mensaje' : 'Message'}</label>
      <textarea id="message-text" className="wyd-textarea" rows={5} value={text} maxLength={MAX_MESSAGE_CHARACTERS * 2} dir="auto" onChange={(event) => { setText(event.target.value); setPreview(false); setError(''); }} aria-describedby="message-limit" placeholder={ko ? '예: 만나서 반가워요!\n오후 3시에 성당 입구에서 만나요.' : es ? '¡Encantado de conocerte!\nNos vemos a las 15:00 en la entrada de la iglesia.' : 'It’s lovely to meet you!\nLet’s meet at the church entrance at 3 PM.'}/>
      <div className="wyd-input-meta"><span>{ko ? '짧은 인사부터 집결 안내까지' : es ? 'Saludos, indicaciones y recordatorios' : 'Greetings, directions, and meeting details'}</span><span id="message-limit" className={size > MAX_MESSAGE_CHARACTERS ? 'wyd-over-limit' : ''}>{size} / {MAX_MESSAGE_CHARACTERS}{ko ? '자' : ''}</span></div>
      <div className="wyd-preview-controls"><LanguageSelect value={target} onChange={(value) => { setTarget(value); setPreview(false); }} label={ko ? '미리 볼 번역 언어' : es ? 'Idioma de vista previa' : 'Preview language'}/><button type="button" className="wyd-button wyd-button-secondary" disabled={!valid} onClick={() => setPreview(true)}>{ko ? '번역 미리보기' : es ? 'Ver traducción' : 'Preview translation'}</button></div>
      {preview && <div className="wyd-preview-result"><p className="wyd-result-label">{languageName(source)} <span aria-hidden="true">→</span> {languageName(target)}</p><TranslatedMessage text={text.trim()} source={source} target={target}/></div>}
      {error && <p className="wyd-error" role="alert">{error}</p>}
      <button type="button" className="wyd-button wyd-button-primary wyd-create-qr" disabled={!valid} onClick={createQr}><Icon name="scan" size={20}/>{ko ? '메시지 QR 만들기' : es ? 'Crear QR del mensaje' : 'Create message QR'}<Icon name="arrow" size={20}/></button>
      <p className="wyd-field-note">{ko ? '상대방은 QR을 열고 읽을 언어를 선택해요.' : es ? 'Quien recibe el QR puede elegir su idioma.' : 'The recipient opens your QR and chooses their language.'}</p>
    </div>
    {shareUrl && <Modal title={ko ? '이 QR을 보여주세요' : es ? 'Comparte este QR' : 'Show this QR'} closeLabel={ko ? '닫기' : 'Close'} onClose={() => setShareUrl('')}>
      <p className="wyd-muted">{ko ? '휴대폰 카메라나 WYD QR 스캔으로 열 수 있어요.' : es ? 'Ábrelo con la cámara del teléfono o el escáner de WYD.' : 'Open it with a phone camera or the WYD scanner.'}</p>
      <div className="wyd-qr-code"><QRCodeSVG value={shareUrl} size={360} level="M" marginSize={4} title={ko ? '메시지를 여는 QR 코드' : 'QR code to open your message'}/></div>
      <a className="wyd-button wyd-button-secondary wyd-full" href={shareUrl} target="_blank" rel="noopener noreferrer">{ko ? '상대방 화면 미리보기' : es ? 'Ver como destinatario' : 'Preview recipient’s screen'}<Icon name="arrow" size={18}/></a>
      <div className="wyd-share-actions"><button type="button" className="wyd-button wyd-button-primary" onClick={copyLink}><Icon name="link" size={18}/>{ko ? '링크 복사' : es ? 'Copiar enlace' : 'Copy link'}</button>{canShare && <button type="button" className="wyd-button wyd-button-secondary" onClick={share}>{ko ? '공유하기' : es ? 'Compartir' : 'Share'}</button>}</div>
      {feedback && <p className="wyd-feedback" role="status">{feedback}</p>}
      <label htmlFor="message-link" className="wyd-label">{ko ? '메시지 링크' : es ? 'Enlace del mensaje' : 'Message link'}</label><input ref={linkRef} id="message-link" className="wyd-input wyd-link-input" readOnly value={shareUrl} onFocus={(event) => event.target.select()}/>
      <p className="wyd-field-note">{ko ? 'QR이나 링크를 가진 사람은 내용을 볼 수 있어요. 보낸 메시지는 수정하거나 회수할 수 없어요.' : es ? 'Cualquier persona con el enlace puede leer el mensaje. Una vez compartido, no se puede editar ni retirar.' : 'Anyone with this link can read the message. A shared message cannot be edited or recalled.'}</p>
    </Modal>}
  </section>;
}
