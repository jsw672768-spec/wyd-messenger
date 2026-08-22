"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  createClient,
} from "@supabase/supabase-js";

import {
  QRCodeSVG,
} from "qrcode.react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Message = {
  id: number;
  room_id: string;
  sender_id: string;
  content: string;
  source_language: string;
  created_at: string;
};

type Priority =
  | "normal"
  | "important"
  | "urgent";

type Announcement = {
  id: number;
  room_id: string;
  author_id: string;
  content: string;
  source_language: string;
  priority: Priority;
  created_at: string;
};

type OnlineParticipant = {
  user_id: string;
  name: string;
  language: string;
};

type ParticipantRecord = {
  user_id: string;
  display_name: string;
  language: string;
};

type ReadCount = {
  [announcementId: number]: number;
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

const copy: Record<string, any> = {
  en: {
    room: "Room",
    peopleOnline: "online",
    participants: "Participants",
    language: "Language",
    announcements: "Announcements",
    qrCode: "QR code",
    changeName: "Change name",
    roomMenu: "Room menu",
    host: "Host",
    you: "You",

    yourName: "Your name",
    nameDescription:
      "Choose the name people in this room will see.",
    namePlaceholder: "Enter your name",
    continue: "Continue",

    noAnnouncement: "No announcements yet",
    writeAnnouncement: "Write announcement",
    newAnnouncement: "New announcement",
    editAnnouncement: "Edit announcement",
    allAnnouncements: "All announcements",

    priority: "Priority",
    normal: "Normal",
    important: "Important",
    urgent: "Urgent",

    announcementPlaceholder:
      "Write something everyone should know...",
    publish: "Publish",
    save: "Save changes",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",

    confirmed: "confirmed",
    latest: "Latest",

    message: "Message...",
    start: "Start a conversation",
    startDescription:
      "Invite people with the QR code and start talking.",

    join: "Join this room",
    joinDescription:
      "Scan this QR code to join the conversation.",
    close: "Close",

    chooseLanguage: "Choose your language",

    translated: "Translated",
    translating: "Translating...",
    original: "Original",
    viewOriginal: "View original",
    viewTranslation: "View translation",

    deleteTitle: "Delete announcement?",
    deleteDescription:
      "This announcement will disappear for everyone in the room.",
    deleteConfirm: "Delete announcement",

    actions: "Actions",
  },

  ko: {
    room: "채팅방",
    peopleOnline: "명 참여 중",
    participants: "참가자",
    language: "언어",
    announcements: "공지사항",
    qrCode: "QR 코드",
    changeName: "이름 변경",
    roomMenu: "채팅방 메뉴",
    host: "방장",
    you: "나",

    yourName: "이름을 알려주세요",
    nameDescription:
      "이 채팅방의 다른 사람들에게 표시될 이름입니다.",
    namePlaceholder: "이름 입력",
    continue: "계속",

    noAnnouncement: "아직 공지가 없습니다",
    writeAnnouncement: "공지 작성",
    newAnnouncement: "새 공지 작성",
    editAnnouncement: "공지 수정",
    allAnnouncements: "전체 공지",

    priority: "공지 중요도",
    normal: "일반",
    important: "중요",
    urgent: "긴급",

    announcementPlaceholder:
      "모두에게 전달할 내용을 입력하세요...",
    publish: "공지하기",
    save: "수정 완료",
    cancel: "취소",
    edit: "수정",
    delete: "삭제",

    confirmed: "명 확인",
    latest: "최신",

    message: "메시지를 입력하세요...",
    start: "대화를 시작해보세요",
    startDescription:
      "QR로 사람들을 초대하고 대화를 시작하세요.",

    join: "이 채팅방에 참여하세요",
    joinDescription:
      "QR을 스캔하면 이 대화에 바로 참여할 수 있어요.",
    close: "닫기",

    chooseLanguage: "언어를 선택하세요",

    translated: "번역됨",
    translating: "번역 중...",
    original: "원문",
    viewOriginal: "원문 보기",
    viewTranslation: "번역 보기",

    deleteTitle: "공지를 삭제할까요?",
    deleteDescription:
      "삭제하면 채팅방의 모든 사람에게서 이 공지가 사라집니다.",
    deleteConfirm: "공지 삭제",

    actions: "메뉴",
  },

  es: {
    room: "Sala",
    peopleOnline: "en línea",
    participants: "Participantes",
    language: "Idioma",
    announcements: "Anuncios",
    qrCode: "Código QR",
    changeName: "Cambiar nombre",
    roomMenu: "Menú de sala",
    host: "Anfitrión",
    you: "Tú",

    yourName: "Tu nombre",
    nameDescription:
      "Elige el nombre que verán las personas de esta sala.",
    namePlaceholder: "Escribe tu nombre",
    continue: "Continuar",

    noAnnouncement: "No hay anuncios",
    writeAnnouncement: "Nuevo anuncio",
    newAnnouncement: "Nuevo anuncio",
    editAnnouncement: "Editar anuncio",
    allAnnouncements: "Todos los anuncios",

    priority: "Prioridad",
    normal: "Normal",
    important: "Importante",
    urgent: "Urgente",

    announcementPlaceholder:
      "Escribe algo que todos deban saber...",
    publish: "Publicar",
    save: "Guardar",
    cancel: "Cancelar",
    edit: "Editar",
    delete: "Eliminar",

    confirmed: "confirmados",
    latest: "Último",

    message: "Mensaje...",
    start: "Empieza a hablar",
    startDescription:
      "Invita a personas con el QR y empieza a hablar.",

    join: "Únete a esta sala",
    joinDescription:
      "Escanea este QR para unirte a la conversación.",
    close: "Cerrar",

    chooseLanguage: "Elige tu idioma",

    translated: "Traducido",
    translating: "Traduciendo...",
    original: "Original",
    viewOriginal: "Ver original",
    viewTranslation: "Ver traducción",

    deleteTitle: "¿Eliminar anuncio?",
    deleteDescription:
      "El anuncio desaparecerá para todos.",
    deleteConfirm: "Eliminar anuncio",

    actions: "Acciones",
  },
};

function translationKey(
  type: "message" | "announcement",
  id: number,
  sourceLanguage: string,
  targetLanguage: string,
  content: string
) {
  return [
    type,
    id,
    sourceLanguage,
    targetLanguage,
    content,
  ].join("::");
}

export default function RoomPage() {
  const router = useRouter();
  const params = useParams();

  const roomId = String(
    params.id || ""
  );

  const [splash, setSplash] =
    useState(true);

  const [
    languageChecked,
    setLanguageChecked,
  ] = useState(false);

  const [
    firstLanguageChoice,
    setFirstLanguageChoice,
  ] = useState(false);

  const [
    showLanguage,
    setShowLanguage,
  ] = useState(false);

  const [language, setLanguage] =
    useState("en");

  const [
    senderId,
    setSenderId,
  ] = useState("");

  const [
    displayName,
    setDisplayName,
  ] = useState("");

  const [
    nameInput,
    setNameInput,
  ] = useState("");

  const [
    showNameSetup,
    setShowNameSetup,
  ] = useState(false);

  const [
    roomLoading,
    setRoomLoading,
  ] = useState(true);

  const [
    ownerId,
    setOwnerId,
  ] = useState("");

  const [
    onlineParticipants,
    setOnlineParticipants,
  ] = useState<
    OnlineParticipant[]
  >([]);

  const [
    participantDirectory,
    setParticipantDirectory,
  ] = useState<
    ParticipantRecord[]
  >([]);

  const [
    showParticipants,
    setShowParticipants,
  ] = useState(false);

  const [
    showRoomMenu,
    setShowRoomMenu,
  ] = useState(false);

  const [
    showActions,
    setShowActions,
  ] = useState(false);

  const [
    messages,
    setMessages,
  ] = useState<Message[]>([]);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    sending,
    setSending,
  ] = useState(false);

  const [
    announcements,
    setAnnouncements,
  ] = useState<
    Announcement[]
  >([]);

  const [
    readCounts,
    setReadCounts,
  ] = useState<ReadCount>({});

  const [
    announcementText,
    setAnnouncementText,
  ] = useState("");

  const [
    announcementPriority,
    setAnnouncementPriority,
  ] = useState<Priority>(
    "normal"
  );

  const [
    editingAnnouncement,
    setEditingAnnouncement,
  ] = useState<
    Announcement | null
  >(null);

  const [
    deletingAnnouncement,
    setDeletingAnnouncement,
  ] = useState<
    Announcement | null
  >(null);

  const [
    showAnnouncementWriter,
    setShowAnnouncementWriter,
  ] = useState(false);

  const [
    showAnnouncementList,
    setShowAnnouncementList,
  ] = useState(false);

  const [
    publishingAnnouncement,
    setPublishingAnnouncement,
  ] = useState(false);

  const [
    showQR,
    setShowQR,
  ] = useState(false);

  const [
    roomUrl,
    setRoomUrl,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    translations,
    setTranslations,
  ] = useState<
    Record<string, string>
  >({});

  const [
    originalMode,
    setOriginalMode,
  ] = useState<
    Record<string, boolean>
  >({});

  const translationCacheRef =
    useRef<
      Record<string, string>
    >({});

  const translationRequestsRef =
    useRef<Set<string>>(
      new Set()
    );

  const bottomRef =
    useRef<HTMLDivElement>(
      null
    );

  const isOwner =
    Boolean(senderId) &&
    Boolean(ownerId) &&
    senderId === ownerId;

  const t =
    copy[language] ||
    copy.en;

  // =================================
  // DEVICE
  // =================================

  useEffect(() => {
    setRoomUrl(
      window.location.href
    );

    let id =
      localStorage.getItem(
        "wyd_sender_id"
      );

    if (!id) {
      id =
        crypto.randomUUID();

      localStorage.setItem(
        "wyd_sender_id",
        id
      );
    }

    setSenderId(id);

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

    const savedName =
      localStorage.getItem(
        "wyd_display_name"
      );

    if (savedName) {
      setDisplayName(
        savedName
      );

      setNameInput(
        savedName
      );
    } else {
      setShowNameSetup(
        true
      );
    }

    setLanguageChecked(
      true
    );

    const timer =
      setTimeout(() => {
        setSplash(false);
      }, 1400);

    return () =>
      clearTimeout(timer);
  }, []);

  // =================================
  // NAME
  // =================================

  function saveName() {
    const name =
      nameInput.trim();

    if (!name) return;

    const finalName =
      name.slice(0, 30);

    localStorage.setItem(
      "wyd_display_name",
      finalName
    );

    setDisplayName(
      finalName
    );

    setNameInput(
      finalName
    );

    setShowNameSetup(
      false
    );
  }

  // =================================
  // ROOM DATA
  // =================================

  useEffect(() => {
    if (!roomId) return;
    if (!senderId) return;
    if (!displayName) return;

    async function startRoom() {
      setRoomLoading(true);
      setErrorMessage("");

      const {
        data: existingRoom,
        error: roomError,
      } = await supabase
        .from("rooms")
        .select(
          "id, owner_id"
        )
        .eq(
          "id",
          roomId
        )
        .maybeSingle();

      if (roomError) {
        setErrorMessage(
          roomError.message
        );
      }

      let currentOwner =
        existingRoom?.owner_id ||
        "";

      if (!existingRoom) {
        const {
          data: createdRoom,
          error,
        } = await supabase
          .from("rooms")
          .insert({
            id: roomId,
            owner_id:
              senderId,
          })
          .select(
            "id, owner_id"
          )
          .single();

        if (error) {
          setErrorMessage(
            error.message
          );
        }

        if (createdRoom) {
          currentOwner =
            createdRoom.owner_id;
        }
      }

      if (
        existingRoom &&
        !existingRoom.owner_id
      ) {
        const {
          data: updatedRoom,
        } = await supabase
          .from("rooms")
          .update({
            owner_id:
              senderId,
          })
          .eq(
            "id",
            roomId
          )
          .select(
            "id, owner_id"
          )
          .single();

        if (updatedRoom) {
          currentOwner =
            updatedRoom.owner_id;
        }
      }

      setOwnerId(
        currentOwner
      );

      const {
        error: participantError,
      } = await supabase
        .from(
          "room_participants"
        )
        .upsert(
          {
            room_id:
              roomId,

            user_id:
              senderId,

            display_name:
              displayName,

            language,

            updated_at:
              new Date()
                .toISOString(),
          },
          {
            onConflict:
              "room_id,user_id",
          }
        );

      if (
        participantError
      ) {
        setErrorMessage(
          participantError.message
        );
      }

      const {
        data: participantData,
      } = await supabase
        .from(
          "room_participants"
        )
        .select(
          "user_id, display_name, language"
        )
        .eq(
          "room_id",
          roomId
        );

      if (participantData) {
        setParticipantDirectory(
          participantData as ParticipantRecord[]
        );
      }

      const {
        data: messageData,
        error: messageError,
      } = await supabase
        .from("messages")
        .select("*")
        .eq(
          "room_id",
          roomId
        )
        .order(
          "created_at",
          {
            ascending: true,
          }
        );

      if (messageError) {
        setErrorMessage(
          messageError.message
        );
      }

      if (messageData) {
        setMessages(
          messageData as Message[]
        );
      }

      const {
        data:
          announcementData,
        error:
          announcementError,
      } = await supabase
        .from(
          "announcements"
        )
        .select("*")
        .eq(
          "room_id",
          roomId
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (
        announcementError
      ) {
        setErrorMessage(
          announcementError.message
        );
      }

      if (
        announcementData
      ) {
        setAnnouncements(
          announcementData as Announcement[]
        );
      }

      const {
        data: readData,
      } = await supabase
        .from(
          "announcement_reads"
        )
        .select(
          "announcement_id"
        )
        .eq(
          "room_id",
          roomId
        );

      if (readData) {
        const counts:
          ReadCount = {};

        readData.forEach(
          (item) => {
            const id =
              Number(
                item.announcement_id
              );

            counts[id] =
              (counts[id] || 0) +
              1;
          }
        );

        setReadCounts(
          counts
        );
      }

      setRoomLoading(
        false
      );
    }

    startRoom();
  }, [
    roomId,
    senderId,
    displayName,
    language,
  ]);

  // =================================
  // REALTIME + PRESENCE
  // =================================

  useEffect(() => {
    if (!roomId) return;
    if (!senderId) return;
    if (!displayName) return;

    const channel =
      supabase.channel(
        `wyd-room-${roomId}`,
        {
          config: {
            presence: {
              key:
                senderId,
            },
          },
        }
      );

    function syncPresence() {
      const state =
        channel.presenceState();

      const users:
        OnlineParticipant[] =
        [];

      Object.values(
        state
      ).forEach(
        (entries: any) => {
          entries.forEach(
            (entry: any) => {
              if (
                !entry.user_id
              ) {
                return;
              }

              if (
                users.some(
                  (user) =>
                    user.user_id ===
                    entry.user_id
                )
              ) {
                return;
              }

              users.push({
                user_id:
                  entry.user_id,

                name:
                  entry.name ||
                  "Guest",

                language:
                  entry.language ||
                  "en",
              });
            }
          );
        }
      );

      setOnlineParticipants(
        users
      );
    }

    channel.on(
      "presence",
      {
        event: "sync",
      },
      syncPresence
    );

    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter:
          `room_id=eq.${roomId}`,
      },
      (payload) => {
        const item =
          payload.new as Message;

        setMessages(
          (current) => {
            if (
              current.some(
                (message) =>
                  message.id ===
                  item.id
              )
            ) {
              return current;
            }

            return [
              ...current,
              item,
            ];
          }
        );
      }
    );

    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table:
          "announcements",
        filter:
          `room_id=eq.${roomId}`,
      },
      (payload) => {
        const item =
          payload.new as Announcement;

        setAnnouncements(
          (current) => {
            if (
              current.some(
                (announcement) =>
                  announcement.id ===
                  item.id
              )
            ) {
              return current;
            }

            return [
              item,
              ...current,
            ];
          }
        );
      }
    );

    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table:
          "announcements",
        filter:
          `room_id=eq.${roomId}`,
      },
      (payload) => {
        const item =
          payload.new as Announcement;

        setAnnouncements(
          (current) =>
            current.map(
              (announcement) =>
                announcement.id ===
                item.id
                  ? item
                  : announcement
            )
        );
      }
    );

    channel.on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table:
          "announcements",
      },
      (payload) => {
        const deleted =
          payload.old as {
            id?: number;
          };

        if (!deleted.id) {
          return;
        }

        setAnnouncements(
          (current) =>
            current.filter(
              (announcement) =>
                announcement.id !==
                deleted.id
            )
        );
      }
    );

    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table:
          "announcement_reads",
        filter:
          `room_id=eq.${roomId}`,
      },
      (payload) => {
        const id =
          Number(
            payload.new
              .announcement_id
          );

        setReadCounts(
          (current) => ({
            ...current,

            [id]:
              (current[id] || 0) +
              1,
          })
        );
      }
    );

    channel.subscribe(
      async (status) => {
        if (
          status ===
          "SUBSCRIBED"
        ) {
          await channel.track({
            user_id:
              senderId,

            name:
              displayName,

            language,

            online_at:
              new Date()
                .toISOString(),
          });
        }
      }
    );

    return () => {
      supabase.removeChannel(
        channel
      );
    };
  }, [
    roomId,
    senderId,
    displayName,
    language,
  ]);

  // =================================
  // TRANSLATION
  // =================================

  useEffect(() => {
    let cancelled =
      false;

    async function requestTranslation(
      type:
        | "message"
        | "announcement",
      id: number,
      content: string,
      sourceLanguage: string
    ) {
      if (
        !sourceLanguage ||
        sourceLanguage ===
          language
      ) {
        return;
      }

      const key =
        translationKey(
          type,
          id,
          sourceLanguage,
          language,
          content
        );

      if (
        translationCacheRef
          .current[key]
      ) {
        return;
      }

      if (
        translationRequestsRef
          .current.has(key)
      ) {
        return;
      }

      translationRequestsRef.current.add(
        key
      );

      try {
        const response =
          await fetch(
            "/api/translate",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  text:
                    content,

                  source:
                    sourceLanguage,

                  target:
                    language,
                }),
            }
          );

        const raw =
          await response.text();

        let data: any;

        try {
          data =
            JSON.parse(raw);
        } catch {
          console.error(
            "Translation returned non-JSON:",
            raw
          );

          return;
        }

        if (
          !response.ok ||
          !data.translatedText
        ) {
          console.error(
            "Translation failed:",
            data
          );

          return;
        }

        if (cancelled) {
          return;
        }

        translationCacheRef.current[
          key
        ] =
          data.translatedText;

        setTranslations(
          (current) => ({
            ...current,

            [key]:
              data.translatedText,
          })
        );
      } catch (error) {
        console.error(
          "Translation error:",
          error
        );
      } finally {
        translationRequestsRef.current.delete(
          key
        );
      }
    }

    async function translateEverything() {
      for (
        const item of messages
      ) {
        if (cancelled) return;

        await requestTranslation(
          "message",
          item.id,
          item.content,
          item.source_language
        );
      }

      for (
        const item of announcements
      ) {
        if (cancelled) return;

        await requestTranslation(
          "announcement",
          item.id,
          item.content,
          item.source_language
        );
      }
    }

    translateEverything();

    return () => {
      cancelled = true;
    };
  }, [
    messages,
    announcements,
    language,
  ]);

  function getTranslationKey(
    type:
      | "message"
      | "announcement",
    id: number,
    content: string,
    sourceLanguage: string
  ) {
    return translationKey(
      type,
      id,
      sourceLanguage,
      language,
      content
    );
  }

  function translatedText(
    type:
      | "message"
      | "announcement",
    id: number,
    content: string,
    sourceLanguage: string
  ) {
    if (
      !sourceLanguage ||
      sourceLanguage ===
        language
    ) {
      return content;
    }

    const key =
      getTranslationKey(
        type,
        id,
        content,
        sourceLanguage
      );

    if (
      originalMode[key]
    ) {
      return content;
    }

    return (
      translations[key] ||
      content
    );
  }

  function hasTranslation(
    type:
      | "message"
      | "announcement",
    id: number,
    content: string,
    sourceLanguage: string
  ) {
    if (
      !sourceLanguage ||
      sourceLanguage ===
        language
    ) {
      return false;
    }

    const key =
      getTranslationKey(
        type,
        id,
        content,
        sourceLanguage
      );

    return Boolean(
      translations[key]
    );
  }

  function isShowingOriginal(
    type:
      | "message"
      | "announcement",
    id: number,
    content: string,
    sourceLanguage: string
  ) {
    const key =
      getTranslationKey(
        type,
        id,
        content,
        sourceLanguage
      );

    return Boolean(
      originalMode[key]
    );
  }

  function toggleOriginal(
    type:
      | "message"
      | "announcement",
    id: number,
    content: string,
    sourceLanguage: string
  ) {
    const key =
      getTranslationKey(
        type,
        id,
        content,
        sourceLanguage
      );

    setOriginalMode(
      (current) => ({
        ...current,

        [key]:
          !current[key],
      })
    );
  }

  function languageName(
    code: string
  ) {
    return (
      languages.find(
        (item) =>
          item.code === code
      )?.name || code
    );
  }

  // =================================
  // MESSAGE SCROLL
  // =================================

  useEffect(() => {
    bottomRef.current?.scrollIntoView(
      {
        behavior: "smooth",
      }
    );
  }, [messages]);

  // =================================
  // READ
  // =================================

  async function markAsRead(
    announcementId: number
  ) {
    if (!senderId) return;

    await supabase
      .from(
        "announcement_reads"
      )
      .upsert(
        {
          announcement_id:
            announcementId,

          room_id:
            roomId,

          user_id:
            senderId,
        },
        {
          onConflict:
            "announcement_id,user_id",

          ignoreDuplicates:
            true,
        }
      );
  }

  async function openAnnouncements() {
    setShowAnnouncementList(
      true
    );

    setShowRoomMenu(
      false
    );

    for (
      const announcement of announcements
    ) {
      await markAsRead(
        announcement.id
      );
    }
  }

  // =================================
  // SEND MESSAGE
  // =================================

  async function sendMessage() {
    const text =
      message.trim();

    if (
      !text ||
      sending ||
      !senderId
    ) {
      return;
    }

    setSending(true);
    setErrorMessage("");

    const {
      data,
      error,
    } = await supabase
      .from("messages")
      .insert({
        room_id:
          roomId,

        sender_id:
          senderId,

        content:
          text,

        source_language:
          language,
      })
      .select()
      .single();

    if (error) {
      setErrorMessage(
        error.message
      );

      setSending(false);

      return;
    }

    setMessage("");

    if (data) {
      const item =
        data as Message;

      setMessages(
        (current) => {
          if (
            current.some(
              (message) =>
                message.id ===
                item.id
            )
          ) {
            return current;
          }

          return [
            ...current,
            item,
          ];
        }
      );
    }

    setSending(false);
  }

  // =================================
  // ANNOUNCEMENT
  // =================================

  function newAnnouncement() {
    setEditingAnnouncement(
      null
    );

    setAnnouncementText(
      ""
    );

    setAnnouncementPriority(
      "normal"
    );

    setShowActions(false);
    setShowRoomMenu(false);

    setShowAnnouncementWriter(
      true
    );
  }

  function editAnnouncement(
    item: Announcement
  ) {
    if (!isOwner) return;

    setEditingAnnouncement(
      item
    );

    setAnnouncementText(
      item.content
    );

    setAnnouncementPriority(
      item.priority ||
        "normal"
    );

    setShowAnnouncementList(
      false
    );

    setShowAnnouncementWriter(
      true
    );
  }

  async function saveAnnouncement() {
    const text =
      announcementText.trim();

    if (
      !text ||
      !isOwner ||
      publishingAnnouncement
    ) {
      return;
    }

    setPublishingAnnouncement(
      true
    );

    setErrorMessage("");

    if (
      editingAnnouncement
    ) {
      const {
        data,
        error,
      } = await supabase
        .from(
          "announcements"
        )
        .update({
          content:
            text,

          priority:
            announcementPriority,

          source_language:
            language,
        })
        .eq(
          "id",
          editingAnnouncement.id
        )
        .eq(
          "room_id",
          roomId
        )
        .select()
        .single();

      if (error) {
        setErrorMessage(
          error.message
        );
      }

      if (data) {
        const updated =
          data as Announcement;

        setAnnouncements(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                updated.id
                  ? updated
                  : item
            )
        );
      }
    } else {
      const {
        data,
        error,
      } = await supabase
        .from(
          "announcements"
        )
        .insert({
          room_id:
            roomId,

          author_id:
            senderId,

          content:
            text,

          priority:
            announcementPriority,

          source_language:
            language,
        })
        .select()
        .single();

      if (error) {
        setErrorMessage(
          error.message
        );
      }

      if (data) {
        const created =
          data as Announcement;

        setAnnouncements(
          (current) => {
            if (
              current.some(
                (item) =>
                  item.id ===
                  created.id
              )
            ) {
              return current;
            }

            return [
              created,
              ...current,
            ];
          }
        );

        await markAsRead(
          created.id
        );
      }
    }

    setAnnouncementText(
      ""
    );

    setEditingAnnouncement(
      null
    );

    setShowAnnouncementWriter(
      false
    );

    setPublishingAnnouncement(
      false
    );
  }

  async function deleteAnnouncement() {
    if (
      !deletingAnnouncement ||
      !isOwner
    ) {
      return;
    }

    const {
      error,
    } = await supabase
      .from(
        "announcements"
      )
      .delete()
      .eq(
        "id",
        deletingAnnouncement.id
      )
      .eq(
        "room_id",
        roomId
      );

    if (error) {
      setErrorMessage(
        error.message
      );

      return;
    }

    setAnnouncements(
      (current) =>
        current.filter(
          (item) =>
            item.id !==
            deletingAnnouncement.id
        )
    );

    setDeletingAnnouncement(
      null
    );
  }

  // =================================
  // LANGUAGE
  // =================================

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

  // =================================
  // SPLASH
  // =================================

  if (
    splash ||
    !languageChecked
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <div className="flex flex-col items-center">
          <h1 className="animate-[brandIntro_0.9s_ease-out_forwards] text-[52px] font-light tracking-[-0.08em] text-black">
            WYD
          </h1>

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

  if (
    showNameSetup ||
    !displayName
  ) {
    return (
      <NameScreen
        title={
          t.yourName
        }
        description={
          t.nameDescription
        }
        placeholder={
          t.namePlaceholder
        }
        button={
          t.continue
        }
        value={
          nameInput
        }
        onChange={
          setNameInput
        }
        onSave={
          saveName
        }
      />
    );
  }

  if (roomLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-neutral-400">
          Preparing room...
        </p>
      </main>
    );
  }

  const latestAnnouncement =
    announcements[0];

  const participantCount =
    onlineParticipants.length;

  function getSenderName(
    userId: string
  ) {
    const online =
      onlineParticipants.find(
        (item) =>
          item.user_id ===
          userId
      );

    if (online) {
      return online.name;
    }

    const saved =
      participantDirectory.find(
        (item) =>
          item.user_id ===
          userId
      );

    return (
      saved?.display_name ||
      "Guest"
    );
  }

  function priorityInfo(
    priority: Priority
  ) {
    if (
      priority === "urgent"
    ) {
      return {
        label:
          t.urgent,

        dot:
          "bg-red-500",

        badge:
          "bg-red-500 text-white",

        panel:
          "border-red-200 bg-red-50",
      };
    }

    if (
      priority ===
      "important"
    ) {
      return {
        label:
          t.important,

        dot:
          "bg-amber-500",

        badge:
          "bg-amber-100 text-amber-700",

        panel:
          "border-amber-200 bg-amber-50",
      };
    }

    return {
      label:
        t.normal,

      dot:
        "bg-neutral-400",

      badge:
        "bg-neutral-100 text-neutral-600",

      panel:
        "border-neutral-200 bg-white",
    };
  }

  return (
    <main className="min-h-screen bg-[#f3f3f1] text-black">
      <div className="mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-white">

        {/* HEADER */}

        <header className="shrink-0 border-b border-neutral-100 bg-white px-4 pb-3 pt-5">
          <div className="flex items-center justify-between">

            <button
              onClick={() =>
                router.push("/")
              }
              className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 text-xl transition active:scale-95"
            >
              ←
            </button>

            <button
              onClick={() =>
                setShowRoomMenu(
                  true
                )
              }
              className="min-w-0 flex-1 px-3 text-center"
            >
              <p className="text-[11px] font-semibold tracking-[0.18em]">
                WYD
              </p>

              <p className="mt-0.5 text-[11px] text-neutral-400">
                {language === "ko"
                  ? `${participantCount}${t.peopleOnline}`
                  : `${participantCount} ${t.peopleOnline}`}
              </p>
            </button>

            <button
              onClick={() =>
                setShowQR(true)
              }
              className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-xl text-white transition active:scale-95"
            >
              ⌗
            </button>

          </div>
        </header>

        {/* THIN ANNOUNCEMENT BAR */}

        <div className="shrink-0 px-4 pt-3">
          {latestAnnouncement ? (
            <button
              onClick={async () => {
                await markAsRead(
                  latestAnnouncement.id
                );

                setShowAnnouncementList(
                  true
                );
              }}
              className={`flex w-full items-center gap-3 rounded-[18px] border px-4 py-3 text-left ${
                priorityInfo(
                  latestAnnouncement.priority
                ).panel
              }`}
            >
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  priorityInfo(
                    latestAnnouncement.priority
                  ).dot
                }`}
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">

                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                    {priorityInfo(
                      latestAnnouncement.priority
                    ).label}
                  </span>

                  {latestAnnouncement.source_language !==
                    language &&
                    hasTranslation(
                      "announcement",
                      latestAnnouncement.id,
                      latestAnnouncement.content,
                      latestAnnouncement.source_language
                    ) && (
                      <span className="text-[9px] text-neutral-400">
                        · {t.translated}
                      </span>
                    )}

                </div>

                <p className="mt-1 truncate text-[13px] font-medium">
                  {translatedText(
                    "announcement",
                    latestAnnouncement.id,
                    latestAnnouncement.content,
                    latestAnnouncement.source_language
                  )}
                </p>
              </div>

              <span className="text-neutral-400">
                ›
              </span>
            </button>
          ) : isOwner ? (
            <button
              onClick={
                newAnnouncement
              }
              className="flex w-full items-center justify-between rounded-[18px] bg-neutral-50 px-4 py-3 text-left"
            >
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                  {t.announcements}
                </p>

                <p className="mt-1 text-[13px] font-medium">
                  {t.noAnnouncement}
                </p>
              </div>

              <span className="text-xl">
                +
              </span>
            </button>
          ) : null}
        </div>

        {/* ERROR */}

        {errorMessage && (
          <div className="mx-4 mt-3 shrink-0 rounded-2xl bg-red-50 px-4 py-3">
            <p className="break-words text-xs leading-5 text-red-600">
              {errorMessage}
            </p>
          </div>
        )}

        {/* CHAT */}

        <section className="flex-1 overflow-y-auto px-4 pb-4 pt-5">

          {messages.length === 0 ? (
            <div className="flex min-h-full items-center justify-center">
              <div className="max-w-[270px] text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-neutral-100 text-xl">
                  WYD
                </div>

                <h2 className="mt-5 text-[20px] font-semibold tracking-[-0.03em]">
                  {t.start}
                </h2>

                <p className="mt-2 text-sm leading-6 text-neutral-400">
                  {t.startDescription}
                </p>

                <button
                  onClick={() =>
                    setShowQR(
                      true
                    )
                  }
                  className="mt-6 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white"
                >
                  {t.qrCode}
                </button>

              </div>
            </div>
          ) : (
            <div className="space-y-4">

              {messages.map(
                (item) => {
                  const mine =
                    item.sender_id ===
                    senderId;

                  const translated =
                    hasTranslation(
                      "message",
                      item.id,
                      item.content,
                      item.source_language
                    );

                  const showingOriginal =
                    isShowingOriginal(
                      "message",
                      item.id,
                      item.content,
                      item.source_language
                    );

                  return (
                    <div
                      key={item.id}
                      className={`flex ${
                        mine
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div className="max-w-[82%]">

                        {!mine && (
                          <p className="mb-1.5 ml-2 text-[11px] font-medium text-neutral-400">
                            {getSenderName(
                              item.sender_id
                            )}
                          </p>
                        )}

                        <div
                          className={`rounded-[22px] px-4 py-3 ${
                            mine
                              ? "rounded-br-[7px] bg-black text-white"
                              : "rounded-bl-[7px] bg-neutral-100 text-black"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words text-[15px] leading-[1.55]">
                            {translatedText(
                              "message",
                              item.id,
                              item.content,
                              item.source_language
                            )}
                          </p>
                        </div>

                        {item.source_language !==
                          language && (
                          <div
                            className={`mt-1.5 flex items-center gap-2 ${
                              mine
                                ? "justify-end pr-1"
                                : "justify-start pl-2"
                            }`}
                          >
                            {translated ? (
                              <>
                                <span className="text-[9px] text-neutral-400">
                                  {showingOriginal
                                    ? t.original
                                    : t.translated}
                                  {" · "}
                                  {languageName(
                                    item.source_language
                                  )}
                                </span>

                                <button
                                  onClick={() =>
                                    toggleOriginal(
                                      "message",
                                      item.id,
                                      item.content,
                                      item.source_language
                                    )
                                  }
                                  className="text-[9px] font-semibold text-neutral-500"
                                >
                                  {showingOriginal
                                    ? t.viewTranslation
                                    : t.viewOriginal}
                                </button>
                              </>
                            ) : (
                              <span className="text-[9px] text-neutral-400">
                                {t.translating}
                              </span>
                            )}
                          </div>
                        )}

                      </div>
                    </div>
                  );
                }
              )}

              <div ref={bottomRef} />

            </div>
          )}
        </section>

        {/* INPUT */}

        <section className="shrink-0 border-t border-neutral-100 bg-white px-3 pb-5 pt-3">
          <div className="flex items-end gap-2">

            {isOwner && (
              <button
                onClick={() =>
                  setShowActions(
                    true
                  )
                }
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-2xl transition active:scale-95"
              >
                +
              </button>
            )}

            <div className="flex min-w-0 flex-1 items-end rounded-[25px] bg-neutral-100 p-1.5">

              <textarea
                value={message}
                onChange={(event) =>
                  setMessage(
                    event.target.value
                  )
                }
                placeholder={
                  t.message
                }
                rows={1}
                className="max-h-28 min-h-11 min-w-0 flex-1 resize-none bg-transparent px-4 py-3 text-[15px] outline-none placeholder:text-neutral-400"
              />

              <button
                onClick={
                  sendMessage
                }
                disabled={
                  !message.trim() ||
                  sending
                }
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-lg text-white transition active:scale-95 disabled:bg-neutral-300"
              >
                {sending
                  ? "…"
                  : "↑"}
              </button>

            </div>
          </div>
        </section>
      </div>

      {/* ROOM MENU */}

      {showRoomMenu && (
        <Sheet
          onClose={() =>
            setShowRoomMenu(
              false
            )
          }
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                WYD
              </p>

              <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.04em]">
                {t.roomMenu}
              </h2>

              <p className="mt-1 text-xs text-neutral-400">
                {roomId}
              </p>
            </div>

            <CloseButton
              onClick={() =>
                setShowRoomMenu(
                  false
                )
              }
            />
          </div>

          <div className="mt-7 space-y-2">

            <MenuRow
              title={
                t.participants
              }
              value={
                language === "ko"
                  ? `${participantCount}${t.peopleOnline}`
                  : `${participantCount} ${t.peopleOnline}`
              }
              onClick={() => {
                setShowRoomMenu(
                  false
                );

                setShowParticipants(
                  true
                );
              }}
            />

            <MenuRow
              title={
                t.language
              }
              value={
                languageName(
                  language
                )
              }
              onClick={() => {
                setShowRoomMenu(
                  false
                );

                setShowLanguage(
                  true
                );
              }}
            />

            <MenuRow
              title={
                t.announcements
              }
              value={`${announcements.length}`}
              onClick={
                openAnnouncements
              }
            />

            <MenuRow
              title={
                t.qrCode
              }
              onClick={() => {
                setShowRoomMenu(
                  false
                );

                setShowQR(true);
              }}
            />

            <MenuRow
              title={
                t.changeName
              }
              value={
                displayName
              }
              onClick={() => {
                setNameInput(
                  displayName
                );

                setShowRoomMenu(
                  false
                );

                setShowNameSetup(
                  true
                );
              }}
            />

          </div>

          {isOwner && (
            <button
              onClick={
                newAnnouncement
              }
              className="mt-5 w-full rounded-[20px] bg-black py-4 text-sm font-semibold text-white"
            >
              + {t.writeAnnouncement}
            </button>
          )}
        </Sheet>
      )}

      {/* OWNER ACTIONS */}

      {showActions && isOwner && (
        <Sheet
          onClose={() =>
            setShowActions(false)
          }
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                WYD
              </p>

              <h2 className="mt-2 text-[26px] font-semibold">
                {t.actions}
              </h2>
            </div>

            <CloseButton
              onClick={() =>
                setShowActions(
                  false
                )
              }
            />
          </div>

          <button
            onClick={
              newAnnouncement
            }
            className="mt-6 flex w-full items-center justify-between rounded-[22px] bg-black px-5 py-5 text-left text-white"
          >
            <div>
              <p className="text-sm font-semibold">
                {t.writeAnnouncement}
              </p>

              <p className="mt-1 text-xs text-neutral-400">
                {t.announcements}
              </p>
            </div>

            <span className="text-2xl">
              +
            </span>
          </button>

          <button
            onClick={() => {
              setShowActions(
                false
              );

              setShowQR(true);
            }}
            className="mt-2 flex w-full items-center justify-between rounded-[22px] bg-neutral-100 px-5 py-5 text-left"
          >
            <p className="text-sm font-semibold">
              {t.qrCode}
            </p>

            <span>
              ⌗
            </span>
          </button>
        </Sheet>
      )}

      {/* PARTICIPANTS */}

      {showParticipants && (
        <Sheet
          onClose={() =>
            setShowParticipants(
              false
            )
          }
        >
          <div className="flex items-start justify-between">

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                WYD
              </p>

              <h2 className="mt-2 text-[28px] font-semibold">
                {t.participants}
              </h2>

              <p className="mt-1 text-xs text-neutral-400">
                {language === "ko"
                  ? `${participantCount}${t.peopleOnline}`
                  : `${participantCount} ${t.peopleOnline}`}
              </p>
            </div>

            <CloseButton
              onClick={() =>
                setShowParticipants(
                  false
                )
              }
            />
          </div>

          <div className="mt-6 max-h-[52vh] space-y-2 overflow-y-auto">
            {onlineParticipants.map(
              (participant) => {
                const mine =
                  participant.user_id ===
                  senderId;

                const host =
                  participant.user_id ===
                  ownerId;

                return (
                  <div
                    key={
                      participant.user_id
                    }
                    className="flex items-center gap-3 rounded-[20px] bg-neutral-100 px-4 py-3"
                  >
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold">

                      {participant.name
                        .slice(0, 1)
                        .toUpperCase()}

                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-neutral-100 bg-green-500" />

                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">

                        <p className="truncate text-sm font-semibold">
                          {participant.name}
                        </p>

                        {mine && (
                          <span className="rounded-full bg-black px-2 py-0.5 text-[9px] font-semibold text-white">
                            {t.you}
                          </span>
                        )}

                        {host && (
                          <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-semibold text-neutral-500">
                            {t.host}
                          </span>
                        )}

                      </div>

                      <p className="mt-1 text-[10px] text-neutral-400">
                        {languageName(
                          participant.language
                        )}
                      </p>
                    </div>
                  </div>
                );
              }
            )}
          </div>

          <button
            onClick={() => {
              setNameInput(
                displayName
              );

              setShowParticipants(
                false
              );

              setShowNameSetup(
                true
              );
            }}
            className="mt-5 w-full rounded-[20px] bg-neutral-100 py-4 text-sm font-semibold"
          >
            {t.changeName}
          </button>
        </Sheet>
      )}

      {/* QR */}

      {showQR && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-5 backdrop-blur-sm">

          <div className="w-full max-w-[360px] rounded-[32px] bg-white p-7">

            <div className="flex items-start justify-between">

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                  WYD
                </p>

                <h2 className="mt-2 text-[27px] font-semibold tracking-[-0.04em]">
                  {t.join}
                </h2>
              </div>

              <CloseButton
                onClick={() =>
                  setShowQR(false)
                }
              />
            </div>

            <p className="mt-3 text-sm leading-6 text-neutral-500">
              {t.joinDescription}
            </p>

            <div className="mt-7 flex justify-center rounded-[28px] bg-neutral-50 p-6">
              {roomUrl && (
                <QRCodeSVG
                  value={roomUrl}
                  size={210}
                  level="M"
                />
              )}
            </div>

            <p className="mt-4 text-center text-[10px] font-medium text-neutral-400">
              {roomId}
            </p>

            <button
              onClick={() =>
                setShowQR(false)
              }
              className="mt-6 w-full rounded-[20px] bg-black py-4 text-sm font-semibold text-white"
            >
              {t.close}
            </button>

          </div>
        </div>
      )}

      {/* ANNOUNCEMENT LIST */}

      {showAnnouncementList && (
        <Sheet
          onClose={() =>
            setShowAnnouncementList(
              false
            )
          }
        >
          <div className="flex items-start justify-between">

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                WYD
              </p>

              <h2 className="mt-2 text-[28px] font-semibold">
                {t.allAnnouncements}
              </h2>
            </div>

            <CloseButton
              onClick={() =>
                setShowAnnouncementList(
                  false
                )
              }
            />
          </div>

          {isOwner && (
            <button
              onClick={
                newAnnouncement
              }
              className="mt-5 w-full rounded-[18px] bg-black py-3.5 text-sm font-semibold text-white"
            >
              + {t.writeAnnouncement}
            </button>
          )}

          <div className="mt-5 max-h-[55vh] space-y-3 overflow-y-auto">

            {announcements.length ===
            0 ? (
              <div className="rounded-[22px] bg-neutral-100 px-5 py-8 text-center">
                <p className="text-sm text-neutral-400">
                  {t.noAnnouncement}
                </p>
              </div>
            ) : (
              announcements.map(
                (
                  item,
                  index
                ) => {
                  const info =
                    priorityInfo(
                      item.priority
                    );

                  const translated =
                    hasTranslation(
                      "announcement",
                      item.id,
                      item.content,
                      item.source_language
                    );

                  const showingOriginal =
                    isShowingOriginal(
                      "announcement",
                      item.id,
                      item.content,
                      item.source_language
                    );

                  return (
                    <div
                      key={item.id}
                      onClick={() =>
                        markAsRead(
                          item.id
                        )
                      }
                      className={`rounded-[22px] border p-5 ${info.panel}`}
                    >

                      <div className="flex items-center justify-between gap-3">

                        <div className="flex items-center gap-2">

                          <span
                            className={`rounded-full px-3 py-1 text-[10px] font-semibold ${info.badge}`}
                          >
                            {info.label}
                          </span>

                          {index ===
                            0 && (
                            <span className="text-[9px] font-semibold text-neutral-400">
                              {t.latest}
                            </span>
                          )}

                        </div>

                        {isOwner && (
                          <span className="text-[10px] text-neutral-400">
                            {readCounts[
                              item.id
                            ] || 0}
                            {" / "}
                            {participantCount}
                          </span>
                        )}

                      </div>

                      <p className="mt-4 whitespace-pre-wrap break-words text-[14px] leading-6">
                        {translatedText(
                          "announcement",
                          item.id,
                          item.content,
                          item.source_language
                        )}
                      </p>

                      {item.source_language !==
                        language && (
                        <div className="mt-3 flex items-center gap-2">

                          {translated ? (
                            <>
                              <span className="text-[9px] text-neutral-400">
                                {showingOriginal
                                  ? t.original
                                  : t.translated}
                                {" · "}
                                {languageName(
                                  item.source_language
                                )}
                              </span>

                              <button
                                onClick={(
                                  event
                                ) => {
                                  event.stopPropagation();

                                  toggleOriginal(
                                    "announcement",
                                    item.id,
                                    item.content,
                                    item.source_language
                                  );
                                }}
                                className="text-[9px] font-semibold text-neutral-600"
                              >
                                {showingOriginal
                                  ? t.viewTranslation
                                  : t.viewOriginal}
                              </button>
                            </>
                          ) : (
                            <span className="text-[9px] text-neutral-400">
                              {t.translating}
                            </span>
                          )}

                        </div>
                      )}

                      {isOwner && (
                        <div className="mt-4 flex gap-2">

                          <button
                            onClick={(
                              event
                            ) => {
                              event.stopPropagation();

                              editAnnouncement(
                                item
                              );
                            }}
                            className="rounded-full bg-white px-3 py-2 text-[11px] font-semibold"
                          >
                            {t.edit}
                          </button>

                          <button
                            onClick={(
                              event
                            ) => {
                              event.stopPropagation();

                              setDeletingAnnouncement(
                                item
                              );
                            }}
                            className="rounded-full bg-white px-3 py-2 text-[11px] font-semibold text-red-500"
                          >
                            {t.delete}
                          </button>

                        </div>
                      )}

                    </div>
                  );
                }
              )
            )}

          </div>
        </Sheet>
      )}

      {/* ANNOUNCEMENT WRITE */}

      {showAnnouncementWriter &&
        isOwner && (
          <Sheet
            onClose={() => {
              setShowAnnouncementWriter(
                false
              );

              setEditingAnnouncement(
                null
              );
            }}
          >
            <div className="flex items-start justify-between">

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                  WYD
                </p>

                <h2 className="mt-2 text-[28px] font-semibold">
                  {editingAnnouncement
                    ? t.editAnnouncement
                    : t.newAnnouncement}
                </h2>
              </div>

              <CloseButton
                onClick={() => {
                  setShowAnnouncementWriter(
                    false
                  );

                  setEditingAnnouncement(
                    null
                  );
                }}
              />

            </div>

            <p className="mt-6 text-xs font-semibold text-neutral-400">
              {t.priority}
            </p>

            <div className="mt-3 grid grid-cols-3 gap-2">

              {(
                [
                  "normal",
                  "important",
                  "urgent",
                ] as Priority[]
              ).map(
                (priority) => (
                  <button
                    key={priority}
                    onClick={() =>
                      setAnnouncementPriority(
                        priority
                      )
                    }
                    className={`rounded-[16px] py-3 text-xs font-semibold ${
                      announcementPriority ===
                      priority
                        ? priority ===
                          "urgent"
                          ? "bg-red-500 text-white"
                          : "bg-black text-white"
                        : "bg-neutral-100 text-black"
                    }`}
                  >
                    {priority ===
                    "normal"
                      ? t.normal
                      : priority ===
                        "important"
                      ? t.important
                      : t.urgent}
                  </button>
                )
              )}

            </div>

            <textarea
              value={
                announcementText
              }
              onChange={(event) =>
                setAnnouncementText(
                  event.target.value
                )
              }
              maxLength={500}
              placeholder={
                t.announcementPlaceholder
              }
              className="mt-5 h-[190px] w-full resize-none rounded-[22px] bg-neutral-100 p-5 text-[15px] leading-6 outline-none placeholder:text-neutral-400"
            />

            <div className="mt-2 text-right text-[10px] text-neutral-400">
              {announcementText.length}
              /500
            </div>

            <button
              onClick={
                saveAnnouncement
              }
              disabled={
                !announcementText.trim() ||
                publishingAnnouncement
              }
              className="mt-3 w-full rounded-[20px] bg-black py-4 text-sm font-semibold text-white disabled:bg-neutral-300"
            >
              {publishingAnnouncement
                ? "…"
                : editingAnnouncement
                ? t.save
                : t.publish}
            </button>
          </Sheet>
        )}

      {/* DELETE */}

      {deletingAnnouncement && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 px-5 backdrop-blur-sm">

          <div className="w-full max-w-[350px] rounded-[30px] bg-white p-6">

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
              !
            </div>

            <h2 className="mt-5 text-[23px] font-semibold tracking-[-0.03em]">
              {t.deleteTitle}
            </h2>

            <p className="mt-3 text-sm leading-6 text-neutral-500">
              {t.deleteDescription}
            </p>

            <button
              onClick={
                deleteAnnouncement
              }
              className="mt-6 w-full rounded-[20px] bg-red-500 py-4 text-sm font-semibold text-white"
            >
              {t.deleteConfirm}
            </button>

            <button
              onClick={() =>
                setDeletingAnnouncement(
                  null
                )
              }
              className="mt-2 w-full rounded-[20px] bg-neutral-100 py-4 text-sm font-semibold"
            >
              {t.cancel}
            </button>

          </div>
        </div>
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
  children:
    React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/45 px-3 pb-3 backdrop-blur-sm sm:items-center"
      onClick={
        onClose
      }
    >
      <div
        onClick={(
          event
        ) =>
          event.stopPropagation()
        }
        className="w-full max-w-[410px] rounded-[32px] bg-white p-6 shadow-2xl"
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
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xl"
    >
      ×
    </button>
  );
}

function MenuRow({
  title,
  value,
  onClick,
}: {
  title: string;
  value?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={
        onClick
      }
      className="flex w-full items-center justify-between rounded-[18px] bg-neutral-100 px-5 py-4 text-left transition active:scale-[0.99]"
    >
      <span className="text-sm font-semibold">
        {title}
      </span>

      <div className="flex items-center gap-2">
        {value && (
          <span className="max-w-[150px] truncate text-xs text-neutral-400">
            {value}
          </span>
        )}

        <span className="text-neutral-400">
          ›
        </span>
      </div>
    </button>
  );
}

function NameScreen({
  title,
  description,
  placeholder,
  button,
  value,
  onChange,
  onSave,
}: {
  title: string;
  description: string;
  placeholder: string;
  button: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  onSave: () => void;
}) {
  return (
    <main className="min-h-[100dvh] bg-[#f7f7f5] px-6 py-10 text-black">

      <div className="mx-auto w-full max-w-[430px]">

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
          WYD Messenger
        </p>

        <h1 className="mt-5 text-[38px] font-semibold leading-[1.05] tracking-[-0.05em]">
          {title}
        </h1>

        <p className="mt-4 max-w-[320px] text-sm leading-6 text-neutral-500">
          {description}
        </p>

        <input
          autoFocus
          value={value}
          maxLength={30}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          onKeyDown={(event) => {
            if (
              event.key ===
              "Enter"
            ) {
              onSave();
            }
          }}
          placeholder={
            placeholder
          }
          className="mt-10 w-full rounded-[24px] bg-white px-5 py-5 text-[17px] font-medium outline-none placeholder:text-neutral-300"
        />

        <button
          onClick={
            onSave
          }
          disabled={
            !value.trim()
          }
          className="mt-4 w-full rounded-[22px] bg-black py-4 text-sm font-semibold text-white disabled:bg-neutral-300"
        >
          {button}
        </button>

      </div>
    </main>
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
    <main className="min-h-[100dvh] bg-white px-6 py-10 text-black">

      <div className="mx-auto w-full max-w-[430px]">

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
          Language
        </p>

        <h1 className="mt-5 text-[38px] font-semibold leading-[1.05] tracking-[-0.05em]">
          Choose your
          <br />
          language.
        </h1>

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
  onSelect,
  onClose,
}: {
  language: string;
  title: string;
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
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Language
          </p>

          <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.04em]">
            {title}
          </h2>
        </div>

        <CloseButton
          onClick={
            onClose
          }
        />

      </div>

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
    <div className="mt-6 max-h-[55vh] space-y-2 overflow-y-auto">

      {languages.map(
        (item) => (
          <button
            key={
              item.code
            }
            onClick={() =>
              onSelect(
                item.code
              )
            }
            className={`flex w-full items-center justify-between rounded-[18px] px-5 py-4 text-left ${
              language ===
              item.code
                ? "bg-black text-white"
                : "bg-neutral-100 text-black"
            }`}
          >
            <span className="text-sm font-semibold">
              {item.name}
            </span>

            {language ===
              item.code && (
              <span>
                ✓
              </span>
            )}
          </button>
        )
      )}

    </div>
  );
}