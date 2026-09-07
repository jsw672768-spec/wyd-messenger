"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import JoinByLink from "@/components/join-by-link";
import { joinPath } from "@/lib/join-path";
import InstallApp from "@/components/install-app";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

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

const copy: Record<string, Record<string, string>> = {
  en: {
    tagline: "Speak without borders,",
    hero: "WYD.",
    description:
      "Join an international event or create a temporary multilingual network.",

    scan: "Scan QR",
    scanAccent: "Join an event",
    scanDescription:
      "Scan an event or room QR and enter instantly.",

    create: "Create event",
    createAccent: "Start a multilingual network",
    createDescription:
      "Create an event, share one QR, and bring everyone together.",

    noAccount: "No account required",

    scannerTitle: "Scan WYD QR",
    scannerDescription:
      "Point your camera at a WYD event or room QR code.",

    invalidQR: "This is not a valid WYD QR code.",
    cameraError:
      "The camera could not be opened. Please allow camera access.",

    close: "Close",

    chooseLanguage: "Choose your language",
    languageDescription:
      "Messages and announcements will appear in your language.",

    createEvent: "Create event",
    eventName: "Event name",
    eventNamePlaceholder: "WYD Seoul 2027",
    descriptionLabel: "Description",
    descriptionPlaceholder:
      "International youth gathering",
    start: "Start",
    end: "End",
    optional: "Optional",
    creating: "Creating...",
    createButton: "Create event",
    eventError:
      "The event could not be created. Please try again.",
  },

  ko: {
    tagline: "언어의 경계 없이,",
    hero: "WYD.",
    description:
      "국제 행사에 참여하거나 잠깐 존재하는 다국어 네트워크를 만들어보세요.",

    scan: "QR 스캔",
    scanAccent: "이벤트 참여하기",
    scanDescription:
      "이벤트나 채팅방 QR을 스캔해 바로 참여하세요.",

    create: "이벤트 만들기",
    createAccent: "다국어 네트워크 시작",
    createDescription:
      "이벤트를 만들고 하나의 QR로 모두를 연결하세요.",

    noAccount: "회원가입 없이 사용 가능",

    scannerTitle: "WYD QR 스캔",
    scannerDescription:
      "WYD 이벤트 또는 채팅방 QR을 카메라에 맞춰주세요.",

    invalidQR: "올바른 WYD QR 코드가 아닙니다.",
    cameraError:
      "카메라를 열 수 없습니다. 카메라 권한을 허용해주세요.",

    close: "닫기",

    chooseLanguage: "언어를 선택하세요",
    languageDescription:
      "메시지와 공지가 선택한 언어로 표시됩니다.",

    createEvent: "이벤트 만들기",
    eventName: "이벤트 이름",
    eventNamePlaceholder: "WYD Seoul 2027",
    descriptionLabel: "설명",
    descriptionPlaceholder:
      "국제 청년 행사",
    start: "시작",
    end: "종료",
    optional: "선택",
    creating: "만드는 중...",
    createButton: "이벤트 만들기",
    eventError:
      "이벤트를 만들지 못했습니다. 다시 시도해주세요.",
  },

  es: {
    tagline: "Habla sin fronteras,",
    hero: "WYD.",
    description:
      "Únete a un evento internacional o crea una red multilingüe temporal.",

    scan: "Escanear QR",
    scanAccent: "Unirse a un evento",
    scanDescription:
      "Escanea un QR de evento o sala para entrar.",

    create: "Crear evento",
    createAccent: "Crear una red multilingüe",
    createDescription:
      "Crea un evento y conecta a todos con un solo QR.",

    noAccount: "No necesitas una cuenta",

    scannerTitle: "Escanear QR de WYD",
    scannerDescription:
      "Apunta la cámara a un QR de evento o sala de WYD.",

    invalidQR: "Este no es un QR válido de WYD.",
    cameraError:
      "No se pudo abrir la cámara.",

    close: "Cerrar",

    chooseLanguage: "Elige tu idioma",
    languageDescription:
      "Los mensajes y anuncios aparecerán en tu idioma.",

    createEvent: "Crear evento",
    eventName: "Nombre del evento",
    eventNamePlaceholder: "WYD Seoul 2027",
    descriptionLabel: "Descripción",
    descriptionPlaceholder:
      "Encuentro internacional de jóvenes",
    start: "Inicio",
    end: "Fin",
    optional: "Opcional",
    creating: "Creando...",
    createButton: "Crear evento",
    eventError:
      "No se pudo crear el evento.",
  },
};

