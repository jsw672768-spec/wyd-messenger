"use client";

import {
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { translateText, translationKey } from "@/lib/translation-client";
import { QRCodeSVG } from "qrcode.react";

type Message = {
  id: number;
  room_id: string;
  sender_id: string;
  content: string;
  source_language: string;
  created_at: string;
};

type Announcement = {
  id: number;
  room_id: string;
  author_id: string;
  content: string;
  source_language: string;
  priority: "normal" | "important" | "urgent";
  created_at: string;
};

type Participant = {
  user_id: string;
  display_name: string;
  language: string;
};

const languages = [
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
    online: "online",
    menu: "Room menu",
    participants: "Participants",
    language: "Language",
    announcements: "Announcements",
    qr: "QR code",
    changeName: "Change name",
    writeAnnouncement: "Write announcement",

    leave: "Leave room",
    endRoom: "End room",

    leaveTitle: "Leave this room?",
    leaveDescription:
      "You can join again later using the QR code.",
    leaveEventDescription:
      "You will return to the event. You can enter this or another room anytime.",
    leaveButton: "Leave",

    endTitle: "End this room?",
    endDescription:
      "Everyone will be disconnected and this QR will no longer reopen the room.",
    endButton: "End room",

    endedTitle: "This room has ended.",
    endedDescription:
      "The host ended this conversation. This room can no longer be joined.",

    goHome: "Back to WYD",
    backToEvent: "Back to event",

    messagePlaceholder: "Message",
    noMessages: "Start the conversation.",

    original: "Original",
    translated: "Translated",

    host: "Host",
    you: "You",

    announcement: "Announcement",
    newAnnouncement: "New announcement",
    editAnnouncement: "Edit announcement",

    normal: "Normal",
    important: "Important",
    urgent: "Urgent",

    save: "Save",
    edit: "Edit",
    delete: "Delete",
    cancel: "Cancel",
    deleteQuestion: "Delete this announcement?",
    confirmed: "confirmed",

    roomQR: "Room QR",
    qrDescription: "Scan this QR code to join this room.",

    chooseLanguage: "Choose language",

    yourName: "Your name",
    nameDescription:
      "This name will be shown to people in the room.",
    enterName: "Enter your name",
    continue: "Continue",

    actions: "Actions",
    noAnnouncements: "No announcements yet.",
  },

  ko: {
    online: "명 접속 중",
    menu: "채팅방 메뉴",
    participants: "참가자",
    language: "언어",
    announcements: "공지",
    qr: "QR 코드",
    changeName: "이름 변경",
    writeAnnouncement: "공지 작성",

    leave: "채팅방 나가기",
    endRoom: "채팅방 종료",

    leaveTitle: "채팅방에서 나갈까요?",
    leaveDescription:
      "나중에 같은 QR을 이용해 다시 참여할 수 있어요.",
    leaveEventDescription:
      "이벤트 페이지로 돌아갑니다. 다른 채팅방이나 이 방에 언제든 다시 들어올 수 있어요.",
    leaveButton: "나가기",

    endTitle: "채팅방을 종료할까요?",
    endDescription:
      "모든 참가자에게 종료 화면이 표시되고 이 QR로는 더 이상 참여할 수 없어요.",
    endButton: "채팅방 종료",

    endedTitle: "채팅방이 종료되었습니다.",
    endedDescription:
      "방장이 대화를 종료했습니다. 이 채팅방에는 더 이상 참여할 수 없습니다.",

    goHome: "WYD 홈으로",
    backToEvent: "이벤트로 돌아가기",

    messagePlaceholder: "메시지",
    noMessages: "대화를 시작해보세요.",

    original: "원문",
    translated: "번역됨",

    host: "방장",
    you: "나",

    announcement: "공지",
    newAnnouncement: "새 공지",
    editAnnouncement: "공지 수정",

    normal: "일반",
    important: "중요",
    urgent: "긴급",

    save: "저장",
    edit: "수정",
    delete: "삭제",
    cancel: "취소",
    deleteQuestion: "이 공지를 삭제할까요?",
    confirmed: "확인",

    roomQR: "채팅방 QR",
    qrDescription:
      "이 QR을 스캔하면 같은 채팅방에 참여할 수 있어요.",

    chooseLanguage: "언어 선택",

    yourName: "이름",
    nameDescription:
      "채팅방 사람들에게 표시될 이름이에요.",
    enterName: "이름을 입력하세요",
    continue: "계속",

    actions: "기능",
    noAnnouncements: "아직 공지가 없어요.",
  },

  es: {
    online: "en línea",
    menu: "Menú de la sala",
    participants: "Participantes",
    language: "Idioma",
    announcements: "Anuncios",
    qr: "Código QR",
    changeName: "Cambiar nombre",
    writeAnnouncement: "Nuevo anuncio",

    leave: "Salir de la sala",
    endRoom: "Finalizar sala",

    leaveTitle: "¿Salir de la sala?",
    leaveDescription:
      "Puedes volver a entrar usando el QR.",
    leaveEventDescription:
      "Volverás al evento. Puedes entrar en esta sala o en otra cuando quieras.",
    leaveButton: "Salir",

    endTitle: "¿Finalizar esta sala?",
    endDescription:
      "Todos serán desconectados y el QR dejará de funcionar.",
    endButton: "Finalizar",

    endedTitle: "Esta sala ha terminado.",
    endedDescription:
      "El anfitrión terminó esta conversación.",

    goHome: "Volver a WYD",
    backToEvent: "Volver al evento",

    messagePlaceholder: "Mensaje",
    noMessages: "Inicia la conversación.",

    original: "Original",
    translated: "Traducido",

    host: "Host",
    you: "Tú",

    announcement: "Anuncio",
    newAnnouncement: "Nuevo anuncio",
    editAnnouncement: "Editar anuncio",

    normal: "Normal",
    important: "Importante",
    urgent: "Urgente",

    save: "Guardar",
    edit: "Editar",
    delete: "Eliminar",
    cancel: "Cancelar",
    deleteQuestion: "¿Eliminar este anuncio?",
    confirmed: "confirmado",

    roomQR: "QR de la sala",
    qrDescription: "Escanea este QR para unirte.",

    chooseLanguage: "Elegir idioma",

    yourName: "Tu nombre",
    nameDescription:
      "Este nombre será visible en la sala.",
    enterName: "Escribe tu nombre",
    continue: "Continuar",

    actions: "Acciones",
    noAnnouncements: "No hay anuncios.",
  },
};

