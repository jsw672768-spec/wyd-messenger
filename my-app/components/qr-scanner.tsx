'use client';
import { useEffect, useId, useState } from 'react';
import type { Html5Qrcode } from 'html5-qrcode';
import { joinPath } from '@/lib/join-path';
import { Modal } from '@/components/wyd-ui';

export default function QrScanner({ language, onClose, onDetected }: { language: string; onClose: () => void; onDetected: (path: string) => void }) {
  const id = `wyd-camera-${useId().replaceAll(':', '')}`;
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const ko = language === 'ko';
  const es = language === 'es';
  useEffect(() => {
    let cancelled = false;
    let accepted = false;
    let scanner: Html5Qrcode | null = null;
    async function release() {
      try { if (scanner?.isScanning) await scanner.stop(); scanner?.clear(); } catch {}
    }
    async function start() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled) return;
        scanner = new Html5Qrcode(id);
        await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: (width, height) => { const size = Math.floor(Math.min(width, height) * 0.8); return { width: size, height: size }; } }, (value) => {
          if (cancelled || accepted) return;
          const path = joinPath(value);
          if (!path) { setError(ko ? 'WYD 메시지·행사·채팅방 QR을 스캔해주세요.' : es ? 'Escanea un QR de mensaje, evento o sala de WYD.' : 'Scan a WYD message, event, or room QR.'); return; }
          accepted = true;
          onDetected(path);
        }, () => {});
        if (cancelled) await release(); else setReady(true);
      } catch {
        if (!cancelled) setError(ko ? '카메라를 열 수 없어요. 카메라 권한을 허용하거나 홈에서 링크로 열어주세요.' : es ? 'No se pudo abrir la cámara. Permite el acceso o abre el enlace desde Inicio.' : 'Camera unavailable. Allow camera access or open an invitation link from Home.');
      }
    }
    void start();
    return () => { cancelled = true; void release(); };
  }, [id, ko, es, onDetected]);
  return <Modal title={ko ? 'QR 스캔' : es ? 'Escanear QR' : 'Scan QR'} closeLabel={ko ? '닫기' : es ? 'Cerrar' : 'Close'} onClose={onClose}>
    <p className="wyd-muted">{ko ? 'WYD QR 코드를 카메라 안에 맞춰주세요.' : es ? 'Coloca el QR de WYD dentro de la vista de la cámara.' : 'Place a WYD QR code inside the camera view.'}</p>
    <div className="wyd-camera" id={id}/>
    {!ready && !error && <p className="wyd-muted" role="status">{ko ? '카메라를 여는 중…' : es ? 'Abriendo la cámara…' : 'Opening camera…'}</p>}
    {error && <p role="alert" className="wyd-error">{error}</p>}
    <button type="button" className="wyd-button wyd-button-secondary wyd-full" onClick={onClose}>{ko ? '닫기' : es ? 'Cerrar' : 'Close'}</button>
  </Modal>;
}