export default function Home() {
  const router = useRouter();

  const supabase = useMemo(() => {
    const url =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const key =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      return null;
    }

    return createClient(url, key);
  }, []);

  const scannerRef = useRef<any>(null);
  const scanningRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [languageChecked, setLanguageChecked] =
    useState(false);

  const [language, setLanguage] = useState("en");

  const [firstLanguageChoice, setFirstLanguageChoice] =
    useState(false);

  const [showLanguage, setShowLanguage] =
    useState(false);

  const [showScanner, setShowScanner] =
    useState(false);

  const [scannerError, setScannerError] =
    useState("");

  const [showCreateEvent, setShowCreateEvent] =
    useState(false);

  const [eventName, setEventName] =
    useState("");

  const [eventDescription, setEventDescription] =
    useState("");

  const [eventStart, setEventStart] =
    useState("");

  const [eventEnd, setEventEnd] =
    useState("");

  const [creatingEvent, setCreatingEvent] =
    useState(false);

  const [eventError, setEventError] =
    useState("");

  const t = copy[language] || copy.en;

  useEffect(() => {
    const savedLanguage =
      localStorage.getItem("wyd_language");

    if (savedLanguage) {
      setLanguage(savedLanguage);

      document.documentElement.lang =
        savedLanguage;
    } else {
      setFirstLanguageChoice(true);
    }

    setLanguageChecked(true);

    const timer =
      setTimeout(() => {
        setLoading(false);
      }, 1200);

    return () =>
      clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showScanner) {
      return;
    }

    let cancelled = false;

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
            facingMode: "environment",
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
              const validPath = joinPath(decodedText);

              if (!validPath) {
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

              setShowScanner(false);

              /*
               * QR에 다른 도메인이 들어 있어도
               * 현재 WYD 주소에서 같은 path만 연다.
               */
              window.location.href =
                `${window.location.origin}${validPath}`;
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
    t.invalidQR,
    t.cameraError,
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

    setFirstLanguageChoice(false);
    setShowLanguage(false);
  }

  function getSenderId() {
    let senderId =
      localStorage.getItem(
        "wyd_sender_id"
      );

    if (!senderId) {
      senderId =
        crypto.randomUUID();

      localStorage.setItem(
        "wyd_sender_id",
        senderId
      );
    }

    return senderId;
  }

  async function createEvent() {
    if (!supabase) {
      setEventError(language === 'ko' ? '현재 서비스를 준비 중입니다. 잠시 후 다시 시도해주세요.' : 'The service is being prepared. Please try again later.');
      return;
    }
    if (
      !supabase ||
      !eventName.trim() ||
      creatingEvent
    ) {
      return;
    }

    setCreatingEvent(true);
    setEventError("");

    const senderId =
      getSenderId();

    const eventId =
      crypto
        .randomUUID()
        .replaceAll("-", "")
        .slice(0, 10);

    const generalRoomId =
      crypto
        .randomUUID()
        .replaceAll("-", "")
        .slice(0, 10);

    try {
      const {
        error: eventInsertError,
      } = await supabase
        .from("events")
        .insert({
          id: eventId,

          name:
            eventName.trim(),

          description:
            eventDescription.trim() ||
            null,

          owner_id:
            senderId,

          status:
            "active",

          start_at:
            eventStart
              ? new Date(
                  eventStart
                ).toISOString()
              : null,

          end_at:
            eventEnd
              ? new Date(
                  eventEnd
                ).toISOString()
              : null,
        });

      if (eventInsertError) {
        throw eventInsertError;
      }

      const {
        error: roomInsertError,
      } = await supabase
        .from("rooms")
        .insert({
          id:
            generalRoomId,

          event_id:
            eventId,

          name:
            "General",

          room_type:
            "general",

          sort_order:
            0,

          owner_id:
            senderId,

          status:
            "active",
        });

      if (roomInsertError) {
        throw roomInsertError;
      }

      const displayName =
        localStorage.getItem(
          "wyd_display_name"
        );

      if (displayName) {
        const {
          error:
            participantError,
        } = await supabase
          .from(
            "event_participants"
          )
          .upsert(
            {
              event_id:
                eventId,

              user_id:
                senderId,

              display_name:
                displayName,

              language,

              role:
                "organizer",

              updated_at:
                new Date()
                  .toISOString(),
            },
            {
              onConflict:
                "event_id,user_id",
            }
          );

        if (
          participantError
        ) {
          console.error(
            "Organizer participant error:",
            participantError
          );
        }
      }

      router.push(
        `/event/${eventId}`
      );
    } catch (error) {
      console.error(
        "Create event error:",
        error
      );

      setEventError(
        t.eventError
      );

      setCreatingEvent(false);
    }
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

    setShowScanner(false);
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
        language={language}
        onSelect={
          selectLanguage
        }
      />
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#f6f6f4] text-[#101820]">

      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-[#fffefb]">

        <div className="pointer-events-none absolute right-[-150px] top-[255px] h-[350px] w-[350px] rounded-full bg-[#ffe66b]/20" />

        {/* HEADER */}

        <header className="relative z-10 flex items-start justify-between px-6 pt-8">

          <Brand />


          <button
            onClick={() =>
              setShowLanguage(true)
            }
            className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white/90 px-4 py-3 shadow-[0_8px_25px_rgba(0,0,0,0.04)]"
          >
            <span className="text-xs font-semibold">
              {
                languages.find(
                  (item) =>
                    item.code ===
                    language
                )?.name
              }
            </span>

            <span className="text-xs text-neutral-400">
              ⌄
            </span>
          </button>

        </header>


        {/* HERO */}

        <section className="relative z-10 px-6 pt-[16vh]">

          <p className="text-[35px] font-light leading-tight tracking-[-0.04em]">
            {t.tagline}
          </p>

          <div className="relative mt-3 inline-block">

            <h2 className="text-[66px] font-black leading-none tracking-[-0.075em]">
              {t.hero}
            </h2>

            <span className="absolute -right-3 bottom-2 h-5 w-5 rounded-full bg-[#FFD43B]" />

          </div>

          <p className="mt-7 max-w-[315px] text-[15px] leading-7 text-neutral-500">
            {t.description}
          </p>

        </section>


        {/* ACTIONS */}

        <section className="relative z-10 mt-auto space-y-4 px-5 pb-7 pt-14">


          <button
            onClick={() => {
              setScannerError("");
              setShowScanner(true);
            }}
            className="flex w-full items-center rounded-[30px] border border-[#dceaff] bg-[#f8fbff]/95 p-5 text-left shadow-[0_12px_35px_rgba(51,104,200,0.07)] active:scale-[0.985]"
          >

            <div className="flex h-[78px] w-[78px] shrink-0 items-center justify-center rounded-[25px] bg-[#e9f2ff]">
              <QrIcon />
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

            <CircleArrow blue />

          </button>


          <button
            onClick={() => {
              setEventError("");
              setShowCreateEvent(
                true
              );
            }}
            className="flex w-full items-center rounded-[30px] border border-[#fff0c7] bg-[#fffdf8]/95 p-5 text-left shadow-[0_12px_35px_rgba(240,179,40,0.06)] active:scale-[0.985]"
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

            <CircleArrow />

          </button>


          <p className="pt-3 text-center text-[11px] text-neutral-400">
            ✓ {t.noAccount}
          </p>

          <JoinByLink language={language} />
          <InstallApp language={language} />

        </section>

      </div>


      {/* CREATE EVENT */}

      {showCreateEvent && (

        <Sheet
          onClose={() => {
            if (
              !creatingEvent
            ) {
              setShowCreateEvent(
                false
              );
            }
          }}
        >

          <SheetHeader
            eyebrow="WYD EVENT"
            title={t.createEvent}
            onClose={() => {
              if (
                !creatingEvent
              ) {
                setShowCreateEvent(
                  false
                );
              }
            }}
          />


          <div className="mt-6 space-y-4">

            <FieldLabel>
              {t.eventName}
            </FieldLabel>

            <input
              autoFocus
              value={eventName}
              onChange={(event) =>
                setEventName(
                  event.target.value
                )
              }
              placeholder={
                t.eventNamePlaceholder
              }
              className="w-full rounded-[20px] bg-[#f5f5f2] px-4 py-4 text-sm outline-none"
            />


            <FieldLabel>
              {t.descriptionLabel}
              <span className="ml-1 font-normal text-neutral-300">
                · {t.optional}
              </span>
            </FieldLabel>

            <textarea
              value={eventDescription}
              onChange={(event) =>
                setEventDescription(
                  event.target.value
                )
              }
              placeholder={
                t.descriptionPlaceholder
              }
              rows={3}
              className="w-full resize-none rounded-[20px] bg-[#f5f5f2] px-4 py-4 text-sm leading-6 outline-none"
            />


            <div className="grid grid-cols-2 gap-3">

              <div>
                <FieldLabel>
                  {t.start}
                </FieldLabel>

                <input
                  type="datetime-local"
                  value={eventStart}
                  onChange={(event) =>
                    setEventStart(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-[18px] bg-[#f5f5f2] px-3 py-4 text-[11px] outline-none"
                />
              </div>


              <div>
                <FieldLabel>
                  {t.end}
                </FieldLabel>

                <input
                  type="datetime-local"
                  value={eventEnd}
                  onChange={(event) =>
                    setEventEnd(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-[18px] bg-[#f5f5f2] px-3 py-4 text-[11px] outline-none"
                />
              </div>

            </div>


            {eventError && (

              <div className="rounded-[18px] bg-red-50 px-4 py-3 text-xs text-red-500">
                {eventError}
              </div>

            )}


            <button
              onClick={createEvent}
              disabled={
                !eventName.trim() ||
                creatingEvent
              }
              className="w-full rounded-[20px] bg-[#2868d8] py-4 text-sm font-bold text-white disabled:bg-neutral-200"
            >
              {creatingEvent
                ? t.creating
                : t.createButton}
            </button>

          </div>

        </Sheet>

      )}


      {/* SCANNER */}

      {showScanner && (

        <Sheet
          onClose={
            closeScanner
          }
        >

          <SheetHeader
            eyebrow="WYD"
            title={
              t.scannerTitle
            }
            onClose={
              closeScanner
            }
          />

          <p className="mt-3 text-sm leading-6 text-neutral-500">
            {t.scannerDescription}
          </p>

          <div className="mt-6 overflow-hidden rounded-[28px] bg-[#101820] p-2">

            <div
              id="wyd-qr-reader"
              className="min-h-[300px] overflow-hidden rounded-[23px]"
            />

          </div>

          {scannerError && (

            <div className="mt-4 rounded-[18px] bg-red-50 px-4 py-3 text-xs leading-5 text-red-600">
              {scannerError}
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


function Brand() {
  return (
    <div>

      <div className="relative inline-block">

        <h1 className="text-[34px] font-black tracking-[-0.06em]">
          WYD
        </h1>

        <span className="absolute -right-3 top-0 h-3 w-3 rounded-full bg-[#FFD43B]" />

      </div>

      <p className="mt-[-3px] text-[10px] lowercase tracking-[0.22em] text-neutral-400">
        messenger
      </p>

    </div>
  );
}


function QrIcon() {
  return (
    <div className="relative h-11 w-11 text-[#2868d8]">

      <span className="absolute left-0 top-0 h-3.5 w-3.5 rounded-tl-md border-l-[3px] border-t-[3px] border-current" />

      <span className="absolute right-0 top-0 h-3.5 w-3.5 rounded-tr-md border-r-[3px] border-t-[3px] border-current" />

      <span className="absolute bottom-0 left-0 h-3.5 w-3.5 rounded-bl-md border-b-[3px] border-l-[3px] border-current" />

      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-br-md border-b-[3px] border-r-[3px] border-current" />

      <span className="absolute left-[15px] top-[15px] h-3 w-3 rounded-[3px] border-[3px] border-current" />

    </div>
  );
}


function CircleArrow({
  blue = false,
}: {
  blue?: boolean;
}) {
  return (
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[25px] font-light shadow-[0_6px_20px_rgba(0,0,0,0.05)] ${
        blue
          ? "text-[#2868d8]"
          : "text-[#e7a30c]"
      }`}
    >
      →
    </div>
  );
}


function FieldLabel({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <p className="text-[11px] font-bold text-[#101820]">
      {children}
    </p>
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
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/30 px-3 pb-3 backdrop-blur-sm sm:items-center"
    >

      <div
        onClick={(event) =>
          event.stopPropagation()
        }
        className="max-h-[92dvh] w-full max-w-[410px] overflow-y-auto rounded-[32px] bg-[#fffefb] p-6 shadow-2xl"
      >
        {children}
      </div>

    </div>
  );
}


function SheetHeader({
  eyebrow,
  title,
  onClose,
}: {
  eyebrow: string;
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">

      <div>

        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#2868d8]">
          {eyebrow}
        </p>

        <h2 className="mt-2 text-[28px] font-bold tracking-[-0.045em]">
          {title}
        </h2>

      </div>

      <button
        onClick={onClose}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f4f4f2] text-xl"
      >
        ×
      </button>

    </div>
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

        <Brand />

        <div className="mt-16">

          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#2868d8]">
            Language
          </p>

          <h2 className="mt-4 text-[42px] font-bold leading-[1.03] tracking-[-0.055em]">
            Choose your
            <br />
            language.
          </h2>

          <p className="mt-5 max-w-[310px] text-sm leading-6 text-neutral-500">
            Messages and announcements will appear in the language you choose.
          </p>

        </div>

        <LanguageList
          language={language}
          onSelect={onSelect}
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
    <Sheet onClose={onClose}>

      <SheetHeader
        eyebrow="Language"
        title={title}
        onClose={onClose}
      />

      <p className="mt-3 text-sm leading-6 text-neutral-500">
        {description}
      </p>

      <LanguageList
        language={language}
        onSelect={onSelect}
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
    <div className="mt-6 max-h-[55vh] space-y-2 overflow-y-auto">

      {languages.map(
        (item) => {

          const selected =
            language ===
            item.code;

          return (
            <button
              key={item.code}
              onClick={() =>
                onSelect(item.code)
              }
              className={`flex w-full items-center justify-between rounded-[18px] px-5 py-4 text-left ${
                selected
                  ? "bg-[#101820] text-white"
                  : "bg-[#f5f5f2] text-[#101820]"
              }`}
            >

              <span className="text-sm font-semibold">
                {item.name}
              </span>

              {selected && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFD43B] text-[10px] font-bold text-[#101820]">
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