"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import { getSupabaseBrowser, useWydIdentity } from '@/lib/supabase-browser';


type EventData = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  status:
    | "active"
    | "ended";
  created_at: string;
  ended_at: string | null;
};


type RoomSummary = {
  id: string;
  status: string;
};


const copy: Record<
  string,
  Record<string, string>
> = {
  en: {
    manage:
      "Event management",

    subtitle:
      "Control the lifecycle of this temporary network.",

    organizer:
      "Organizer",

    participants:
      "Participants",

    rooms:
      "Rooms",

    activeRooms:
      "Active rooms",

    dangerZone:
      "Danger zone",

    endEvent:
      "End event",

    endDescription:
      "End the event and close every room at once.",

    warningTitle:
      "End this event?",

    warningDescription:
      "This action closes the whole WYD event network.",

    roomWarning:
      "All active chat rooms will be closed.",

    messageWarning:
      "Participants will no longer be able to send messages.",

    recordWarning:
      "Schedule and meeting information will remain available as read-only records.",

    helpWarning:
      "Open HELP requests will be closed.",

    cancel:
      "Cancel",

    confirm:
      "End event now",

    ending:
      "Ending event...",

    ended:
      "Event ended",

    endedDescription:
      "This event is now a read-only record.",

    endedAt:
      "Ended",

    backEvent:
      "Back to event",

    unauthorized:
      "Organizer access required.",

    error:
      "The event could not be ended.",
  },

  ko: {
    manage:
      "이벤트 관리",

    subtitle:
      "이 임시 WYD 네트워크의 운영 상태를 관리합니다.",

    organizer:
      "운영자",

    participants:
      "참가자",

    rooms:
      "전체 채팅방",

    activeRooms:
      "활성 채팅방",

    dangerZone:
      "종료 관리",

    endEvent:
      "이벤트 종료",

    endDescription:
      "이벤트와 모든 채팅방을 한 번에 종료합니다.",

    warningTitle:
      "이 이벤트를 종료할까요?",

    warningDescription:
      "이 작업은 WYD 이벤트 네트워크 전체를 종료합니다.",

    roomWarning:
      "현재 열려 있는 모든 채팅방이 종료됩니다.",

    messageWarning:
      "참가자는 더 이상 메시지를 보낼 수 없습니다.",

    recordWarning:
      "일정과 집합 장소는 읽기 전용 기록으로 남습니다.",

    helpWarning:
      "처리되지 않은 HELP 요청도 종료됩니다.",

    cancel:
      "취소",

    confirm:
      "이벤트 종료하기",

    ending:
      "이벤트 종료 중...",

    ended:
      "이벤트 종료됨",

    endedDescription:
      "이 이벤트는 이제 읽기 전용 기록 상태입니다.",

    endedAt:
      "종료 시각",

    backEvent:
      "이벤트로 돌아가기",

    unauthorized:
      "운영자만 접근할 수 있습니다.",

    error:
      "이벤트를 종료하지 못했습니다.",
  },

  es: {
    manage:
      "Gestión del evento",

    subtitle:
      "Controla el estado de esta red temporal.",

    organizer:
      "Organizador",

    participants:
      "Participantes",

    rooms:
      "Salas",

    activeRooms:
      "Salas activas",

    dangerZone:
      "Zona de cierre",

    endEvent:
      "Finalizar evento",

    endDescription:
      "Finaliza el evento y cierra todas las salas.",

    warningTitle:
      "¿Finalizar este evento?",

    warningDescription:
      "Esta acción cerrará toda la red del evento WYD.",

    roomWarning:
      "Todas las salas activas se cerrarán.",

    messageWarning:
      "Los participantes ya no podrán enviar mensajes.",

    recordWarning:
      "El horario y el punto de encuentro permanecerán como registros de solo lectura.",

    helpWarning:
      "Las solicitudes HELP abiertas se cerrarán.",

    cancel:
      "Cancelar",

    confirm:
      "Finalizar ahora",

    ending:
      "Finalizando...",

    ended:
      "Evento finalizado",

    endedDescription:
      "Este evento ahora es de solo lectura.",

    endedAt:
      "Finalizado",

    backEvent:
      "Volver al evento",

    unauthorized:
      "Solo para organizadores.",

    error:
      "No se pudo finalizar el evento.",
  },
};


