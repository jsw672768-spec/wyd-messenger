"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useRouter } from "next/navigation";

type Language = {
  code: string;
  name: string;
};

const languages: Language[] = [
  { code: "en", name: "English" },
  { code: "ko", name: "한국어" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "it", name: "Italiano" },
  { code: "pt", name: "Português" },
  { code: "de", name: "Deutsch" },
  { code: "pl", name: "Polski" },
  { code: "ja", name: "日本語" },
  { code: "zh", name: "中文" },
];

const copy: Record<string, any> = {
  en: {
    tagline: "Speak without borders,",
    hero: "WYD.",
    description:
      "Talk with everyone, in every language, from one room.",

    scan: "Scan QR",
    scanAccent: "Join an existing room",
    scanDescription:
      "Scan someone's QR and join the conversation instantly.",

    create: "Create room",
    createAccent: "Start a new conversation",
    createDescription:
      "Create your own room and share the QR with people around you.",

    noAccount: "No account required",

    scannerTitle: "Scan a room QR",
    scannerDescription:
      "Point your camera at a WYD Messenger QR code.",

    invalidQR:
      "This is not a WYD Messenger room QR.",

    cameraError:
      "The camera could not be opened. Please allow camera access.",

    close: "Close",

    chooseLanguage:
      "Choose your language",

    languageDescription:
      "Messages and announcements will be translated into this language.",
  },

  ko: {
    tagline: "언어의 경계 없이,",
    hero: "WYD.",
    description:
      "하나의 방에서, 모든 언어로 대화하세요.",

    scan: "QR 스캔",
    scanAccent: "기존 채팅방에 참여하기",
    scanDescription:
      "누군가의 QR을 스캔해서 바로 대화에 참여하세요.",

    create: "채팅방 만들기",
    createAccent: "새로운 대화 시작하기",
    createDescription:
      "나만의 채팅방을 만들고 QR을 주변 사람들과 공유하세요.",

    noAccount:
      "회원가입 없이 사용 가능",

    scannerTitle:
      "채팅방 QR 스캔",

    scannerDescription:
      "WYD Messenger QR이 카메라 안에 들어오도록 맞춰주세요.",

    invalidQR:
      "WYD Messenger 채팅방 QR이 아닙니다.",

    cameraError:
      "카메라를 열 수 없습니다. 카메라 권한을 허용해주세요.",

    close: "닫기",

    chooseLanguage:
      "언어를 선택하세요",

    languageDescription:
      "메시지와 공지가 선택한 언어로 번역됩니다.",
  },

  es: {
    tagline: "Habla sin fronteras,",
    hero: "WYD.",
    description:
      "Habla con todos, en cualquier idioma, desde una sola sala.",

    scan: "Escanear QR",
    scanAccent: "Unirse a una sala",
    scanDescription:
      "Escanea un QR y únete a la conversación.",

    create: "Crear sala",
    createAccent: "Iniciar conversación",
    createDescription:
      "Crea tu sala y comparte el QR.",

    noAccount:
      "No necesitas una cuenta",

    scannerTitle:
      "Escanear QR",

    scannerDescription:
      "Apunta la cámara a un QR de WYD Messenger.",

    invalidQR:
      "Este QR no pertenece a una sala de WYD Messenger.",

    cameraError:
      "No se pudo abrir la cámara.",

    close: "Cerrar",

    chooseLanguage:
      "Elige tu idioma",

    languageDescription:
      "Los mensajes y anuncios se traducirán a este idioma.",
  },

  fr: {
    tagline: "Parlez sans frontières,",
    hero: "WYD.",
    description:
      "Discutez avec tout le monde, dans toutes les langues.",

    scan: "Scanner le QR",
    scanAccent: "Rejoindre une salle",
    scanDescription:
      "Scannez un QR pour rejoindre la conversation.",

    create: "Créer une salle",
    createAccent:
      "Commencer une conversation",
    createDescription:
      "Créez votre salle et partagez le QR.",

    noAccount:
      "Aucun compte nécessaire",

    scannerTitle:
      "Scanner un QR",

    scannerDescription:
      "Placez le QR WYD Messenger devant la caméra.",

    invalidQR:
      "Ce QR ne correspond pas à une salle WYD Messenger.",

    cameraError:
      "Impossible d'ouvrir la caméra.",

    close: "Fermer",

    chooseLanguage:
      "Choisissez votre langue",

    languageDescription:
      "Les messages seront traduits dans cette langue.",
  },

  it: {
    tagline: "Parla senza confini,",
    hero: "WYD.",
    description:
      "Parla con tutti, in ogni lingua, in una sola stanza.",

    scan: "Scansiona QR",
    scanAccent: "Entra in una stanza",
    scanDescription:
      "Scansiona un QR e partecipa alla conversazione.",

    create: "Crea stanza",
    createAccent:
      "Inizia una conversazione",
    createDescription:
      "Crea la tua stanza e condividi il QR.",

    noAccount:
      "Nessun account necessario",

    scannerTitle:
      "Scansiona QR",

    scannerDescription:
      "Inquadra un QR di WYD Messenger.",

    invalidQR:
      "Questo QR non appartiene a WYD Messenger.",

    cameraError:
      "Impossibile aprire la fotocamera.",

    close: "Chiudi",

    chooseLanguage:
      "Scegli la tua lingua",

    languageDescription:
      "I messaggi saranno tradotti in questa lingua.",
  },

  pt: {
    tagline: "Fale sem fronteiras,",
    hero: "WYD.",
    description:
      "Converse com todos, em qualquer idioma, em uma única sala.",

    scan: "Escanear QR",
    scanAccent: "Entrar em uma sala",
    scanDescription:
      "Escaneie um QR e entre na conversa.",

    create: "Criar sala",
    createAccent:
      "Iniciar uma conversa",
    createDescription:
      "Crie sua sala e compartilhe o QR.",

    noAccount:
      "Nenhuma conta necessária",

    scannerTitle:
      "Escanear QR",

    scannerDescription:
      "Aponte a câmera para um QR do WYD Messenger.",

    invalidQR:
      "Este QR não pertence ao WYD Messenger.",

    cameraError:
      "Não foi possível abrir a câmera.",

    close: "Fechar",

    chooseLanguage:
      "Escolha seu idioma",

    languageDescription:
      "As mensagens serão traduzidas para este idioma.",
  },

  de: {
    tagline: "Sprich ohne Grenzen,",
    hero: "WYD.",
    description:
      "Sprich mit allen, in jeder Sprache, in einem Raum.",

    scan: "QR scannen",
    scanAccent: "Raum beitreten",
    scanDescription:
      "Scanne einen QR-Code und tritt dem Gespräch bei.",

    create: "Raum erstellen",
    createAccent:
      "Gespräch starten",
    createDescription:
      "Erstelle einen Raum und teile den QR-Code.",

    noAccount:
      "Kein Konto erforderlich",

    scannerTitle:
      "QR scannen",

    scannerDescription:
      "Richte die Kamera auf einen WYD Messenger QR-Code.",

    invalidQR:
      "Dieser QR-Code gehört nicht zu WYD Messenger.",

    cameraError:
      "Die Kamera konnte nicht geöffnet werden.",

    close: "Schließen",

    chooseLanguage:
      "Wähle deine Sprache",

    languageDescription:
      "Nachrichten werden in diese Sprache übersetzt.",
  },

  pl: {
    tagline: "Rozmawiaj bez granic,",
    hero: "WYD.",
    description:
      "Rozmawiaj ze wszystkimi, w każdym języku, w jednym pokoju.",

    scan: "Skanuj QR",
    scanAccent: "Dołącz do pokoju",
    scanDescription:
      "Zeskanuj QR i dołącz do rozmowy.",

    create: "Utwórz pokój",
    createAccent:
      "Rozpocznij rozmowę",
    createDescription:
      "Utwórz pokój i udostępnij kod QR.",

    noAccount:
      "Konto nie jest wymagane",

    scannerTitle:
      "Skanuj QR",

    scannerDescription:
      "Skieruj aparat na kod QR WYD Messenger.",

    invalidQR:
      "To nie jest kod QR pokoju WYD Messenger.",

    cameraError:
      "Nie można otworzyć aparatu.",

    close: "Zamknij",

    chooseLanguage:
      "Wybierz język",

    languageDescription:
      "Wiadomości będą tłumaczone na ten język.",
  },

  ja: {
    tagline: "言葉の壁を越えて、",
    hero: "WYD.",
    description:
      "ひとつのルームで、すべての言語で話しましょう。",

    scan: "QRをスキャン",
    scanAccent: "ルームに参加",
    scanDescription:
      "QRを読み取って会話に参加できます。",

    create: "ルームを作成",
    createAccent:
      "新しい会話を始める",
    createDescription:
      "ルームを作ってQRを共有しましょう。",

    noAccount:
      "アカウント不要",

    scannerTitle:
      "QRをスキャン",

    scannerDescription:
      "WYD MessengerのQRコードをカメラに映してください。",

    invalidQR:
      "WYD MessengerのルームQRではありません。",

    cameraError:
      "カメラを開けませんでした。",

    close: "閉じる",

    chooseLanguage:
      "言語を選択",

    languageDescription:
      "メッセージはこの言語に翻訳されます。",
  },

  zh: {
    tagline: "跨越语言的界限，",
    hero: "WYD.",
    description:
      "在一个房间里，用所有语言交流。",

    scan: "扫描二维码",
    scanAccent: "加入聊天室",
    scanDescription:
      "扫描二维码并立即加入对话。",

    create: "创建聊天室",
    createAccent:
      "开始新的对话",
    createDescription:
      "创建聊天室并分享二维码。",

    noAccount:
      "无需注册账号",

    scannerTitle:
      "扫描二维码",

    scannerDescription:
      "将 WYD Messenger 二维码对准摄像头。",

    invalidQR:
      "这不是 WYD Messenger 聊天室二维码。",

    cameraError:
      "无法打开摄像头。",

    close: "关闭",

    chooseLanguage:
      "选择语言",

    languageDescription:
      "消息将翻译成此语言。",
  },
};