export default function RoomPage() {
  const router = useRouter();
  const params = useParams();

  const rawId = params?.id;

  const roomId = Array.isArray(rawId)
    ? rawId[0]
    : String(rawId || "");

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      return null;
    }

    return createClient(url, key);
  }, []);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [splash, setSplash] = useState(true);

  const [senderId, setSenderId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [language, setLanguage] = useState("en");

  const [needsLanguage, setNeedsLanguage] = useState(false);
  const [needsName, setNeedsName] = useState(false);

  const [roomLoading, setRoomLoading] = useState(true);
  const [roomEnded, setRoomEnded] = useState(false);
  const [ownerId, setOwnerId] = useState("");

  /*
   * 이벤트에 속한 방인지 확인하기 위한 값.
   *
   * event_id가 있으면:
   * 방 나가기 -> /event/{event_id}
   *
   * event_id가 없으면:
   * 방 나가기 -> /
   */
  const [roomEventId, setRoomEventId] = useState<string | null>(
    null
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const [announcements, setAnnouncements] = useState<
    Announcement[]
  >([]);

  const [onlineParticipants, setOnlineParticipants] = useState<
    Participant[]
  >([]);

  const [participantDirectory, setParticipantDirectory] = useState<
    Participant[]
  >([]);

  const [readCounts, setReadCounts] = useState<
    Record<number, number>
  >({});

  const [translationFailed, setTranslationFailed] = useState(false);
  const [translationRetry, setTranslationRetry] = useState(0);
  const [roomUnavailable, setRoomUnavailable] = useState(false);

  const [messageInput, setMessageInput] = useState("");

  const [translatedMessages, setTranslatedMessages] = useState<
    Record<string, string>
  >({});

  const [
    translatedAnnouncements,
    setTranslatedAnnouncements,
  ] = useState<Record<string, string>>({});

  const [originalMessages, setOriginalMessages] = useState<
    Record<number, boolean>
  >({});

  const [
    originalAnnouncements,
    setOriginalAnnouncements,
  ] = useState<Record<number, boolean>>({});

  const [showRoomMenu, setShowRoomMenu] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showAnnouncements, setShowAnnouncements] =
    useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showNameEdit, setShowNameEdit] = useState(false);

  const [showLeaveConfirm, setShowLeaveConfirm] =
    useState(false);

  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const [nameDraft, setNameDraft] = useState("");

  const [showWriter, setShowWriter] = useState(false);

  const [editingAnnouncement, setEditingAnnouncement] =
    useState<Announcement | null>(null);

  const [announcementDraft, setAnnouncementDraft] =
    useState("");

  const [priorityDraft, setPriorityDraft] = useState<
    "normal" | "important" | "urgent"
  >("normal");

  const [deletingAnnouncement, setDeletingAnnouncement] =
    useState<Announcement | null>(null);

  const t = copy[language] || copy.en;

  const isOwner = !!senderId && senderId === ownerId;

  const latestAnnouncement = announcements[0] || null;

  const roomUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/room/${roomId}`
      : "";

  const exitButtonText = roomEventId
    ? t.backToEvent
    : t.goHome;

  const leaveDescription = roomEventId
    ? t.leaveEventDescription
    : t.leaveDescription;

  // -------------------------------------
  // LOCAL PROFILE
  // -------------------------------------

  useEffect(() => {
    const savedLanguage = localStorage.getItem("wyd_language");
    const savedName = localStorage.getItem("wyd_display_name");

    let savedSenderId = localStorage.getItem("wyd_sender_id");

    if (!savedSenderId) {
      savedSenderId = crypto.randomUUID();

      localStorage.setItem("wyd_sender_id", savedSenderId);
    }

    setSenderId(savedSenderId);

    if (savedLanguage) {
      setLanguage(savedLanguage);
      setNeedsLanguage(false);
    } else {
      setNeedsLanguage(true);
    }

    if (savedName) {
      setDisplayName(savedName);
      setNameDraft(savedName);
      setNeedsName(false);
    } else {
      setNeedsName(true);
    }

    const timer = setTimeout(() => {
      setSplash(false);
    }, 900);

    return () => clearTimeout(timer);
  }, []);

  // -------------------------------------
  // ROOM + REALTIME + FALLBACK SYNC
  // -------------------------------------

  useEffect(() => {
    if (
      !supabase ||
      !roomId ||
      !senderId ||
      !displayName ||
      !language ||
      needsLanguage ||
      needsName
    ) {
      return;
    }

    const client = supabase;

    let active = true;

    let channel: ReturnType<typeof client.channel> | null = null;

    let syncTimer: ReturnType<typeof setInterval> | null = null;

    function mergeMessage(incoming: Message) {
      setMessages((current) => {
        if (
          current.some(
            (message) => message.id === incoming.id
          )
        ) {
          return current;
        }

        return [...current, incoming].sort((a, b) =>
          a.created_at.localeCompare(b.created_at)
        );
      });
    }

    function mergeAnnouncement(incoming: Announcement) {
      setAnnouncements((current) => {
        const next = [
          incoming,
          ...current.filter(
            (item) => item.id !== incoming.id
          ),
        ];

        return next.sort((a, b) =>
          b.created_at.localeCompare(a.created_at)
        );
      });
    }

    async function refreshMessages() {
      const { data, error } = await client
        .from("messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", {
          ascending: true,
        });

      if (!active || error || !data) {
        return;
      }

      setMessages(data as Message[]);
    }

    async function refreshAnnouncements() {
      const { data, error } = await client
        .from("announcements")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", {
          ascending: false,
        });

      if (!active || error || !data) {
        return;
      }

      setAnnouncements(data as Announcement[]);
    }

    async function refreshParticipants() {
      const { data, error } = await client
        .from("room_participants")
        .select("user_id,display_name,language")
        .eq("room_id", roomId);

      if (!active || error || !data) {
        return;
      }

      setParticipantDirectory(data as Participant[]);
    }

    async function refreshReadCounts() {
      const { data, error } = await client
        .from("announcement_reads")
        .select("announcement_id,user_id")
        .eq("room_id", roomId);

      if (!active || error || !data) {
        return;
      }

      const map = new Map<number, Set<string>>();

      for (const row of data) {
        const id = Number(row.announcement_id);

        if (!map.has(id)) {
          map.set(id, new Set());
        }

        map.get(id)?.add(row.user_id);
      }

      const next: Record<number, number> = {};

      map.forEach((users, id) => {
        next[id] = users.size;
      });

      setReadCounts(next);
    }

    async function refreshRoomStatus() {
      const { data } = await client
        .from("rooms")
        .select("id,owner_id,status,event_id")
        .eq("id", roomId)
        .maybeSingle();

      if (!active || !data) {
        return;
      }

      if (data.owner_id) {
        setOwnerId(data.owner_id);
      }

      if (data.event_id) {
        setRoomEventId(data.event_id);
      } else {
        setRoomEventId(null);
      }

      if (data.status === "ended") {
        setRoomEnded(true);
      }
    }

    function syncPresence() {
      if (!channel) {
        return;
      }

      const state = channel.presenceState() as Record<
        string,
        Array<{
          user_id?: string;
          display_name?: string;
          language?: string;
        }>
      >;

      const people = new Map<string, Participant>();

      Object.values(state)
        .flat()
        .forEach((presence) => {
          if (!presence.user_id) {
            return;
          }

          people.set(presence.user_id, {
            user_id: presence.user_id,
            display_name: presence.display_name || "Guest",
            language: presence.language || "en",
          });
        });

      setOnlineParticipants(Array.from(people.values()));
    }

    async function initialize() {
      setRoomLoading(true);

      const {
        data: existingRoom,
        error: roomError,
      } = await client
        .from("rooms")
        .select("id,owner_id,status,event_id")
        .eq("id", roomId)
        .maybeSingle();

      if (roomError) {
        console.error("Room load error:", roomError);
      }

      if (existingRoom?.event_id) {
        setRoomEventId(existingRoom.event_id);
      } else {
        setRoomEventId(null);
      }

      if (existingRoom?.status === "ended") {
        setOwnerId(existingRoom.owner_id || "");
        setRoomEnded(true);
        setRoomLoading(false);

        return;
      }

      // A mistyped or stale invitation must never create a room or claim ownership.
      if (roomError || !existingRoom || !existingRoom.owner_id) {
        if (active) { setRoomUnavailable(true); setRoomLoading(false); }
        return;
      }
      const resolvedOwner = existingRoom.owner_id;
      setRoomUnavailable(false);

      if (!active) {
        return;
      }

      setOwnerId(resolvedOwner);

      const { error: participantError } = await client
        .from("room_participants")
        .upsert(
          {
            room_id: roomId,
            user_id: senderId,
            display_name: displayName,
            language,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "room_id,user_id",
          }
        );

      if (participantError) {
        console.error(
          "Participant save error:",
          participantError
        );
      }

      await Promise.all([
        refreshMessages(),
        refreshAnnouncements(),
        refreshParticipants(),
        refreshReadCounts(),
      ]);

      if (!active) {
        return;
      }

      channel = client.channel(`wyd-room-${roomId}`, {
        config: {
          presence: {
            key: senderId,
          },
        },
      });

      channel
        .on(
          "presence",
          {
            event: "sync",
          },
          syncPresence
        )
        .on(
          "presence",
          {
            event: "join",
          },
          syncPresence
        )
        .on(
          "presence",
          {
            event: "leave",
          },
          syncPresence
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            mergeMessage(payload.new as Message);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "announcements",
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            mergeAnnouncement(payload.new as Announcement);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "announcements",
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            mergeAnnouncement(payload.new as Announcement);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "announcements",
          },
          (payload) => {
            const deletedId = Number(
              (payload.old as any)?.id
            );

            setAnnouncements((current) =>
              current.filter(
                (item) => item.id !== deletedId
              )
            );
          }
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "announcement_reads",
            filter: `room_id=eq.${roomId}`,
          },
          () => {
            refreshReadCounts();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "rooms",
            filter: `id=eq.${roomId}`,
          },
          (payload) => {
            const room = payload.new as {
              status?: string;
              owner_id?: string;
              event_id?: string | null;
            };

            if (room.owner_id) {
              setOwnerId(room.owner_id);
            }

            if (room.event_id) {
              setRoomEventId(room.event_id);
            } else {
              setRoomEventId(null);
            }

            if (room.status === "ended") {
              setRoomEnded(true);

              setShowRoomMenu(false);
              setShowParticipants(false);
              setShowQR(false);
              setShowLanguage(false);
              setShowAnnouncements(false);
              setShowActions(false);
              setShowWriter(false);
              setShowLeaveConfirm(false);
              setShowEndConfirm(false);
            }
          }
        )
        .subscribe(async (status) => {
          console.log("WYD realtime:", status);

          if (status === "SUBSCRIBED") {
            await channel?.track({
              user_id: senderId,
              display_name: displayName,
              language,
              online_at: new Date().toISOString(),
            });
          }
        });

      syncTimer = setInterval(() => {
        refreshMessages();
        refreshAnnouncements();
        refreshParticipants();
        refreshReadCounts();
        refreshRoomStatus();
      }, 3000);

      setRoomLoading(false);
    }

    initialize();

    return () => {
      active = false;

      if (syncTimer) {
        clearInterval(syncTimer);
      }

      if (channel) {
        channel.untrack().catch(() => {});
        client.removeChannel(channel);
      }
    };
  }, [
    supabase,
    roomId,
    senderId,
    displayName,
    language,
    needsLanguage,
    needsName,
  ]);

  // -------------------------------------
  // SCROLL
  // -------------------------------------

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // Cache by content and target language so edits and language changes cannot
  // reuse a stale translation. Each completed request updates independently.
  useEffect(() => {
    let cancelled = false;
    if (roomEnded) return;
    setTranslationFailed(false);
    for (const [items, update] of [
      [messages, setTranslatedMessages],
      [announcements, setTranslatedAnnouncements],
    ] as const) {
      for (const item of items) {
        if (!item.content || item.source_language === language) continue;
        const key = translationKey(item, language);
        translateText(item.content, item.source_language, language).then((text) => {
          if (!cancelled) update((current) => current[key] === text ? current : { ...current, [key]: text });
        }).catch(() => { if (!cancelled) setTranslationFailed(true); });
      }
    }
    return () => { cancelled = true; };
  }, [messages, announcements, language, roomEnded, translationRetry]);

  // -------------------------------------
  // ANNOUNCEMENT READ
  // -------------------------------------

  useEffect(() => {
    if (
      !supabase ||
      !senderId ||
      !roomId ||
      roomEnded ||
      announcements.length === 0
    ) {
      return;
    }

    async function markRead() {
      for (const announcement of announcements) {
        const { error } = await supabase!
          .from("announcement_reads")
          .insert({
            announcement_id: announcement.id,
            room_id: roomId,
            user_id: senderId,
          });

        if (error && error.code !== "23505") {
          console.error("Read receipt error:", error);
        }
      }
    }

    markRead();
  }, [
    supabase,
    announcements,
    senderId,
    roomId,
    roomEnded,
  ]);

  // -------------------------------------
  // SEND MESSAGE
  // -------------------------------------

  async function sendMessage(event: FormEvent) {
    event.preventDefault();

    const content = messageInput.trim();

    if (!supabase || !content || roomEnded) {
      return;
    }

    setMessageInput("");

    const { data, error } = await supabase
      .from("messages")
      .insert({
        room_id: roomId,
        sender_id: senderId,
        content,
        source_language: language,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Send message error:", error);

      setMessageInput(content);
      return;
    }

    if (data) {
      const savedMessage = data as Message;

      setMessages((current) => {
        if (
          current.some(
            (message) => message.id === savedMessage.id
          )
        ) {
          return current;
        }

        return [...current, savedMessage].sort((a, b) =>
          a.created_at.localeCompare(b.created_at)
        );
      });
    }
  }

  // -------------------------------------
  // EXIT / LEAVE / END
  // -------------------------------------

  function returnFromRoom() {
    if (roomEventId) {
      router.replace(`/event/${roomEventId}`);
      return;
    }

    router.replace("/");
  }

  function leaveRoom() {
    setShowLeaveConfirm(false);
    returnFromRoom();
  }

  async function endRoom() {
    if (!supabase || !isOwner) {
      return;
    }

    const { error } = await supabase
      .from("rooms")
      .update({
        status: "ended",
        ended_at: new Date().toISOString(),
      })
      .eq("id", roomId)
      .eq("owner_id", senderId);

    if (error) {
      console.error("End room error:", error);
      return;
    }

    setShowEndConfirm(false);
    setRoomEnded(true);
  }

  // -------------------------------------
  // NAME
  // -------------------------------------

  function saveFirstName(name: string) {
    const clean = name.trim();

    if (!clean) {
      return;
    }

    localStorage.setItem("wyd_display_name", clean);

    setDisplayName(clean);
    setNameDraft(clean);
    setNeedsName(false);
  }

  function saveEditedName() {
    const clean = nameDraft.trim();

    if (!clean) {
      return;
    }

    localStorage.setItem("wyd_display_name", clean);

    setDisplayName(clean);
    setShowNameEdit(false);
  }

  // -------------------------------------
  // LANGUAGE
  // -------------------------------------

  function chooseLanguage(code: string) {
    localStorage.setItem("wyd_language", code);

    document.documentElement.lang = code;

    setLanguage(code);
    setNeedsLanguage(false);
    setShowLanguage(false);

    setTranslatedMessages({});
    setTranslatedAnnouncements({});
  }

  // -------------------------------------
  // ANNOUNCEMENTS
  // -------------------------------------

  function openNewAnnouncement() {
    setEditingAnnouncement(null);
    setAnnouncementDraft("");
    setPriorityDraft("normal");

    setShowActions(false);
    setShowRoomMenu(false);

    setShowWriter(true);
  }

  function openEditAnnouncement(
    announcement: Announcement
  ) {
    setEditingAnnouncement(announcement);
    setAnnouncementDraft(announcement.content);
    setPriorityDraft(announcement.priority);

    setShowAnnouncements(false);
    setShowWriter(true);
  }

  async function saveAnnouncement() {
    if (!supabase || !isOwner || roomEnded) {
      return;
    }

    const content = announcementDraft.trim();

    if (!content) {
      return;
    }

    if (editingAnnouncement) {
      const { error } = await supabase
        .from("announcements")
        .update({
          content,
          priority: priorityDraft,
          source_language: language,
        })
        .eq("id", editingAnnouncement.id);

      if (error) {
        console.error(
          "Announcement update error:",
          error
        );

        return;
      }
    } else {
      const { data, error } = await supabase
        .from("announcements")
        .insert({
          room_id: roomId,
          author_id: senderId,
          content,
          source_language: language,
          priority: priorityDraft,
        })
        .select("*")
        .single();

      if (error) {
        console.error(
          "Announcement create error:",
          error
        );

        return;
      }

      if (data) {
        setAnnouncements((current) => [
          data as Announcement,
          ...current.filter(
            (item) => item.id !== data.id
          ),
        ]);
      }
    }

    setShowWriter(false);
    setEditingAnnouncement(null);
    setAnnouncementDraft("");
  }

  async function deleteAnnouncement() {
    if (
      !supabase ||
      !deletingAnnouncement ||
      !isOwner ||
      roomEnded
    ) {
      return;
    }

    const deletingId = deletingAnnouncement.id;

    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", deletingId);

    if (error) {
      console.error(
        "Announcement delete error:",
        error
      );

      return;
    }

    setAnnouncements((current) =>
      current.filter(
        (announcement) => announcement.id !== deletingId
      )
    );

    setDeletingAnnouncement(null);
  }

  // -------------------------------------
  // HELPERS
  // -------------------------------------

  function getSenderName(id: string) {
    if (id === senderId) {
      return displayName;
    }

    const online = onlineParticipants.find(
      (participant) => participant.user_id === id
    );

    if (online) {
      return online.display_name;
    }

    const stored = participantDirectory.find(
      (participant) => participant.user_id === id
    );

    return stored?.display_name || "Guest";
  }

  function messageText(message: Message) {
    if (
      originalMessages[message.id] ||
      message.source_language === language
    ) {
      return message.content;
    }

    return translatedMessages[translationKey(message, language)] || message.content;
  }

  function announcementText(
    announcement: Announcement
  ) {
    if (
      originalAnnouncements[announcement.id] ||
      announcement.source_language === language
    ) {
      return announcement.content;
    }

    return (
      translatedAnnouncements[translationKey(announcement, language)] ||
      announcement.content
    );
  }

  // -------------------------------------
  // SPLASH
  // -------------------------------------

  if (splash) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#fffefb]">
        <div className="text-center">
          <div className="relative inline-block">
            <h1 className="animate-[brandIntro_0.8s_ease-out_forwards] text-[56px] font-black tracking-[-0.07em] text-[#101820]">
              WYD
            </h1>

            <span className="absolute -right-3 top-1 h-3 w-3 rounded-full bg-[#FFD43B]" />
          </div>

          <p className="animate-[brandSub_1s_ease-out_forwards] text-[10px] lowercase tracking-[0.42em] text-neutral-400">
            messenger
          </p>
        </div>
      </main>
    );
  }

  if (needsLanguage) {
    return (
      <LanguageScreen
        language={language}
        onSelect={chooseLanguage}
      />
    );
  }

  if (needsName) {
    return (
      <NameScreen
        title={t.yourName}
        description={t.nameDescription}
        placeholder={t.enterName}
        buttonText={t.continue}
        onSave={saveFirstName}
      />
    );
  }

  if (!supabase) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#fffefb] p-6">
        <div className="max-w-[350px] rounded-[28px] border border-red-100 bg-red-50 p-6">
          <p className="font-bold text-red-600">
            Supabase settings are missing.
          </p>

          <p className="mt-2 text-sm leading-6 text-red-500">
            Check NEXT_PUBLIC_SUPABASE_URL and
            NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.
          </p>
        </div>
      </main>
    );
  }

  if (roomUnavailable) {
    return <main className="grid min-h-[100dvh] place-items-center bg-[#fffefb] p-6 text-[#101820]"><div className="max-w-sm"><h1 className="text-2xl font-bold">{language === 'ko' ? '방에 입장할 수 없어요' : 'Unable to join this room'}</h1><p className="my-5 text-sm leading-6">{language === 'ko' ? '연결 상태와 초대 링크를 확인하거나 진행자에게 새 QR을 요청하세요.' : 'Check your connection and invitation, or ask your host for a new QR.'}</p><button onClick={() => window.location.reload()} className="rounded-full bg-[#101820] px-5 py-3 text-white">{language === 'ko' ? '다시 시도' : 'Retry'}</button><button onClick={() => router.push('/')} className="ml-4 px-4 py-3">{t.goHome}</button></div></main>;
  }

  if (roomEnded && !roomLoading) {
    return (
      <main className="flex min-h-[100dvh] justify-center bg-[#f4f4f2] p-4 text-[#101820]">
        <div className="flex min-h-[calc(100dvh-32px)] w-full max-w-[430px] flex-col rounded-[34px] bg-[#fffefb] px-6 py-8">
          <Brand />

          <div className="my-auto pb-14">
            <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#fff1f2] text-[26px] text-[#ff4458]">
              ×
            </div>

            <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.18em] text-[#ff4458]">
              Room ended
            </p>

            <h2 className="mt-3 text-[38px] font-bold leading-[1.05] tracking-[-0.055em]">
              {t.endedTitle}
            </h2>

            <p className="mt-5 text-sm leading-6 text-neutral-500">
              {t.endedDescription}
            </p>
          </div>

          <button
            onClick={returnFromRoom}
            className="w-full rounded-[22px] bg-[#2868d8] py-5 text-sm font-bold text-white"
          >
            {exitButtonText}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="h-[100dvh] bg-[#f4f4f2] text-[#101820]">
      <div className="mx-auto flex h-full w-full max-w-[430px] flex-col overflow-hidden bg-[#fffefb]">

        {translationFailed && <div role="status" className="bg-amber-50 px-4 py-2 text-xs text-amber-900">{language === 'ko' ? '일부 번역을 불러오지 못해 원문을 표시합니다.' : 'Some translations are unavailable. Showing original text.'}<button onClick={() => setTranslationRetry((value) => value + 1)} className="ml-2 underline">{language === 'ko' ? '다시 번역' : 'Retry'}</button></div>}
        {/* HEADER */}

        <header className="shrink-0 border-b border-neutral-100 bg-[#fffefb]/95 px-4 pb-3 pt-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">

            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f5f5f2] text-[22px]"
            >
              ‹
            </button>

            <button
              onClick={() => setShowRoomMenu(true)}
              className="flex flex-col items-center px-4"
            >
              <div className="relative">
                <p className="text-[18px] font-black tracking-[-0.055em]">
                  WYD
                </p>

                <span className="absolute -right-2 top-0 h-2 w-2 rounded-full bg-[#FFD43B]" />
              </div>

              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#46b96b]" />

                <span className="text-[10px] text-neutral-400">
                  {onlineParticipants.length} {t.online}
                </span>
              </div>
            </button>

            <button
              onClick={() => setShowQR(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eef5ff] text-[#2868d8]"
            >
              <QrIcon />
            </button>
          </div>
        </header>

        {/* PINNED ANNOUNCEMENT */}

        {latestAnnouncement && (
          <button
            onClick={() => setShowAnnouncements(true)}
            className={`mx-4 mt-3 flex shrink-0 items-center gap-3 rounded-[20px] border px-4 py-3 text-left ${
              latestAnnouncement.priority === "urgent"
                ? "border-red-100 bg-[#fff5f5]"
                : latestAnnouncement.priority === "important"
                ? "border-[#ffe9aa] bg-[#fffaf0]"
                : "border-[#dce9ff] bg-[#f7fbff]"
            }`}
          >
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                latestAnnouncement.priority === "urgent"
                  ? "bg-[#ff4458]"
                  : latestAnnouncement.priority === "important"
                  ? "bg-[#f5b51b]"
                  : "bg-[#2868d8]"
              }`}
            />

            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-neutral-400">
                {t.announcement}
              </p>

              <p className="mt-0.5 truncate text-[12px] font-semibold">
                {announcementText(latestAnnouncement)}
              </p>
            </div>

            <span className="text-neutral-300">›</span>
          </button>
        )}

        {/* MESSAGES */}

        <section className="flex-1 overflow-y-auto px-4 pb-4 pt-5">
          {roomLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-neutral-200 border-t-[#2868d8]" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center pb-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#eef5ff] text-[26px] text-[#2868d8]">
                •••
              </div>

              <p className="mt-4 text-sm font-semibold">
                {t.noMessages}
              </p>

              <p className="mt-1 text-[11px] text-neutral-400">
                WYD · {roomId}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const mine = message.sender_id === senderId;

                const translated =
                  message.source_language !== language && Boolean(translatedMessages[translationKey(message, language)]);

                const showingOriginal =
                  !!originalMessages[message.id];

                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      mine ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div className="max-w-[82%]">
                      {!mine && (
                        <p className="mb-1.5 ml-2 text-[10px] font-semibold text-neutral-400">
                          {getSenderName(message.sender_id)}
                        </p>
                      )}

                      <div
                        className={`rounded-[23px] px-4 py-3 ${
                          mine
                            ? "rounded-br-[7px] bg-[#2868d8] text-white shadow-[0_8px_20px_rgba(40,104,216,0.16)]"
                            : "rounded-bl-[7px] border border-neutral-100 bg-white shadow-[0_7px_22px_rgba(0,0,0,0.045)]"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words text-[14px] leading-6">
                          {messageText(message)}
                        </p>
                      </div>

                      {translated && (
                        <div
                          className={`mt-1.5 flex items-center gap-2 ${
                            mine
                              ? "justify-end pr-1"
                              : "pl-1"
                          }`}
                        >
                          <span className="text-[9px] text-neutral-400">
                            {showingOriginal
                              ? t.original
                              : t.translated}
                          </span>

                          <button
                            onClick={() =>
                              setOriginalMessages((current) => ({
                                ...current,
                                [message.id]:
                                  !current[message.id],
                              }))
                            }
                            className="text-[9px] font-semibold text-[#2868d8]"
                          >
                            {showingOriginal
                              ? t.translated
                              : t.original}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>
          )}
        </section>

        {/* INPUT */}

        <div className="shrink-0 border-t border-neutral-100 bg-[#fffefb] px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
          <form
            onSubmit={sendMessage}
            className="flex items-end gap-2"
          >
            <button
              type="button"
              onClick={() =>
                isOwner
                  ? setShowActions(true)
                  : setShowQR(true)
              }
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[25px] ${
                isOwner
                  ? "bg-[#fff3cd] text-[#e7a30c]"
                  : "bg-[#eef5ff] text-[#2868d8]"
              }`}
            >
              {isOwner ? "+" : "⌗"}
            </button>

            <div className="flex min-h-11 flex-1 items-center rounded-[22px] bg-[#f4f4f2] px-4">
              <input
                value={messageInput}
                onChange={(event) =>
                  setMessageInput(event.target.value)
                }
                placeholder={t.messagePlaceholder}
                className="min-w-0 flex-1 bg-transparent py-3 text-[14px] outline-none placeholder:text-neutral-400"
              />
            </div>

            <button
              type="submit"
              disabled={!messageInput.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2868d8] text-[20px] text-white disabled:bg-neutral-200"
            >
              ↑
            </button>
          </form>
        </div>
      </div>

      {/* ROOM MENU */}

      {showRoomMenu && (
        <Sheet onClose={() => setShowRoomMenu(false)}>
          <SheetHeader
            eyebrow="WYD"
            title={t.menu}
            onClose={() => setShowRoomMenu(false)}
          />

          <div className="mt-6 space-y-2">
            <MenuRow
              icon="●"
              iconClass="bg-[#eef8f1] text-[#46a968]"
              title={t.participants}
              detail={`${onlineParticipants.length}`}
              onClick={() => {
                setShowRoomMenu(false);
                setShowParticipants(true);
              }}
            />

            <MenuRow
              icon="文"
              iconClass="bg-[#eef5ff] text-[#2868d8]"
              title={t.language}
              detail={
                languages.find(
                  (item) => item.code === language
                )?.name
              }
              onClick={() => {
                setShowRoomMenu(false);
                setShowLanguage(true);
              }}
            />

            <MenuRow
              icon="!"
              iconClass="bg-[#fff5d9] text-[#e3a20c]"
              title={t.announcements}
              detail={`${announcements.length}`}
              onClick={() => {
                setShowRoomMenu(false);
                setShowAnnouncements(true);
              }}
            />

            <MenuRow
              icon="⌗"
              iconClass="bg-[#eef5ff] text-[#2868d8]"
              title={t.qr}
              onClick={() => {
                setShowRoomMenu(false);
                setShowQR(true);
              }}
            />

            <MenuRow
              icon="Aa"
              iconClass="bg-[#f4f4f2] text-[#101820]"
              title={t.changeName}
              detail={displayName}
              onClick={() => {
                setNameDraft(displayName);
                setShowRoomMenu(false);
                setShowNameEdit(true);
              }}
            />

            {isOwner && (
              <button
                onClick={openNewAnnouncement}
                className="mt-4 w-full rounded-[20px] bg-[#101820] py-4 text-sm font-bold text-white"
              >
                + {t.writeAnnouncement}
              </button>
            )}

            {/* 모두 채팅방에서 나갈 수 있다 */}

            <button
              onClick={() => {
                setShowRoomMenu(false);
                setShowLeaveConfirm(true);
              }}
              className="mt-2 w-full rounded-[20px] bg-[#eef5ff] py-4 text-sm font-bold text-[#2868d8]"
            >
              ← {t.leave}
            </button>

            {/* 운영자에게만 방 자체 종료 기능 제공 */}

            {isOwner && (
              <button
                onClick={() => {
                  setShowRoomMenu(false);
                  setShowEndConfirm(true);
                }}
                className="mt-2 w-full rounded-[20px] bg-[#fff1f2] py-4 text-sm font-bold text-[#ff4458]"
              >
                {t.endRoom}
              </button>
            )}
          </div>
        </Sheet>
      )}

      {/* OWNER ACTIONS */}

      {showActions && (
        <Sheet onClose={() => setShowActions(false)}>
          <SheetHeader
            eyebrow="WYD"
            title={t.actions}
            onClose={() => setShowActions(false)}
          />

          <div className="mt-6 space-y-2">
            <MenuRow
              icon="+"
              iconClass="bg-[#fff5d9] text-[#e3a20c]"
              title={t.writeAnnouncement}
              onClick={openNewAnnouncement}
            />

            <MenuRow
              icon="⌗"
              iconClass="bg-[#eef5ff] text-[#2868d8]"
              title={t.qr}
              onClick={() => {
                setShowActions(false);
                setShowQR(true);
              }}
            />
          </div>
        </Sheet>
      )}

      {/* PARTICIPANTS */}

      {showParticipants && (
        <Sheet onClose={() => setShowParticipants(false)}>
          <SheetHeader
            eyebrow={`${onlineParticipants.length} ${t.online}`}
            title={t.participants}
            onClose={() => setShowParticipants(false)}
          />

          <div className="mt-6 max-h-[55vh] space-y-2 overflow-y-auto">
            {onlineParticipants.map((participant) => {
              const mine =
                participant.user_id === senderId;

              const host =
                participant.user_id === ownerId;

              return (
                <div
                  key={participant.user_id}
                  className="flex items-center rounded-[20px] bg-[#f7f7f4] px-4 py-3.5"
                >
                  <span className="mr-3 h-2.5 w-2.5 rounded-full bg-[#46b96b]" />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold">
                        {participant.display_name}
                      </p>

                      {mine && <Tag>{t.you}</Tag>}

                      {host && (
                        <Tag yellow>
                          {t.host}
                        </Tag>
                      )}
                    </div>

                    <p className="mt-1 text-[10px] text-neutral-400">
                      {languages.find(
                        (item) =>
                          item.code === participant.language
                      )?.name || participant.language}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Sheet>
      )}

      {/* QR */}

      {showQR && (
        <Sheet onClose={() => setShowQR(false)}>
          <SheetHeader
            eyebrow={`WYD · ${roomId}`}
            title={t.roomQR}
            onClose={() => setShowQR(false)}
          />

          <p className="mt-3 text-sm leading-6 text-neutral-500">
            {t.qrDescription}
          </p>

          <div className="mt-7 flex justify-center">
            <div className="rounded-[30px] border border-[#dce9ff] bg-white p-6 shadow-[0_14px_40px_rgba(40,104,216,0.09)]">
              {roomUrl && (
                <QRCodeSVG
                  value={roomUrl}
                  size={220}
                  level="M"
                  includeMargin={false}
                  fgColor="#101820"
                  bgColor="#ffffff"
                />
              )}
            </div>
          </div>

          <div className="mt-5 rounded-[18px] bg-[#f4f4f2] px-4 py-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Room
            </p>

            <p className="mt-1 font-mono text-sm font-bold">
              {roomId}
            </p>
          </div>
        </Sheet>
      )}

      {/* ANNOUNCEMENTS */}

      {showAnnouncements && (
        <Sheet onClose={() => setShowAnnouncements(false)}>
          <SheetHeader
            eyebrow="WYD"
            title={t.announcements}
            onClose={() => setShowAnnouncements(false)}
          />

          <div className="mt-6 max-h-[58vh] space-y-3 overflow-y-auto">
            {announcements.length === 0 ? (
              <div className="rounded-[22px] bg-[#f5f5f2] p-6 text-center">
                <p className="text-sm text-neutral-400">
                  {t.noAnnouncements}
                </p>
              </div>
            ) : (
              announcements.map((announcement) => {
                const translated =
                  announcement.source_language !== language && Boolean(translatedAnnouncements[translationKey(announcement, language)]);

                const showingOriginal =
                  !!originalAnnouncements[
                    announcement.id
                  ];

                return (
                  <div
                    key={announcement.id}
                    className={`rounded-[22px] border p-4 ${
                      announcement.priority === "urgent"
                        ? "border-red-100 bg-[#fff5f5]"
                        : announcement.priority ===
                          "important"
                        ? "border-[#ffe8a0] bg-[#fffaf0]"
                        : "border-[#dce9ff] bg-[#f8fbff]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <PriorityBadge
                        priority={announcement.priority}
                        t={t}
                      />

                      <span className="text-[9px] text-neutral-400">
                        {readCounts[announcement.id] || 0}{" "}
                        {t.confirmed} /{" "}
                        {onlineParticipants.length}
                      </span>
                    </div>

                    <p className="mt-3 whitespace-pre-wrap text-[13px] leading-6">
                      {announcementText(announcement)}
                    </p>

                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        {translated && (
                          <button
                            onClick={() =>
                              setOriginalAnnouncements(
                                (current) => ({
                                  ...current,
                                  [announcement.id]:
                                    !current[
                                      announcement.id
                                    ],
                                })
                              )
                            }
                            className="text-[10px] font-semibold text-[#2868d8]"
                          >
                            {showingOriginal
                              ? t.translated
                              : t.original}
                          </button>
                        )}
                      </div>

                      {isOwner && (
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              openEditAnnouncement(
                                announcement
                              )
                            }
                            className="rounded-full bg-white px-3 py-2 text-[10px] font-semibold"
                          >
                            {t.edit}
                          </button>

                          <button
                            onClick={() =>
                              setDeletingAnnouncement(
                                announcement
                              )
                            }
                            className="rounded-full bg-white px-3 py-2 text-[10px] font-semibold text-red-500"
                          >
                            {t.delete}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {isOwner && (
            <button
              onClick={openNewAnnouncement}
              className="mt-5 w-full rounded-[20px] bg-[#101820] py-4 text-sm font-bold text-white"
            >
              + {t.writeAnnouncement}
            </button>
          )}
        </Sheet>
      )}

      {/* ANNOUNCEMENT WRITER */}

      {showWriter && (
        <Sheet onClose={() => setShowWriter(false)}>
          <SheetHeader
            eyebrow="WYD"
            title={
              editingAnnouncement
                ? t.editAnnouncement
                : t.newAnnouncement
            }
            onClose={() => setShowWriter(false)}
          />

          <textarea
            value={announcementDraft}
            onChange={(event) =>
              setAnnouncementDraft(event.target.value)
            }
            rows={5}
            placeholder={t.announcement}
            className="mt-6 w-full resize-none rounded-[22px] bg-[#f5f5f2] px-4 py-4 text-sm leading-6 outline-none"
          />

          <div className="mt-4 grid grid-cols-3 gap-2">
            <PriorityButton
              active={priorityDraft === "normal"}
              label={t.normal}
              type="normal"
              onClick={() => setPriorityDraft("normal")}
            />

            <PriorityButton
              active={priorityDraft === "important"}
              label={t.important}
              type="important"
              onClick={() => setPriorityDraft("important")}
            />

            <PriorityButton
              active={priorityDraft === "urgent"}
              label={t.urgent}
              type="urgent"
              onClick={() => setPriorityDraft("urgent")}
            />
          </div>

          <button
            onClick={saveAnnouncement}
            disabled={!announcementDraft.trim()}
            className="mt-5 w-full rounded-[20px] bg-[#101820] py-4 text-sm font-bold text-white disabled:bg-neutral-200"
          >
            {t.save}
          </button>
        </Sheet>
      )}

      {/* DELETE */}

      {deletingAnnouncement && (
        <ConfirmSheet
          title={t.deleteQuestion}
          description=""
          cancelText={t.cancel}
          confirmText={t.delete}
          danger
          onCancel={() =>
            setDeletingAnnouncement(null)
          }
          onConfirm={deleteAnnouncement}
        />
      )}

      {/* LEAVE */}

      {showLeaveConfirm && (
        <ConfirmSheet
          title={t.leaveTitle}
          description={leaveDescription}
          cancelText={t.cancel}
          confirmText={
            roomEventId
              ? t.backToEvent
              : t.leaveButton
          }
          onCancel={() =>
            setShowLeaveConfirm(false)
          }
          onConfirm={leaveRoom}
        />
      )}

      {/* END */}

      {showEndConfirm && (
        <ConfirmSheet
          title={t.endTitle}
          description={t.endDescription}
          cancelText={t.cancel}
          confirmText={t.endButton}
          danger
          onCancel={() =>
            setShowEndConfirm(false)
          }
          onConfirm={endRoom}
        />
      )}

      {/* LANGUAGE */}

      {showLanguage && (
        <LanguageModal
          language={language}
          title={t.chooseLanguage}
          onSelect={chooseLanguage}
          onClose={() => setShowLanguage(false)}
        />
      )}

      {/* NAME */}

      {showNameEdit && (
        <Sheet onClose={() => setShowNameEdit(false)}>
          <SheetHeader
            eyebrow="WYD"
            title={t.changeName}
            onClose={() => setShowNameEdit(false)}
          />

          <input
            value={nameDraft}
            onChange={(event) =>
              setNameDraft(event.target.value)
            }
            placeholder={t.enterName}
            className="mt-6 w-full rounded-[20px] bg-[#f4f4f2] px-4 py-4 text-sm outline-none"
          />

          <button
            onClick={saveEditedName}
            className="mt-4 w-full rounded-[20px] bg-[#101820] py-4 text-sm font-bold text-white"
          >
            {t.save}
          </button>
        </Sheet>
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

      <p className="text-[10px] lowercase tracking-[0.22em] text-neutral-400">
        messenger
      </p>
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
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/30 px-3 pb-3 backdrop-blur-sm sm:items-center"
    >
      <div
        onClick={(event) => event.stopPropagation()}
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

        <h2 className="mt-2 text-[27px] font-bold tracking-[-0.045em]">
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

function MenuRow({
  icon,
  iconClass,
  title,
  detail,
  onClick,
}: {
  icon: string;
  iconClass: string;
  title: string;
  detail?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center rounded-[20px] bg-[#f7f7f4] p-3 text-left active:scale-[0.99]"
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] text-sm font-bold ${iconClass}`}
      >
        {icon}
      </div>

      <p className="ml-3 flex-1 text-sm font-semibold">
        {title}
      </p>

      {detail && (
        <span className="mr-2 text-[11px] text-neutral-400">
          {detail}
        </span>
      )}

      <span className="text-neutral-300">›</span>
    </button>
  );
}

function Tag({
  children,
  yellow = false,
}: {
  children: ReactNode;
  yellow?: boolean;
}) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-[8px] font-bold ${
        yellow
          ? "bg-[#fff1bd] text-[#b87d00]"
          : "bg-[#e9f2ff] text-[#2868d8]"
      }`}
    >
      {children}
    </span>
  );
}

function PriorityBadge({
  priority,
  t,
}: {
  priority: "normal" | "important" | "urgent";
  t: Record<string, string>;
}) {
  const label =
    priority === "urgent"
      ? t.urgent
      : priority === "important"
      ? t.important
      : t.normal;

  const className =
    priority === "urgent"
      ? "bg-red-100 text-red-500"
      : priority === "important"
      ? "bg-[#fff0bd] text-[#b77c00]"
      : "bg-[#e8f1ff] text-[#2868d8]";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${className}`}
    >
      {label}
    </span>
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
  type: "normal" | "important" | "urgent";
  onClick: () => void;
}) {
  let className =
    "border-neutral-100 bg-[#f7f7f4] text-neutral-500";

  if (active) {
    if (type === "urgent") {
      className =
        "border-red-400 bg-red-50 text-red-500";
    } else if (type === "important") {
      className =
        "border-[#f1bd39] bg-[#fff8e6] text-[#b77c00]";
    } else {
      className =
        "border-[#2868d8] bg-[#eef5ff] text-[#2868d8]";
    }
  }

  return (
    <button
      onClick={onClick}
      className={`rounded-[16px] border py-3 text-[11px] font-bold ${className}`}
    >
      {label}
    </button>
  );
}

function QrIcon() {
  return (
    <div className="relative h-5 w-5">
      <span className="absolute left-0 top-0 h-2 w-2 rounded-tl border-l-2 border-t-2 border-current" />
      <span className="absolute right-0 top-0 h-2 w-2 rounded-tr border-r-2 border-t-2 border-current" />
      <span className="absolute bottom-0 left-0 h-2 w-2 rounded-bl border-b-2 border-l-2 border-current" />
      <span className="absolute bottom-0 right-0 h-2 w-2 rounded-br border-b-2 border-r-2 border-current" />
    </div>
  );
}

function ConfirmSheet({
  title,
  description,
  cancelText,
  confirmText,
  danger = false,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  cancelText: string;
  confirmText: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Sheet onClose={onCancel}>
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-[20px] ${
          danger
            ? "bg-[#fff1f2] text-[#ff4458]"
            : "bg-[#eef5ff] text-[#2868d8]"
        }`}
      >
        <span className="text-[24px] font-light">
          {danger ? "!" : "←"}
        </span>
      </div>

      <h2 className="mt-6 text-[27px] font-bold leading-tight tracking-[-0.045em]">
        {title}
      </h2>

      {description && (
        <p className="mt-3 text-sm leading-6 text-neutral-500">
          {description}
        </p>
      )}

      <div className="mt-7 flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 rounded-[18px] bg-[#f4f4f2] py-4 text-sm font-semibold"
        >
          {cancelText}
        </button>

        <button
          onClick={onConfirm}
          className={`flex-1 rounded-[18px] py-4 text-sm font-bold text-white ${
            danger
              ? "bg-[#ff4458]"
              : "bg-[#2868d8]"
          }`}
        >
          {confirmText}
        </button>
      </div>
    </Sheet>
  );
}

function LanguageScreen({
  language,
  onSelect,
}: {
  language: string;
  onSelect: (code: string) => void;
}) {
  return (
    <main className="min-h-[100dvh] bg-[#f4f4f2] p-4 text-[#101820]">
      <div className="mx-auto min-h-[calc(100dvh-32px)] max-w-[430px] rounded-[34px] bg-[#fffefb] px-6 py-8">
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

          <p className="mt-5 text-sm leading-6 text-neutral-500">
            Messages and announcements will be translated into
            your language.
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
  onSelect,
  onClose,
}: {
  language: string;
  title: string;
  onSelect: (code: string) => void;
  onClose: () => void;
}) {
  return (
    <Sheet onClose={onClose}>
      <SheetHeader
        eyebrow="Language"
        title={title}
        onClose={onClose}
      />

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
  onSelect: (code: string) => void;
}) {
  return (
    <div className="mt-6 max-h-[55vh] space-y-2 overflow-y-auto">
      {languages.map((item) => {
        const selected = language === item.code;

        return (
          <button
            key={item.code}
            onClick={() => onSelect(item.code)}
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
      })}
    </div>
  );
}

function NameScreen({
  title,
  description,
  placeholder,
  buttonText,
  onSave,
}: {
  title: string;
  description: string;
  placeholder: string;
  buttonText: string;
  onSave: (value: string) => void;
}) {
  const [value, setValue] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();

    onSave(value);
  }

  return (
    <main className="flex min-h-[100dvh] justify-center bg-[#f4f4f2] p-4 text-[#101820]">
      <div className="w-full max-w-[430px] rounded-[34px] bg-[#fffefb] px-6 py-8">
        <Brand />

        <div className="mt-[18vh]">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#2868d8]">
            Profile
          </p>

          <h2 className="mt-4 text-[42px] font-bold tracking-[-0.055em]">
            {title}
          </h2>

          <p className="mt-4 max-w-[300px] text-sm leading-6 text-neutral-500">
            {description}
          </p>

          <form
            onSubmit={submit}
            className="mt-8"
          >
            <input
              autoFocus
              value={value}
              onChange={(event) =>
                setValue(event.target.value)
              }
              placeholder={placeholder}
              className="w-full rounded-[22px] bg-[#f4f4f2] px-5 py-5 text-base outline-none"
            />

            <button
              type="submit"
              disabled={!value.trim()}
              className="mt-3 w-full rounded-[22px] bg-[#2868d8] py-5 text-sm font-bold text-white disabled:bg-neutral-200"
            >
              {buttonText}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}