export default function ManagePage() {
  const router =
    useRouter();

  const params =
    useParams();

  const rawId =
    params?.id;

  const eventId =
    Array.isArray(rawId)
      ? rawId[0]
      : String(rawId || "");


  const supabase = useMemo(() => getSupabaseBrowser(), []);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const { senderId } = useWydIdentity();


  const [
    language,
    setLanguage,
  ] = useState("en");


  const [
    eventData,
    setEventData,
  ] = useState<EventData | null>(
    null
  );


  const [
    participantCount,
    setParticipantCount,
  ] = useState(0);


  const [
    roomCount,
    setRoomCount,
  ] = useState(0);


  const [
    activeRoomCount,
    setActiveRoomCount,
  ] = useState(0);


  const [
    showConfirm,
    setShowConfirm,
  ] = useState(false);


  const [
    ending,
    setEnding,
  ] = useState(false);


  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  const t =
    copy[language] ||
    copy.en;


  const isOrganizer =
    !!eventData &&
    !!senderId &&
    eventData.owner_id ===
      senderId;


  useEffect(() => {
    


    const savedLanguage =
      localStorage.getItem(
        "wyd_language"
      );


    


    if (savedLanguage) {
      setLanguage(
        savedLanguage
      );
    }
  }, []);


  useEffect(() => {
    if (
      !supabase ||
      !eventId
    ) {
      return;
    }


    let active =
      true;


    async function refresh() {
      const {
        data: event,
        error: eventError,
      } = await supabase!
        .from("events")
        .select(
          "id,name,description,owner_id,status,created_at,ended_at"
        )
        .eq(
          "id",
          eventId
        )
        .maybeSingle();


      if (
        active &&
        !eventError &&
        event
      ) {
        setEventData(
          event as EventData
        );
      }


      const {
        data: participants,
      } = await supabase!
        .from(
          "event_participants"
        )
        .select(
          "user_id"
        )
        .eq(
          "event_id",
          eventId
        );


      if (
        active &&
        participants
      ) {
        setParticipantCount(
          participants.length
        );
      }


      const {
        data: rooms,
      } = await supabase!
        .from("rooms")
        .select(
          "id,status"
        )
        .eq(
          "event_id",
          eventId
        );


      if (
        active &&
        rooms
      ) {
        const roomData =
          rooms as RoomSummary[];


        setRoomCount(
          roomData.length
        );


        setActiveRoomCount(
          roomData.filter(
            (room) =>
              room.status ===
              "active"
          ).length
        );
      }


      if (active) {
        setLoading(
          false
        );
      }
    }


    refresh();


    const timer =
      setInterval(
        refresh,
        3000
      );


    return () => {
      active = false;

      clearInterval(
        timer
      );
    };
  }, [
    supabase,
    eventId,
  ]);


  async function endEvent() {
    if (
      !supabase ||
      !isOrganizer ||
      ending
    ) {
      return;
    }


    setEnding(
      true
    );


    setErrorMessage(
      ""
    );


    const {
      error,
    } = await supabase.rpc(
      "end_wyd_event",
      {
        p_event_id:
          eventId,

        p_user_id:
          senderId,
      }
    );


    if (error) {
      console.error(
        "End event error:",
        error
      );


      setErrorMessage(
        t.error
      );


      setEnding(
        false
      );


      return;
    }


    setShowConfirm(
      false
    );


    setEnding(
      false
    );


    router.replace(
      `/event/${eventId}`
    );


    router.refresh();
  }


  function formatDate(
    value: string
  ) {
    return new Intl.DateTimeFormat(
      language === "ko"
        ? "ko-KR"
        : language === "es"
        ? "es-ES"
        : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(
      new Date(value)
    );
  }


  if (!supabase) {
    return (
      <SimpleState
        title="Supabase error"
        description="Supabase settings are missing."
        buttonText={
          t.backEvent
        }
        onClick={() =>
          router.push(
            `/event/${eventId}`
          )
        }
      />
    );
  }


  if (loading) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#fffefb]">

        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-[#2868d8]" />

      </main>
    );
  }


  if (
    !eventData ||
    !isOrganizer
  ) {
    return (
      <SimpleState
        title={
          t.unauthorized
        }
        buttonText={
          t.backEvent
        }
        onClick={() =>
          router.replace(
            `/event/${eventId}`
          )
        }
      />
    );
  }


  return (
    <main className="min-h-[100dvh] bg-[#f4f4f2] text-[#101820]">

      <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-[#fffefb] px-5 pb-12 pt-6">


        {/* HEADER */}

        <header className="flex items-center justify-between">

          <button
            onClick={() =>
              router.push(
                `/event/${eventId}`
              )
            }
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f4f4f2] text-[22px]"
          >
            ‹
          </button>


          <Brand />


          <div className="h-11 w-11" />

        </header>


        {/* HERO */}

        <section className="pt-10">

          <div className="flex items-center gap-2">

            <span className="rounded-full bg-[#fff1bd] px-3 py-1.5 text-[9px] font-bold text-[#a97500]">
              {t.organizer}
            </span>


            <span
              className={`rounded-full px-3 py-1.5 text-[9px] font-bold ${
                eventData.status ===
                "ended"
                  ? "bg-[#fff1f2] text-[#ff4458]"
                  : "bg-[#eef8f1] text-[#3d965c]"
              }`}
            >
              {eventData.status ===
              "ended"
                ? "ENDED"
                : "ACTIVE"}
            </span>

          </div>


          <h1 className="mt-5 text-[38px] font-black leading-[1.05] tracking-[-0.055em]">
            {t.manage}
          </h1>


          <p className="mt-3 text-[16px] font-bold">
            {eventData.name}
          </p>


          <p className="mt-2 max-w-[340px] text-sm leading-6 text-neutral-400">
            {t.subtitle}
          </p>

        </section>


        {/* STATS */}

        <section className="pt-8">

          <div className="grid grid-cols-3 gap-2">

            <StatCard
              value={
                participantCount
              }
              label={
                t.participants
              }
            />


            <StatCard
              value={
                roomCount
              }
              label={
                t.rooms
              }
            />


            <StatCard
              value={
                activeRoomCount
              }
              label={
                t.activeRooms
              }
              active
            />

          </div>

        </section>


        {/* ENDED */}

        {eventData.status ===
        "ended" ? (

          <section className="pt-10">

            <div className="rounded-[28px] border border-[#ffd5da] bg-[#fff5f6] p-6">

              <div className="flex h-14 w-14 items-center justify-center rounded-[19px] bg-white text-[24px]">
                ✓
              </div>


              <p className="mt-5 text-[10px] font-black uppercase tracking-[0.17em] text-[#ff4458]">
                EVENT ARCHIVE
              </p>


              <h2 className="mt-2 text-[27px] font-black tracking-[-0.045em]">
                {t.ended}
              </h2>


              <p className="mt-3 text-sm leading-6 text-neutral-500">
                {t.endedDescription}
              </p>


              {eventData.ended_at && (

                <div className="mt-5 rounded-[18px] bg-white px-4 py-3">

                  <p className="text-[9px] font-bold text-neutral-400">
                    {t.endedAt}
                  </p>

                  <p className="mt-1 text-[12px] font-bold">
                    {formatDate(
                      eventData.ended_at
                    )}
                  </p>

                </div>

              )}

            </div>

          </section>

        ) : (

          /* DANGER ZONE */

          <section className="pt-10">

            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#ff4458]">
              {t.dangerZone}
            </p>


            <div className="mt-4 rounded-[28px] border border-[#ffd5da] bg-[#fff8f8] p-5">

              <div className="flex h-12 w-12 items-center justify-center rounded-[17px] bg-[#fff1f2] text-[22px]">
                !
              </div>


              <h2 className="mt-5 text-[22px] font-black tracking-[-0.04em]">
                {t.endEvent}
              </h2>


              <p className="mt-2 text-[12px] leading-6 text-neutral-500">
                {t.endDescription}
              </p>


              <button
                onClick={() => {
                  setErrorMessage(
                    ""
                  );

                  setShowConfirm(
                    true
                  );
                }}
                className="mt-6 w-full rounded-[20px] bg-[#ff4458] py-4 text-[12px] font-black text-white"
              >
                {t.endEvent}
              </button>

            </div>

          </section>

        )}

      </div>


      {/* CONFIRM */}

      {showConfirm && (

        <Sheet
          onClose={() => {
            if (!ending) {
              setShowConfirm(
                false
              );
            }
          }}
        >

          <div className="flex h-14 w-14 items-center justify-center rounded-[19px] bg-[#fff1f2] text-[25px] text-[#ff4458]">
            !
          </div>


          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-[#ff4458]">
            WYD EVENT
          </p>


          <h2 className="mt-2 text-[29px] font-black tracking-[-0.05em]">
            {t.warningTitle}
          </h2>


          <p className="mt-3 text-sm leading-6 text-neutral-500">
            {t.warningDescription}
          </p>


          <div className="mt-6 space-y-2">

            <WarningRow
              text={
                t.roomWarning
              }
            />

            <WarningRow
              text={
                t.messageWarning
              }
            />

            <WarningRow
              text={
                t.recordWarning
              }
            />

            <WarningRow
              text={
                t.helpWarning
              }
            />

          </div>


          {errorMessage && (

            <div className="mt-5 rounded-[17px] bg-red-50 px-4 py-3 text-xs text-red-500">
              {errorMessage}
            </div>

          )}


          <button
            onClick={
              endEvent
            }
            disabled={
              ending
            }
            className="mt-7 w-full rounded-[20px] bg-[#ff4458] py-4 text-sm font-black text-white disabled:bg-neutral-300"
          >
            {ending
              ? t.ending
              : t.confirm}
          </button>


          <button
            onClick={() =>
              setShowConfirm(
                false
              )
            }
            disabled={
              ending
            }
            className="mt-2 w-full rounded-[20px] bg-[#f4f4f2] py-4 text-sm font-bold disabled:opacity-40"
          >
            {t.cancel}
          </button>

        </Sheet>

      )}

    </main>
  );
}


function StatCard({
  value,
  label,
  active = false,
}: {
  value: number;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-[20px] p-4 ${
        active
          ? "bg-[#eef8f1]"
          : "bg-[#f5f5f2]"
      }`}
    >

      <p
        className={`text-[23px] font-black ${
          active
            ? "text-[#3d965c]"
            : ""
        }`}
      >
        {value}
      </p>


      <p className="mt-1 text-[9px] leading-4 text-neutral-400">
        {label}
      </p>

    </div>
  );
}


function WarningRow({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-start rounded-[17px] bg-[#f5f5f2] px-4 py-3">

      <span className="mt-0.5 text-[11px] font-black text-[#ff4458]">
        •
      </span>


      <p className="ml-3 text-[11px] leading-5 text-neutral-600">
        {text}
      </p>

    </div>
  );
}


function Brand() {
  return (
    <div className="relative inline-block">

      <p className="text-[21px] font-black tracking-[-0.06em]">
        WYD
      </p>

      <span className="absolute -right-2 top-0 h-2 w-2 rounded-full bg-[#FFD43B]" />

    </div>
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
      className="fixed inset-0 z-[150] flex items-end justify-center bg-black/40 p-3 backdrop-blur-sm sm:items-center"
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


function SimpleState({
  title,
  description,
  buttonText,
  onClick,
}: {
  title: string;
  description?: string;
  buttonText: string;
  onClick: () => void;
}) {
  return (
    <main className="flex min-h-[100dvh] justify-center bg-[#f4f4f2] p-4">

      <div className="flex min-h-[calc(100dvh-32px)] w-full max-w-[430px] flex-col rounded-[34px] bg-[#fffefb] px-6 py-8">

        <Brand />


        <div className="my-auto">

          <h1 className="text-[34px] font-black tracking-[-0.05em]">
            {title}
          </h1>


          {description && (

            <p className="mt-4 text-sm leading-6 text-neutral-500">
              {description}
            </p>

          )}

        </div>


        <button
          onClick={
            onClick
          }
          className="rounded-[22px] bg-[#2868d8] py-5 text-sm font-bold text-white"
        >
          {buttonText}
        </button>

      </div>

    </main>
  );
}