export default function Home() {
  const router =
    useRouter();

  const scannerRef =
    useRef<any>(null);

  const scanningRef =
    useRef(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    languageChecked,
    setLanguageChecked,
  ] = useState(false);

  const [
    language,
    setLanguage,
  ] = useState("en");

  const [
    firstLanguageChoice,
    setFirstLanguageChoice,
  ] = useState(false);

  const [
    showLanguage,
    setShowLanguage,
  ] = useState(false);

  const [
    showScanner,
    setShowScanner,
  ] = useState(false);

  const [
    scannerError,
    setScannerError,
  ] = useState("");

  const t =
    copy[language] ||
    copy.en;

  useEffect(() => {
    const savedLanguage =
      localStorage.getItem(
        "wyd_language"
      );

    if (savedLanguage) {
      setLanguage(
        savedLanguage
      );

      document.documentElement.lang =
        savedLanguage;
    } else {
      setFirstLanguageChoice(
        true
      );
    }

    setLanguageChecked(
      true
    );

    const timer =
      setTimeout(() => {
        setLoading(false);
      }, 1400);

    return () =>
      clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showScanner) {
      return;
    }

    let cancelled =
      false;

    async function startScanner() {
      try {
        setScannerError("");

        const {
          Html5Qrcode,
        } = await import(
          "html5-qrcode"
        );

        if (cancelled) {
          return;
        }

        const scanner =
          new Html5Qrcode(
            "wyd-qr-reader"
          );

        scannerRef.current =
          scanner;

        scanningRef.current =
          true;

        await scanner.start(
          {
            facingMode:
              "environment",
          },
          {
            fps: 10,

            qrbox: {
              width: 240,
              height: 240,
            },
          },
          async (
            decodedText: string
          ) => {
            if (
              !scanningRef.current
            ) {
              return;
            }

            try {
              const url =
                new URL(
                  decodedText
                );

              const roomMatch =
                url.pathname.match(
                  /^\/room\/([^/]+)/
                );

              if (!roomMatch) {
                setScannerError(
                  t.invalidQR
                );

                return;
              }

              scanningRef.current =
                false;

              try {
                await scanner.stop();
              } catch {}

              scannerRef.current =
                null;

              setShowScanner(
                false
              );

              window.location.href =
                decodedText;
            } catch {
              setScannerError(
                t.invalidQR
              );
            }
          },
          () => {}
        );
      } catch (error) {
        console.error(
          "QR scanner error:",
          error
        );

        setScannerError(
          t.cameraError
        );
      }
    }

    startScanner();

    return () => {
      cancelled = true;

      scanningRef.current =
        false;

      const scanner =
        scannerRef.current;

      scannerRef.current =
        null;

      if (scanner) {
        scanner
          .stop()
          .catch(() => {});
      }
    };
  }, [
    showScanner,
    language,
  ]);

  function selectLanguage(
    code: string
  ) {
    setLanguage(code);

    localStorage.setItem(
      "wyd_language",
      code
    );

    document.documentElement.lang =
      code;

    setFirstLanguageChoice(
      false
    );

    setShowLanguage(
      false
    );
  }

  function createRoom() {
    const roomId =
      crypto.randomUUID()
        .slice(0, 8);

    router.push(
      `/room/${roomId}`
    );
  }

  async function closeScanner() {
    scanningRef.current =
      false;

    if (
      scannerRef.current
    ) {
      try {
        await scannerRef.current.stop();
      } catch {}

      scannerRef.current =
        null;
    }

    setShowScanner(
      false
    );

    setScannerError("");
  }

  if (
    loading ||
    !languageChecked
  ) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#fffefb]">

        <div className="flex flex-col items-center">

          <div className="relative">

            <h1 className="animate-[brandIntro_0.9s_ease-out_forwards] text-[54px] font-black tracking-[-0.07em] text-[#101820]">
              WYD
            </h1>

            <span className="absolute -right-3 top-1 h-3 w-3 rounded-full bg-[#FFD43B]" />

          </div>

          <p className="mt-1 animate-[brandSub_1.1s_ease-out_forwards] text-[10px] font-medium lowercase tracking-[0.42em] text-neutral-400">
            messenger
          </p>

        </div>

      </main>
    );
  }

  if (
    firstLanguageChoice
  ) {
    return (
      <LanguageScreen
        language={
          language
        }
        onSelect={
          selectLanguage
        }
      />
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#f6f6f4] text-[#101820]">

      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-[#fffefb]">

        {/* SOFT BACKGROUND ACCENT */}

        <div className="pointer-events-none absolute right-[-130px] top-[245px] h-[360px] w-[360px] rounded-full bg-[#ffe66b]/25 blur-[3px]" />

        <div className="pointer-events-none absolute right-[-70px] top-[315px] h-[210px] w-[210px] rounded-full bg-[#fff4b8]/40 blur-3xl" />


        {/* HEADER */}

        <header className="relative z-10 flex items-start justify-between px-6 pt-8">

          <div>

            <div className="relative inline-block">

              <h1 className="text-[34px] font-black tracking-[-0.06em]">
                WYD
              </h1>

              <span className="absolute -right-3 top-0 h-3 w-3 rounded-full bg-[#FFD43B]" />

            </div>

            <p className="mt-[-3px] text-[11px] lowercase tracking-[0.22em] text-neutral-400">
              messenger
            </p>

          </div>


          <button
            onClick={() =>
              setShowLanguage(
                true
              )
            }
            className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white/90 px-4 py-3 shadow-[0_8px_25px_rgba(0,0,0,0.04)] backdrop-blur"
          >

            <span className="text-[15px]">
              ◉
            </span>

            <span className="text-xs font-semibold">
              {
                languages.find(
                  (item) =>
                    item.code ===
                    language
                )?.name
              }
            </span>

            <span className="ml-1 text-xs text-neutral-400">
             ⌄
            </span>

          </button>

        </header>


        {/* HERO */}

        <section className="relative z-10 px-6 pt-[17vh]">

          <p className="text-[35px] font-light leading-tight tracking-[-0.04em]">
            {t.tagline}
          </p>


          <div className="relative mt-3 inline-block">

            <h2 className="text-[66px] font-black leading-none tracking-[-0.075em]">
              {t.hero}
            </h2>

            <span className="absolute -right-3 bottom-2 h-5 w-5 rounded-full bg-[#FFD43B]" />

          </div>


          <p className="mt-7 max-w-[300px] text-[15px] leading-7 text-neutral-500">
            {t.description}
          </p>

        </section>


        {/* ACTION CARDS */}

        <section className="relative z-10 mt-auto space-y-4 px-5 pb-7 pt-14">

          {/* QR CARD */}

          <button
            onClick={() => {
              setScannerError("");

              setShowScanner(
                true
              );
            }}
            className="group flex w-full items-center rounded-[30px] border border-[#dceaff] bg-[#f8fbff]/95 p-5 text-left shadow-[0_12px_35px_rgba(51,104,200,0.07)] transition active:scale-[0.985]"
          >

            <div className="flex h-[78px] w-[78px] shrink-0 items-center justify-center rounded-[25px] bg-[#e9f2ff]">

              <div className="relative flex h-11 w-11 items-center justify-center">

                <span className="absolute left-0 top-0 h-3 w-3 rounded-tl-md border-l-[3px] border-t-[3px] border-[#2868d8]" />

                <span className="absolute right-0 top-0 h-3 w-3 rounded-tr-md border-r-[3px] border-t-[3px] border-[#2868d8]" />

                <span className="absolute bottom-0 left-0 h-3 w-3 rounded-bl-md border-b-[3px] border-l-[3px] border-[#2868d8]" />

                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-br-md border-b-[3px] border-r-[3px] border-[#2868d8]" />

                <div className="h-4 w-4 rounded-[4px] border-[3px] border-[#2868d8]" />

              </div>

            </div>


            <div className="min-w-0 flex-1 px-5">

              <h3 className="text-[20px] font-bold tracking-[-0.035em]">
                {t.scan}
              </h3>

              <p className="mt-1 text-[12px] font-semibold text-[#2868d8]">
                {t.scanAccent}
              </p>

              <p className="mt-2 text-[11px] leading-5 text-neutral-400">
                {t.scanDescription}
              </p>

            </div>


            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[25px] font-light text-[#2868d8] shadow-[0_6px_20px_rgba(0,0,0,0.05)]">
              →
            </div>

          </button>


          {/* CREATE CARD */}

          <button
            onClick={
              createRoom
            }
            className="group flex w-full items-center rounded-[30px] border border-[#fff0c7] bg-[#fffdf8]/95 p-5 text-left shadow-[0_12px_35px_rgba(240,179,40,0.06)] transition active:scale-[0.985]"
          >

            <div className="flex h-[78px] w-[78px] shrink-0 items-center justify-center rounded-[25px] bg-[#fff4d4]">

              <span className="text-[46px] font-extralight leading-none text-[#f4ad13]">
                +
              </span>

            </div>


            <div className="min-w-0 flex-1 px-5">

              <h3 className="text-[20px] font-bold tracking-[-0.035em]">
                {t.create}
              </h3>

              <p className="mt-1 text-[12px] font-semibold text-[#e7a30c]">
                {t.createAccent}
              </p>

              <p className="mt-2 text-[11px] leading-5 text-neutral-400">
                {t.createDescription}
              </p>

            </div>


            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[25px] font-light text-[#e7a30c] shadow-[0_6px_20px_rgba(0,0,0,0.05)]">
              →
            </div>

          </button>


          {/* FOOTER */}

          <div className="flex items-center justify-center gap-2 pt-4">

            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-300 text-[10px] text-neutral-400">
              ✓
            </div>

            <p className="text-[11px] text-neutral-400">
              {t.noAccount}
            </p>

          </div>

        </section>

      </div>


      {/* QR SCANNER */}

      {showScanner && (

        <Sheet
          onClose={
            closeScanner
          }
        >

          <div className="flex items-start justify-between">

            <div>

              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2868d8]">
                WYD
              </p>

              <h2 className="mt-2 text-[28px] font-bold tracking-[-0.045em]">
                {t.scannerTitle}
              </h2>

            </div>


            <CloseButton
              onClick={
                closeScanner
              }
            />

          </div>


          <p className="mt-3 max-w-[300px] text-sm leading-6 text-neutral-500">
            {t.scannerDescription}
          </p>


          <div className="mt-6 overflow-hidden rounded-[28px] bg-[#101820] p-2">

            <div
              id="wyd-qr-reader"
              className="min-h-[300px] overflow-hidden rounded-[23px]"
            />

          </div>


          {scannerError && (

            <div className="mt-4 rounded-[18px] bg-red-50 px-4 py-3">

              <p className="text-xs leading-5 text-red-600">
                {scannerError}
              </p>

            </div>

          )}


          <button
            onClick={
              closeScanner
            }
            className="mt-5 w-full rounded-[20px] bg-[#f4f4f2] py-4 text-sm font-semibold"
          >
            {t.close}
          </button>

        </Sheet>

      )}


      {/* LANGUAGE */}

      {showLanguage && (

        <LanguageModal
          language={
            language
          }
          title={
            t.chooseLanguage
          }
          description={
            t.languageDescription
          }
          onSelect={
            selectLanguage
          }
          onClose={() =>
            setShowLanguage(
              false
            )
          }
        />

      )}

    </main>
  );
}


function Sheet({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      onClick={
        onClose
      }
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/35 px-3 pb-3 backdrop-blur-sm sm:items-center"
    >

      <div
        onClick={(event) =>
          event.stopPropagation()
        }
        className="w-full max-w-[410px] rounded-[32px] bg-[#fffefb] p-6 shadow-2xl"
      >
        {children}
      </div>

    </div>
  );
}


function CloseButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      onClick={
        onClick
      }
      className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4f4f2] text-xl"
    >
      ×
    </button>
  );
}


