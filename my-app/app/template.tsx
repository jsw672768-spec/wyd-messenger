"use client";
import { usePreferredLanguage } from "@/lib/use-preferred-language";
import { useTranslation } from "@/lib/use-translation";
import AnnouncementReceipt from "@/components/announcement-receipt";
import TranslationStatus from "@/components/translation-status";

import {
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import AuthStatus from '@/components/auth-status';
import { getSupabaseBrowser, useWydIdentity } from '@/lib/supabase-browser';


type HelpAlert = {
  id: number;
  event_id: string;
  room_id: string;
  message_id: number;
  sender_id: string;
  sender_name: string;
  room_name: string;
  message_text: string;

  status:
    | "open"
    | "acknowledged"
    | "resolved";

  created_at: string;
};


type EventAnnouncement = {
  id: number;
  event_id: string;
  author_id: string;
  content: string;
  source_language: string;

  priority:
    | "normal"
    | "important"
    | "urgent";

  created_at: string;
};


type EventSummary = {
  id: string;
  name: string;
};


export default function Template({
  children,
}: {
  children: ReactNode;
}) {
  const router =
    useRouter();

  const pathname =
    usePathname();


  const supabase = useMemo(() => getSupabaseBrowser(), []);


  const audioContextRef =
    useRef<AudioContext | null>(
      null
    );


  const { senderId } = useWydIdentity();


  const [language] = usePreferredLanguage();


  const [
    ownedEvents,
    setOwnedEvents,
  ] = useState<EventSummary[]>(
    []
  );


  const [
    memberEvents,
    setMemberEvents,
  ] = useState<EventSummary[]>(
    []
  );


  // =====================================
  // HELP
  // =====================================

  const [
    loadedHelpAlert,
    setCurrentHelpAlert,
  ] = useState<HelpAlert | null>(
    null
  );


  const [
    notificationPermission,
    setNotificationPermission,
  ] = useState<
    NotificationPermission |
      "unsupported"
  >("default");


  // =====================================
  // EVENT ANNOUNCEMENT
  // =====================================

  const [
    loadedAnnouncement,
    setCurrentAnnouncement,
  ] = useState<EventAnnouncement | null>(
    null
  );


  


  const [
    showingOriginal,
    setShowingOriginal,
  ] = useState(false);


  // =====================================
  // ANNOUNCEMENT WRITER
  // =====================================

  const [
    showAnnouncementWriter,
    setShowAnnouncementWriter,
  ] = useState(false);


  const [
    announcementDraft,
    setAnnouncementDraft,
  ] = useState("");


  const [
    announcementPriority,
    setAnnouncementPriority,
  ] = useState<
    "normal" |
      "important" |
      "urgent"
  >("normal");


  const [
    creatingAnnouncement,
    setCreatingAnnouncement,
  ] = useState(false);


  const [
    announcementError,
    setAnnouncementError,
  ] = useState("");


  const ownedEventKey = ownedEvents.map(event => event.id).sort().join(',');
  const memberEventKey = memberEvents.map(event => event.id).sort().join(',');
  const ownedEventIds = useMemo(() => ownedEventKey.split(',').filter(Boolean), [ownedEventKey]);
  const memberEventIds = useMemo(() => memberEventKey.split(',').filter(Boolean), [memberEventKey]);

  const currentHelpAlert = senderId && loadedHelpAlert && ownedEventIds.includes(loadedHelpAlert.event_id) ? loadedHelpAlert : null;
  const currentAnnouncement = senderId && loadedAnnouncement && memberEventIds.includes(loadedAnnouncement.event_id) ? loadedAnnouncement : null;

  /*
   * /event/abc123 페이지일 때만
   * 현재 이벤트 ID를 얻는다.
   */
  const currentEventId =
    pathname.match(
      /^\/event\/([^/]+)\/?$/
    )?.[1] || null;


  const currentEvent =
    currentEventId
      ? ownedEvents.find(
          (event) =>
            event.id ===
            currentEventId
        ) || null
      : null;


  const canWriteAnnouncement =
    !!currentEvent;


  const announcementEventName =
    currentAnnouncement
      ? memberEvents.find(
          (event) =>
            event.id ===
            currentAnnouncement.event_id
        )?.name ||
        "WYD Event"
      : "WYD Event";


  // =====================================
  // USER
  // =====================================

  useEffect(() => {
    


    


    


    


    if (
      "Notification" in window
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Notification permission exists only in the browser; read it once after hydration, then update from user actions.
      setNotificationPermission(
        Notification.permission
      );
    } else {
      setNotificationPermission(
        "unsupported"
      );
    }


    function prepareAudio() {
      try {
        const AudioContextClass =
          window.AudioContext ||
          (
            window as typeof window & {
              webkitAudioContext?: typeof AudioContext;
            }
          ).webkitAudioContext;


        if (
          !AudioContextClass
        ) {
          return;
        }


        if (
          !audioContextRef.current
        ) {
          audioContextRef.current =
            new AudioContextClass();
        }


        audioContextRef.current
          .resume()
          .catch(() => {});
      } catch {}
    }


    document.addEventListener(
      "pointerdown",
      prepareAudio,
      {
        once: true,
      }
    );


    document.addEventListener(
      "keydown",
      prepareAudio,
      {
        once: true,
      }
    );


    return () => {
      document.removeEventListener(
        "pointerdown",
        prepareAudio
      );

      document.removeEventListener(
        "keydown",
        prepareAudio
      );
    };
  }, []);


  /*
   * 페이지에서 언어를 바꾼 경우에도
   * 주기적으로 현재 설정을 다시 읽는다.
   */
  


  // =====================================
  // MY EVENTS
  // =====================================

  useEffect(() => {
    if (
      !supabase ||
      !senderId
    ) {
      return;
    }


    let active =
      true;


    async function refreshMyEvents() {
      /*
       * 내가 운영자인 이벤트
       */
      const managed = await supabase!.from('event_participants').select('event_id').eq('user_id', senderId).in('role', ['organizer', 'staff']);
      const { data: ownedData, error: ownedError } = await supabase!.from('events').select('id,name').in('id', (managed.data || []).map(row => row.event_id)).eq('status', 'active');

      if (
        active &&
        !ownedError &&
        ownedData
      ) {
        setOwnedEvents(
          ownedData as EventSummary[]
        );
      }


      /*
       * 내가 참가한 이벤트 ID
       */
      const {
        data: membershipData,
        error: membershipError,
      } = await supabase!
        .from(
          "event_participants"
        )
        .select("event_id")
        .eq(
          "user_id",
          senderId
        );


      if (
        !active ||
        membershipError ||
        !membershipData
      ) {
        return;
      }


      const ids =
        Array.from(
          new Set(
            membershipData.map(
              (row) =>
                String(
                  row.event_id
                )
            )
          )
        );


      if (
        ids.length === 0
      ) {
        setMemberEvents(
          []
        );

        return;
      }


      const {
        data: memberData,
        error: memberError,
      } = await supabase!
        .from("events")
        .select("id,name")
        .in(
          "id",
          ids
        )
        .eq(
          "status",
          "active"
        );


      if (
        !active ||
        memberError ||
        !memberData
      ) {
        return;
      }


      setMemberEvents(
        memberData as EventSummary[]
      );
    }


    refreshMyEvents();


    const timer =
      setInterval(
        refreshMyEvents,
        5000
      );


    return () => {
      active = false;

      clearInterval(
        timer
      );
    };
  }, [
    supabase,
    senderId,
  ]);


  // =====================================
  // HELP ALERT DATA
  // =====================================

  useEffect(() => {
    if (
      !supabase ||
      ownedEventIds.length === 0
    ) {
      return;
    }


    let active =
      true;


    async function refreshHelpAlert() {
      const {
        data,
        error,
      } = await supabase!
        .from(
          "help_alerts"
        )
        .select("*")
        .in(
          "event_id",
          ownedEventIds
        )
        .eq(
          "status",
          "open"
        )
        .order(
          "created_at",
          {
            ascending: true,
          }
        )
        .limit(1)
        .maybeSingle();


      if (
        !active ||
        error
      ) {
        return;
      }


      setCurrentHelpAlert(
        data
          ? (data as HelpAlert)
          : null
      );
    }


    refreshHelpAlert();


    const channel =
      supabase.channel(
        `wyd-help-alerts-${senderId}`
      );


    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table:
            "help_alerts",
        },
        (payload) => {
          const incoming =
            payload.new as HelpAlert;


          if (
            incoming.status !==
            "open"
          ) {
            return;
          }


          if (
            !ownedEventIds.includes(
              incoming.event_id
            )
          ) {
            return;
          }


          setCurrentHelpAlert(
            (current) =>
              current ||
              incoming
          );
        }
      )
      .subscribe();


    const timer =
      setInterval(
        refreshHelpAlert,
        3000
      );


    return () => {
      active = false;

      clearInterval(
        timer
      );

      supabase.removeChannel(
        channel
      );
    };
  }, [
    supabase,
    senderId,
    ownedEventIds,
  ]);


  // =====================================
  // HELP ALARM
  // =====================================

  useEffect(() => {
    if (
      !currentHelpAlert
    ) {
      return;
    }


    function playSound() {
      try {
        const context =
          audioContextRef.current;


        if (
          !context ||
          context.state !==
            "running"
        ) {
          return;
        }


        const now =
          context.currentTime;


        [
          0,
          0.32,
          0.64,
        ].forEach(
          (offset) => {
            const oscillator =
              context.createOscillator();

            const gain =
              context.createGain();


            oscillator.type =
              "square";


            oscillator.frequency.value =
              880;


            gain.gain.setValueAtTime(
              0.11,
              now + offset
            );


            gain.gain.exponentialRampToValueAtTime(
              0.001,
              now +
                offset +
                0.24
            );


            oscillator.connect(
              gain
            );


            gain.connect(
              context.destination
            );


            oscillator.start(
              now + offset
            );


            oscillator.stop(
              now +
                offset +
                0.25
            );
          }
        );
      } catch {}
    }


    function vibrate() {
      try {
        navigator.vibrate?.([
          700,
          250,
          700,
          250,
          1100,
        ]);
      } catch {}
    }


    function systemNotification() {
      if (!currentHelpAlert) return;
      try {
        if (
          !(
            "Notification" in
            window
          )
        ) {
          return;
        }


        if (
          Notification.permission !==
          "granted"
        ) {
          return;
        }


        new Notification(
          "🆘 WYD HELP",
          {
            body:
              `${currentHelpAlert.sender_name}: ${currentHelpAlert.message_text}`,

            tag:
              `wyd-help-${currentHelpAlert.id}`,

            requireInteraction:
              true,
          }
        );
      } catch {}
    }


    function fireAlarm() {
      playSound();
      vibrate();
      systemNotification();
    }


    fireAlarm();


    const timer =
      setInterval(
        fireAlarm,
        8000
      );


    return () => {
      clearInterval(
        timer
      );


      try {
        navigator.vibrate?.(
          0
        );
      } catch {}
    };
  }, [
    currentHelpAlert,
  ]);


  // =====================================
  // EVENT ANNOUNCEMENTS
  // =====================================

  useEffect(() => {
    if (
      !supabase ||
      !senderId ||
      memberEventIds.length === 0
    ) {
      return;
    }


    let active =
      true;


    async function refreshAnnouncement() {
      /*
       * 최근 공지들을 불러온다.
       */
      const {
        data: announcementData,
        error: announcementError,
      } = await supabase!
        .from(
          "event_announcements"
        )
        .select("*")
        .in(
          "event_id",
          memberEventIds
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(50);


      if (
        !active ||
        announcementError ||
        !announcementData
      ) {
        return;
      }


      /*
       * 내가 이미 확인한 공지
       */
      const {
        data: readData,
        error: readError,
      } = await supabase!
        .from(
          "event_announcement_reads"
        )
        .select(
          "announcement_id,acknowledged_at"
        )
        .eq(
          "user_id",
          senderId
        )
        .in(
          "event_id",
          memberEventIds
        );


      if (
        !active ||
        readError ||
        !readData
      ) {
        return;
      }


      const readIds =
        new Set(
          readData.filter(row => row.acknowledged_at).map(
            (row) =>
              Number(
                row.announcement_id
              )
          )
        );


      const unread =
        (
          announcementData as EventAnnouncement[]
        ).find(
          (announcement) =>
            !readIds.has(
              announcement.id
            )
        ) || null;


      setCurrentAnnouncement(current => JSON.stringify(current) === JSON.stringify(unread) ? current : unread);
    }


    refreshAnnouncement();


    const channel =
      supabase.channel(
        `wyd-event-announcements-${senderId}`
      );


    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table:
            "event_announcements",
        },
        (payload) => {
          const incoming =
            payload.new as EventAnnouncement;


          if (
            !memberEventIds.includes(
              incoming.event_id
            )
          ) {
            return;
          }


          /*
           * 내가 직접 보낸 공지는
           * 내 화면을 덮지 않는다.
           */
          if (
            incoming.author_id ===
            senderId
          ) {
            return;
          }


          setCurrentAnnouncement(
            (current) =>
              current ||
              incoming
          );
        }
      )
      .subscribe();


    const timer =
      setInterval(
        refreshAnnouncement,
        3000
      );


    return () => {
      active = false;

      clearInterval(
        timer
      );

      supabase.removeChannel(
        channel
      );
    };
  }, [
    supabase,
    senderId,
    memberEventIds,
  ]);


  // =====================================
  const announcementResult = useTranslation(currentAnnouncement?.content || '', currentAnnouncement?.source_language || '', language);
  const translatedAnnouncement = announcementResult.text;
  // TRANSLATE EVENT ANNOUNCEMENT
  // =====================================

  


  // =====================================
  // EVENT ANNOUNCEMENT NOTIFICATION
  // =====================================

  useEffect(() => {
    if (
      !currentAnnouncement
    ) {
      return;
    }


    try {
      if (
        !(
          "Notification" in
          window
        )
      ) {
        return;
      }


      if (
        Notification.permission !==
        "granted"
      ) {
        return;
      }


      new Notification(
        currentAnnouncement.priority ===
          "urgent"
          ? "🚨 WYD 긴급 공지"
          : "📢 WYD 공지",
        {
          body:
            currentAnnouncement.content,

          tag:
            `wyd-event-announcement-${currentAnnouncement.id}`,
        }
      );
    } catch {}
  }, [
    currentAnnouncement,
  ]);


  // =====================================
  // NOTIFICATION PERMISSION
  // =====================================

  async function enableNotifications() {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (
          window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
          }
        ).webkitAudioContext;


      if (
        AudioContextClass &&
        !audioContextRef.current
      ) {
        audioContextRef.current =
          new AudioContextClass();


        await audioContextRef.current.resume();
      }


      if (
        !(
          "Notification" in
          window
        )
      ) {
        setNotificationPermission(
          "unsupported"
        );

        return;
      }


      const result =
        await Notification.requestPermission();


      setNotificationPermission(
        result
      );
    } catch {}
  }


  // =====================================
  // HELP ACKNOWLEDGE
  // =====================================

  async function acknowledgeHelp(
    openRoom: boolean
  ) {
    if (
      !supabase ||
      !currentHelpAlert
    ) {
      return;
    }


    const alert =
      currentHelpAlert;


    const {
      error,
    } = await supabase
      .from(
        "help_alerts"
      )
      .update({
        status:
          "acknowledged",

        acknowledged_at:
          new Date()
            .toISOString(),

        acknowledged_by:
          senderId,
      })
      .eq(
        "id",
        alert.id
      );


    if (error) {
      console.error(
        "Help alert acknowledge error:",
        error
      );

      return;
    }


    setCurrentHelpAlert(
      null
    );


    try {
      navigator.vibrate?.(
        0
      );
    } catch {}


    if (openRoom) {
      router.push(
        `/room/${alert.room_id}`
      );
    }
  }


  // =====================================
  // ANNOUNCEMENT READ
  // =====================================

  async function acknowledgeAnnouncement() {
    if (
      !supabase ||
      !currentAnnouncement
    ) {
      return;
    }


    const announcement =
      currentAnnouncement;


    const { error } = await supabase.rpc('acknowledge_wyd_announcement', { p_scope: 'event', p_announcement_id: announcement.id });

    if (
      error &&
      error.code !==
        "23505"
    ) {
      console.error(
        "Event announcement read error:",
        error
      );

      return;
    }


    setCurrentAnnouncement(
      null
    );
  }


  // =====================================
  // CREATE EVENT ANNOUNCEMENT
  // =====================================

  async function createEventAnnouncement() {
    if (
      !supabase ||
      !currentEvent ||
      !announcementDraft.trim() ||
      creatingAnnouncement
    ) {
      return;
    }


    setCreatingAnnouncement(
      true
    );

    setAnnouncementError(
      ""
    );


    const {
      data,
      error,
    } = await supabase
      .from(
        "event_announcements"
      )
      .insert({
        event_id:
          currentEvent.id,

        author_id:
          senderId,

        content:
          announcementDraft.trim(),

        source_language:
          language,

        priority:
          announcementPriority,
      })
      .select("*")
      .single();


    if (
      error ||
      !data
    ) {
      console.error(
        "Create event announcement error:",
        error
      );


      setAnnouncementError(
        "공지를 보내지 못했습니다."
      );


      setCreatingAnnouncement(
        false
      );

      return;
    }


    /*
     * 작성자는 자신의 공지를 이미 확인한 것으로 처리.
     */
    const announcement =
      data as EventAnnouncement;


    const {
      error: readError,
    } = await supabase
      .from(
        "event_announcement_reads"
      )
      .insert({
        announcement_id:
          announcement.id,

        event_id:
          announcement.event_id,

        user_id:
          senderId,
      });


    if (
      readError &&
      readError.code !==
        "23505"
    ) {
      console.error(
        "Author announcement read error:",
        readError
      );
    }


    setAnnouncementDraft(
      ""
    );

    setAnnouncementPriority(
      "normal"
    );

    setCreatingAnnouncement(
      false
    );

    setShowAnnouncementWriter(
      false
    );
  }


  const displayedAnnouncementText =
    currentAnnouncement
      ? showingOriginal ||
        currentAnnouncement.source_language ===
          language
        ? currentAnnouncement.content
        : translatedAnnouncement ||
          currentAnnouncement.content
      : "";


  return (
    <>

      <AuthStatus />
      {children}


      {/* =================================
          ORGANIZER ANNOUNCEMENT BUTTON
      ================================= */}

      {canWriteAnnouncement &&
        !currentHelpAlert && (

          <button
            onClick={() => {
              setAnnouncementDraft(
                ""
              );

              setAnnouncementPriority(
                "normal"
              );

              setAnnouncementError(
                ""
              );

              setShowAnnouncementWriter(
                true
              );
            }}
            className="fixed bottom-5 left-5 z-[700] flex items-center gap-2 rounded-full bg-[#101820] px-5 py-3.5 text-[12px] font-bold text-white shadow-[0_12px_35px_rgba(0,0,0,0.16)]"
          >
            <span>
              📢
            </span>

            전체 공지
          </button>

        )}


      {/* =================================
          NOTIFICATION ENABLE
      ================================= */}

      {ownedEventIds.length >
        0 &&
        notificationPermission ===
          "default" &&
        !currentHelpAlert && (

          <button
            onClick={
              enableNotifications
            }
            className="fixed bottom-5 right-5 z-[700] rounded-full border border-red-100 bg-white px-4 py-3 text-[11px] font-bold text-[#ff4458] shadow-[0_12px_35px_rgba(0,0,0,0.14)]"
          >
            🆘 HELP 알림 켜기
          </button>

        )}


      {/* =================================
          ANNOUNCEMENT WRITER
      ================================= */}

      {showAnnouncementWriter &&
        currentEvent && (

          <div
            onClick={() => {
              if (
                !creatingAnnouncement
              ) {
                setShowAnnouncementWriter(
                  false
                );
              }
            }}
            className="fixed inset-0 z-[850] flex items-end justify-center bg-black/35 p-3 backdrop-blur-sm sm:items-center"
          >

            <div
              onClick={(event) =>
                event.stopPropagation()
              }
              className="w-full max-w-[410px] rounded-[32px] bg-[#fffefb] p-6 shadow-2xl"
            >

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#2868d8]">
                    WYD EVENT
                  </p>

                  <h2 className="mt-2 text-[27px] font-black tracking-[-0.045em]">
                    전체 공지
                  </h2>

                  <p className="mt-2 text-[11px] text-neutral-400">
                    {currentEvent.name}
                  </p>

                </div>


                <button
                  onClick={() =>
                    setShowAnnouncementWriter(
                      false
                    )
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4f4f2] text-xl"
                >
                  ×
                </button>

              </div>


              <textarea
                autoFocus
                value={
                  announcementDraft
                }
                onChange={(event) =>
                  setAnnouncementDraft(
                    event.target.value
                  )
                }
                rows={5}
                placeholder="모든 참가자에게 전달할 내용을 입력하세요."
                className="mt-6 w-full resize-none rounded-[22px] bg-[#f4f4f2] px-4 py-4 text-sm leading-6 outline-none"
              />


              <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400">
                중요도
              </p>


              <div className="mt-3 grid grid-cols-3 gap-2">

                <PriorityButton
                  active={
                    announcementPriority ===
                    "normal"
                  }
                  label="일반"
                  type="normal"
                  onClick={() =>
                    setAnnouncementPriority(
                      "normal"
                    )
                  }
                />


                <PriorityButton
                  active={
                    announcementPriority ===
                    "important"
                  }
                  label="중요"
                  type="important"
                  onClick={() =>
                    setAnnouncementPriority(
                      "important"
                    )
                  }
                />


                <PriorityButton
                  active={
                    announcementPriority ===
                    "urgent"
                  }
                  label="긴급"
                  type="urgent"
                  onClick={() =>
                    setAnnouncementPriority(
                      "urgent"
                    )
                  }
                />

              </div>


              {announcementError && (

                <div className="mt-4 rounded-[17px] bg-red-50 px-4 py-3 text-xs text-red-500">
                  {announcementError}
                </div>

              )}


              <button
                onClick={
                  createEventAnnouncement
                }
                disabled={
                  !announcementDraft.trim() ||
                  creatingAnnouncement
                }
                className={`mt-6 w-full rounded-[20px] py-4 text-sm font-black text-white disabled:bg-neutral-200 ${
                  announcementPriority ===
                  "urgent"
                    ? "bg-[#ff4458]"
                    : "bg-[#2868d8]"
                }`}
              >
                {creatingAnnouncement
                  ? "보내는 중..."
                  : announcementPriority ===
                    "urgent"
                  ? "🚨 긴급 공지 보내기"
                  : "📢 전체 공지 보내기"}
              </button>

            </div>

          </div>

        )}


      {/* =================================
          NORMAL / IMPORTANT ANNOUNCEMENT
      ================================= */}

      {currentAnnouncement &&
        currentAnnouncement.priority !==
          "urgent" &&
        !currentHelpAlert && (

          <div className="fixed left-1/2 top-4 z-[900] w-[calc(100%-24px)] max-w-[410px] -translate-x-1/2">

            <div
              className={`rounded-[26px] border bg-[#fffefb] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] ${
                currentAnnouncement.priority ===
                "important"
                  ? "border-[#ffd964]"
                  : "border-[#dce9ff]"
              }`}
            >

              <div className="flex items-start gap-3">

                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] text-lg ${
                    currentAnnouncement.priority ===
                    "important"
                      ? "bg-[#fff3c9]"
                      : "bg-[#eef5ff]"
                  }`}
                >
                  {currentAnnouncement.priority ===
                  "important"
                    ? "!"
                    : "📢"}
                </div>


                <div className="min-w-0 flex-1">

                  <p
                    className={`text-[9px] font-black uppercase tracking-[0.16em] ${
                      currentAnnouncement.priority ===
                      "important"
                        ? "text-[#b47b00]"
                        : "text-[#2868d8]"
                    }`}
                  >
                    {currentAnnouncement.priority ===
                    "important"
                      ? "IMPORTANT"
                      : "EVENT ANNOUNCEMENT"}
                  </p>


                  <p className="mt-1 text-[12px] font-bold">
                    {announcementEventName}
                  </p>

                </div>

              </div>


              <p className="mt-4 whitespace-pre-wrap break-words text-[14px] font-semibold leading-6">
                {displayedAnnouncementText}
              </p>
                  <TranslationStatus status={announcementResult.status} language={language} retry={announcementResult.retry} />
                  <AnnouncementReceipt key={currentAnnouncement.id} scope="event" id={currentAnnouncement.id} parentId={currentAnnouncement.event_id} userId={senderId} language={language} />


              {currentAnnouncement.source_language !==
                language && (

                <button
                  onClick={() =>
                    setShowingOriginal(
                      (current) =>
                        !current
                    )
                  }
                  className="mt-3 text-[10px] font-bold text-[#2868d8]"
                >
                  {showingOriginal
                    ? "번역 보기"
                    : "원문 보기"}
                </button>

              )}


              <button
                onClick={
                  acknowledgeAnnouncement
                }
                className="mt-5 w-full rounded-[18px] bg-[#101820] py-3.5 text-[12px] font-bold text-white"
              >
                확인
              </button>

            </div>

          </div>

        )}


      {/* =================================
          URGENT EVENT ANNOUNCEMENT
      ================================= */}

      {currentAnnouncement &&
        currentAnnouncement.priority ===
          "urgent" &&
        !currentHelpAlert && (

          <div className="fixed inset-0 z-[950] flex items-center justify-center bg-[#101820]/75 p-4 backdrop-blur-md">

            <div className="w-full max-w-[390px] overflow-hidden rounded-[32px] bg-[#fffefb] shadow-2xl">

              <div className="bg-[#ff4458] px-6 py-5 text-white">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                      WYD EVENT
                    </p>

                    <h2 className="mt-2 text-[27px] font-black tracking-[-0.045em]">
                      🚨 긴급 공지
                    </h2>

                  </div>


                  <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-full bg-white/20 text-2xl font-black">
                    !
                  </div>

                </div>

              </div>


              <div className="p-6">

                <p className="text-[11px] font-bold text-neutral-400">
                  {announcementEventName}
                </p>


                <div className="mt-4 rounded-[20px] bg-[#fff1f2] p-4">

                  <p className="whitespace-pre-wrap break-words text-[16px] font-black leading-7">
                    {displayedAnnouncementText}
                  </p>
                  <TranslationStatus status={announcementResult.status} language={language} retry={announcementResult.retry} />
                  <AnnouncementReceipt key={currentAnnouncement.id} scope="event" id={currentAnnouncement.id} parentId={currentAnnouncement.event_id} userId={senderId} language={language} />

                </div>


                {currentAnnouncement.source_language !==
                  language && (

                  <button
                    onClick={() =>
                      setShowingOriginal(
                        (current) =>
                          !current
                      )
                    }
                    className="mt-4 text-[10px] font-bold text-[#2868d8]"
                  >
                    {showingOriginal
                      ? "번역 보기"
                      : "원문 보기"}
                  </button>

                )}


                <button
                  onClick={
                    acknowledgeAnnouncement
                  }
                  className="mt-7 w-full rounded-[20px] bg-[#ff4458] py-4 text-sm font-black text-white"
                >
                  확인했습니다
                </button>

              </div>

            </div>

          </div>

        )}


      {/* =================================
          HELP EMERGENCY
          HELP가 모든 공지보다 최우선
      ================================= */}

      {currentHelpAlert && (

        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#101820]/75 p-4 backdrop-blur-md">

          <div className="w-full max-w-[390px] overflow-hidden rounded-[32px] bg-[#fffefb] shadow-2xl">

            <div className="bg-[#ff4458] px-6 py-5 text-white">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                    WYD EMERGENCY
                  </p>

                  <h2 className="mt-2 text-[27px] font-black tracking-[-0.045em]">
                    🆘 HELP REQUEST
                  </h2>

                </div>


                <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-full bg-white/20 text-2xl">
                  !
                </div>

              </div>

            </div>


            <div className="p-6">

              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#ff4458]">
                {currentHelpAlert.room_name}
              </p>


              <p className="mt-3 text-[17px] font-black">
                {currentHelpAlert.sender_name}
              </p>


              <div className="mt-4 rounded-[20px] bg-[#fff1f2] p-4">

                <p className="whitespace-pre-wrap break-words text-[15px] font-semibold leading-6">
                  {currentHelpAlert.message_text}
                </p>

              </div>


              <div className="mt-4 flex items-center gap-2">

                <span className="h-2 w-2 animate-pulse rounded-full bg-[#ff4458]" />

                <p className="text-[10px] font-semibold text-[#ff4458]">
                  확인할 때까지 8초마다 긴급 알림이 반복됩니다.
                </p>

              </div>


              <button
                onClick={() =>
                  acknowledgeHelp(
                    true
                  )
                }
                className="mt-7 w-full rounded-[20px] bg-[#ff4458] py-4 text-sm font-black text-white"
              >
                🆘 HELP 채팅방 바로 열기
              </button>


              <button
                onClick={() =>
                  acknowledgeHelp(
                    false
                  )
                }
                className="mt-2 w-full rounded-[20px] bg-[#f4f4f2] py-4 text-sm font-bold"
              >
                확인
              </button>

            </div>

          </div>

        </div>

      )}

    </>
  );
}


function PriorityButton({
  active,
  label,
  type,
  onClick,
}: {
  active: boolean;
  label: string;

  type:
    | "normal"
    | "important"
    | "urgent";

  onClick: () => void;
}) {
  let className =
    "border-neutral-100 bg-[#f5f5f2] text-neutral-500";


  if (active) {
    if (
      type === "urgent"
    ) {
      className =
        "border-[#ff4458] bg-[#fff1f2] text-[#ff4458]";
    } else if (
      type === "important"
    ) {
      className =
        "border-[#efb632] bg-[#fff7dd] text-[#ad7700]";
    } else {
      className =
        "border-[#2868d8] bg-[#eef5ff] text-[#2868d8]";
    }
  }


  return (
    <button
      onClick={
        onClick
      }
      className={`rounded-[16px] border py-3 text-[11px] font-bold ${className}`}
    >
      {label}
    </button>
  );
}