function LanguageScreen({
  language,
  onSelect,
}: {
  language: string;
  onSelect: (
    code: string
  ) => void;
}) {
  return (
    <main className="min-h-[100dvh] bg-[#f6f6f4] p-4 text-[#101820]">

      <div className="mx-auto min-h-[calc(100dvh-32px)] w-full max-w-[430px] rounded-[34px] bg-[#fffefb] px-6 py-8">

        <div className="relative inline-block">

          <h1 className="text-[34px] font-black tracking-[-0.06em]">
            WYD
          </h1>

          <span className="absolute -right-3 top-0 h-3 w-3 rounded-full bg-[#FFD43B]" />

        </div>

        <p className="mt-[-3px] text-[10px] lowercase tracking-[0.22em] text-neutral-400">
          messenger
        </p>


        <div className="mt-16">

          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2868d8]">
            Language
          </p>

          <h2 className="mt-4 text-[42px] font-bold leading-[1.03] tracking-[-0.055em]">
            Choose your
            <br />
            language.
          </h2>

          <p className="mt-5 max-w-[310px] text-sm leading-6 text-neutral-500">
            Messages and announcements will be translated into the language you choose.
          </p>

        </div>


        <LanguageList
          language={
            language
          }
          onSelect={
            onSelect
          }
        />

      </div>

    </main>
  );
}


function LanguageModal({
  language,
  title,
  description,
  onSelect,
  onClose,
}: {
  language: string;
  title: string;
  description: string;
  onSelect: (
    code: string
  ) => void;
  onClose: () => void;
}) {
  return (
    <Sheet
      onClose={
        onClose
      }
    >

      <div className="flex items-start justify-between">

        <div>

          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2868d8]">
            Language
          </p>

          <h2 className="mt-2 text-[28px] font-bold tracking-[-0.045em]">
            {title}
          </h2>

        </div>


        <CloseButton
          onClick={
            onClose
          }
        />

      </div>


      <p className="mt-3 max-w-[300px] text-sm leading-6 text-neutral-500">
        {description}
      </p>


      <LanguageList
        language={
          language
        }
        onSelect={
          onSelect
        }
      />

    </Sheet>
  );
}


function LanguageList({
  language,
  onSelect,
}: {
  language: string;
  onSelect: (
    code: string
  ) => void;
}) {
  return (
    <div className="mt-7 max-h-[55vh] space-y-2 overflow-y-auto">

      {languages.map(
        (item) => {

          const selected =
            language ===
            item.code;

          return (
            <button
              key={
                item.code
              }
              onClick={() =>
                onSelect(
                  item.code
                )
              }
              className={`flex w-full items-center justify-between rounded-[18px] px-5 py-4 text-left transition active:scale-[0.99] ${
                selected
                  ? "bg-[#101820] text-white"
                  : "bg-[#f5f5f2] text-[#101820]"
              }`}
            >

              <span className="text-sm font-semibold">
                {item.name}
              </span>


              {selected && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFD43B] text-[11px] font-bold text-[#101820]">
                  ✓
                </span>
              )}

            </button>
          );
        }
      )}

    </div>
  );
}