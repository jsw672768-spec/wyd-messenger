"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import { getSupabaseBrowser, useWydIdentity } from '@/lib/supabase-browser';

import {
  QRCodeSVG,
} from "qrcode.react";


type EventData = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  status: "active" | "ended";
  start_at: string | null;
  end_at: string | null;
  created_at: string;
};


type RoomType =
  | "general"
  | "country"
  | "group"
  | "location"
  | "help"
  | "custom";


type Room = {
  id: string;
  event_id: string | null;
  name: string | null;
  room_type: RoomType;
  country_code: string | null;
  sort_order: number;
  status: string;
};


type Participant = {
  user_id: string;
  display_name: string;
  language: string;

  role:
    | "participant"
    | "staff"
    | "organizer";
};


type Country = {
  code: string;
  name: string;
  flag: string;
};


type AnnouncementPriority =
  | "normal"
  | "important"
  | "urgent";


type EventAnnouncement = {
  id: number;
  event_id: string;
  author_id: string;
  content: string;
  source_language: string;
  priority: AnnouncementPriority;
  created_at: string;
};


type AnnouncementRead = {
  announcement_id: number;
  user_id: string;
  read_at: string;
};


type EventScheduleItem = {
  id: number;
  event_id: string;
  title: string;
  description: string | null;
  location_name: string | null;
  starts_at: string;
  ends_at: string | null;
  source_language: string;
};


type MeetingPoint = {
  event_id: string;
  name: string;
  details: string | null;
  map_url: string | null;
  source_language: string;
  updated_at: string;
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


const countries: Country[] = [
  { code: "KR", name: "Korea", flag: "🇰🇷" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },

  { code: "PL", name: "Poland", flag: "🇵🇱" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "IE", name: "Ireland", flag: "🇮🇪" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },

  { code: "BE", name: "Belgium", flag: "🇧🇪" },
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "HR", name: "Croatia", flag: "🇭🇷" },
  { code: "CZ", name: "Czechia", flag: "🇨🇿" },

  { code: "HU", name: "Hungary", flag: "🇭🇺" },
  { code: "SK", name: "Slovakia", flag: "🇸🇰" },
  { code: "SI", name: "Slovenia", flag: "🇸🇮" },
  { code: "RO", name: "Romania", flag: "🇷🇴" },
  { code: "GR", name: "Greece", flag: "🇬🇷" },

  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },

  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "PE", name: "Peru", flag: "🇵🇪" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪" },

  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "TW", name: "Taiwan", flag: "🇹🇼" },
  { code: "PH", name: "Philippines", flag: "🇵🇭" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩" },

  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳" },
  { code: "TH", name: "Thailand", flag: "🇹🇭" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },

  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "KE", name: "Kenya", flag: "🇰🇪" },
];


const copy: Record<
  string,
  Record<string, string>
> = {
  en: {
    participants: "participants",
    rooms: "Rooms",
    event: "Event",
    organizer: "Organizer",

    eventQR: "Event QR",

    qrDescription:
      "Share this QR. Anyone can join this event without creating an account.",

    share: "Share event",
    copied: "Link copied",

    language: "Language",
    changeName: "Change name",

    yourName: "Your name",

    nameDescription:
      "This name will be visible to people at the event.",

    enterName: "Enter your name",
    continue: "Continue",
    save: "Save",

    chooseLanguage: "Choose language",

    eventEnded: "This event has ended.",

    eventEndedDescription:
      "This temporary WYD network is no longer active.",

    backHome: "Back to WYD",
    notFound: "Event not found.",

    organizerTools: "Organizer tools",

    broadcast: "Event announcement",

    broadcastDescription:
      "Send one announcement to everyone in this event.",

    announcementStatus:
      "Announcement status",

    recentAnnouncements:
      "Recent announcements",

    noAnnouncements:
      "No event announcements yet.",

    confirmed: "Confirmed",
    unconfirmed: "Not confirmed",
    viewDetails: "View details",

    countryRooms: "Country rooms",
    otherRooms: "Other rooms",

    createCountryRoom: "Add country room",

    countryDescription:
      "Choose a country and WYD will create its room automatically.",

    chooseCountry: "Choose country",
    searchCountry: "Search country",

    alreadyCreated:
      "This country room already exists.",

    createOtherRoom:
      "Create other room",

    createRoomDescription:
      "Create a space for transport, locations, teams, help or anything else.",

    roomName: "Room name",
    roomNamePlaceholder: "Bus 12",

    roomType: "Room type",

    group: "Group",
    location: "Location",
    help: "Help",
    custom: "Custom",

    groupDescription:
      "For a specific team or group",

    locationDescription:
      "For a meeting point or place",

    helpDescription:
      "Questions and support",

    customDescription:
      "Create your own purpose",

    creating: "Creating...",
    create: "Create room",

    roomError:
      "The room could not be created.",

    network: "Event network",

    noCountryRooms:
      "No country rooms yet.",

    noOtherRooms:
      "No other rooms yet.",

    announcementTitle:
      "Event announcement",

    announcementDescription:
      "Everyone in this event will receive this announcement.",

    announcementPlaceholder:
      "Write an announcement for everyone...",

    priority: "Priority",
    normal: "Normal",
    important: "Important",
    urgent: "Urgent",

    sendAnnouncement:
      "Send announcement",

    sendUrgent:
      "Send urgent announcement",

    sending: "Sending...",

    announcementError:
      "The announcement could not be sent.",

    sent: "Announcement sent",

    nextSchedule: "Next schedule",

    scheduleEmpty:
      "No upcoming schedule.",

    viewSchedule:
      "View full schedule",

    meetingPoint:
      "Meeting point",

    meetingEmpty:
      "Meeting point has not been set yet.",

    viewMeeting:
      "View meeting point",

    openMap:
      "Map",

    original:
      "Original",

    translated:
      "Translated",
  },

  ko: {
    participants: "명 참가",
    rooms: "채팅방",
    event: "이벤트",
    organizer: "운영자",

    eventQR: "이벤트 QR",

    qrDescription:
      "이 QR 하나를 공유하세요. 회원가입 없이 누구나 이벤트에 참여할 수 있어요.",

    share: "이벤트 공유",
    copied: "링크 복사됨",

    language: "언어",
    changeName: "이름 변경",

    yourName: "이름",

    nameDescription:
      "이벤트 참가자들에게 표시될 이름이에요.",

    enterName: "이름을 입력하세요",
    continue: "계속",
    save: "저장",

    chooseLanguage: "언어 선택",

    eventEnded:
      "이벤트가 종료되었습니다.",

    eventEndedDescription:
      "이 WYD 임시 네트워크는 더 이상 활성화되어 있지 않습니다.",

    backHome: "WYD 홈으로",

    notFound:
      "이벤트를 찾을 수 없습니다.",

    organizerTools:
      "운영자 기능",

    broadcast:
      "전체 공지",

    broadcastDescription:
      "이벤트에 참가한 모든 사람에게 한 번에 공지를 전달하세요.",

    announcementStatus:
      "공지 확인 현황",

    recentAnnouncements:
      "최근 전체 공지",

    noAnnouncements:
      "아직 전체 공지가 없습니다.",

    confirmed: "확인",
    unconfirmed: "미확인",
    viewDetails: "자세히 보기",

    countryRooms:
      "국가별 채팅방",

    otherRooms:
      "기타 채팅방",

    createCountryRoom:
      "국가 채팅방 추가",

    countryDescription:
      "국가만 선택하면 WYD가 국기와 이름을 넣어 채팅방을 자동으로 만들어요.",

    chooseCountry:
      "국가 선택",

    searchCountry:
      "국가 검색",

    alreadyCreated:
      "이미 만들어진 국가 채팅방입니다.",

    createOtherRoom:
      "기타 채팅방 만들기",

    createRoomDescription:
      "버스, 팀, 집합 장소, 도움방 등 행사에 필요한 공간을 만들어보세요.",

    roomName:
      "채팅방 이름",

    roomNamePlaceholder:
      "Bus 12",

    roomType:
      "채팅방 종류",

    group: "그룹",
    location: "장소",
    help: "도움",
    custom: "사용자 지정",

    groupDescription:
      "특정 팀이나 그룹을 위한 공간",

    locationDescription:
      "집합 장소나 특정 위치를 위한 공간",

    helpDescription:
      "질문과 도움 요청을 위한 공간",

    customDescription:
      "원하는 용도로 직접 만들기",

    creating: "만드는 중...",

    create:
      "채팅방 만들기",

    roomError:
      "채팅방을 만들지 못했습니다.",

    network:
      "이벤트 네트워크",

    noCountryRooms:
      "아직 국가별 채팅방이 없어요.",

    noOtherRooms:
      "아직 기타 채팅방이 없어요.",

    announcementTitle:
      "전체 공지",

    announcementDescription:
      "이 이벤트에 참가한 모든 사람에게 전달됩니다.",

    announcementPlaceholder:
      "모든 참가자에게 전달할 내용을 입력하세요.",

    priority:
      "중요도",

    normal: "일반",
    important: "중요",
    urgent: "긴급",

    sendAnnouncement:
      "📢 전체 공지 보내기",

    sendUrgent:
      "🚨 긴급 공지 보내기",

    sending:
      "보내는 중...",

    announcementError:
      "공지를 보내지 못했습니다.",

    sent:
      "공지를 보냈습니다",

    nextSchedule:
      "다음 일정",

    scheduleEmpty:
      "예정된 일정이 없습니다.",

    viewSchedule:
      "전체 일정 보기",

    meetingPoint:
      "집합 장소",

    meetingEmpty:
      "아직 집합 장소가 설정되지 않았습니다.",

    viewMeeting:
      "집합 장소 보기",

    openMap:
      "지도",

    original:
      "원문",

    translated:
      "번역",
  },

  es: {
    participants: "participantes",
    rooms: "Salas",
    event: "Evento",
    organizer: "Organizador",

    eventQR: "QR del evento",

    qrDescription:
      "Comparte este QR. Cualquiera puede entrar sin crear una cuenta.",

    share: "Compartir evento",
    copied: "Enlace copiado",

    language: "Idioma",
    changeName: "Cambiar nombre",

    yourName: "Tu nombre",

    nameDescription:
      "Este nombre será visible para los participantes.",

    enterName:
      "Escribe tu nombre",

    continue: "Continuar",
    save: "Guardar",

    chooseLanguage:
      "Elegir idioma",

    eventEnded:
      "Este evento ha terminado.",

    eventEndedDescription:
      "Esta red temporal de WYD ya no está activa.",

    backHome:
      "Volver a WYD",

    notFound:
      "Evento no encontrado.",

    organizerTools:
      "Herramientas",

    broadcast:
      "Anuncio general",

    broadcastDescription:
      "Envía un anuncio a todos los participantes.",

    announcementStatus:
      "Estado del anuncio",

    recentAnnouncements:
      "Anuncios recientes",

    noAnnouncements:
      "No hay anuncios.",

    confirmed:
      "Confirmado",

    unconfirmed:
      "Sin confirmar",

    viewDetails:
      "Ver detalles",

    countryRooms:
      "Salas por país",

    otherRooms:
      "Otras salas",

    createCountryRoom:
      "Añadir país",

    countryDescription:
      "Elige un país y WYD creará la sala automáticamente.",

    chooseCountry:
      "Elegir país",

    searchCountry:
      "Buscar país",

    alreadyCreated:
      "La sala de este país ya existe.",

    createOtherRoom:
      "Crear otra sala",

    createRoomDescription:
      "Crea salas para grupos, lugares, transporte o ayuda.",

    roomName:
      "Nombre de la sala",

    roomNamePlaceholder:
      "Bus 12",

    roomType:
      "Tipo de sala",

    group: "Grupo",
    location: "Lugar",
    help: "Ayuda",
    custom: "Personalizada",

    groupDescription:
      "Para un grupo específico",

    locationDescription:
      "Para un lugar de encuentro",

    helpDescription:
      "Preguntas y soporte",

    customDescription:
      "Cualquier otro propósito",

    creating:
      "Creando...",

    create:
      "Crear sala",

    roomError:
      "No se pudo crear la sala.",

    network:
      "Red del evento",

    noCountryRooms:
      "No hay salas de países.",

    noOtherRooms:
      "No hay otras salas.",

    announcementTitle:
      "Anuncio general",

    announcementDescription:
      "Todos los participantes recibirán este anuncio.",

    announcementPlaceholder:
      "Escribe un anuncio para todos...",

    priority:
      "Prioridad",

    normal: "Normal",
    important: "Importante",
    urgent: "Urgente",

    sendAnnouncement:
      "Enviar anuncio",

    sendUrgent:
      "Enviar anuncio urgente",

    sending:
      "Enviando...",

    announcementError:
      "No se pudo enviar el anuncio.",

    sent:
      "Anuncio enviado",

    nextSchedule:
      "Próximo horario",

    scheduleEmpty:
      "No hay horarios próximos.",

    viewSchedule:
      "Ver horario completo",

    meetingPoint:
      "Punto de encuentro",

    meetingEmpty:
      "Todavía no hay punto de encuentro.",

    viewMeeting:
      "Ver punto de encuentro",

    openMap:
      "Mapa",

    original:
      "Original",

    translated:
      "Traducido",
  },
};


export default function EventPage() {
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


  const [
    eventData,
    setEventData,
  ] = useState<EventData | null>(
    null
  );


  const [
    notFound,
    setNotFound,
  ] = useState(false);


  const [
    rooms,
    setRooms,
  ] = useState<Room[]>([]);


  const [
    participants,
    setParticipants,
  ] = useState<Participant[]>(
    []
  );


  const [
    eventAnnouncements,
    setEventAnnouncements,
  ] = useState<EventAnnouncement[]>(
    []
  );


  const [
    announcementReads,
    setAnnouncementReads,
  ] = useState<AnnouncementRead[]>(
    []
  );


  const [
    selectedAnnouncement,
    setSelectedAnnouncement,
  ] = useState<EventAnnouncement | null>(
    null
  );


  // ===================================
  // EVENT TOOLS
  // ===================================

  const [
    nextSchedule,
    setNextSchedule,
  ] = useState<EventScheduleItem | null>(
    null
  );


  const [
    meetingPoint,
    setMeetingPoint,
  ] = useState<MeetingPoint | null>(
    null
  );


  const [
    translatedScheduleTitle,
    setTranslatedScheduleTitle,
  ] = useState("");


  const [
    translatedScheduleDescription,
    setTranslatedScheduleDescription,
  ] = useState("");


  const [
    translatedMeetingDetails,
    setTranslatedMeetingDetails,
  ] = useState("");


  const [
    scheduleOriginal,
    setScheduleOriginal,
  ] = useState(false);


  const [
    meetingOriginal,
    setMeetingOriginal,
  ] = useState(false);


  const { senderId } = useWydIdentity();


  const [
    displayName,
    setDisplayName,
  ] = useState("");


  const [
    language,
    setLanguage,
  ] = useState("en");


  const [
    needsLanguage,
    setNeedsLanguage,
  ] = useState(false);


  const [
    needsName,
    setNeedsName,
  ] = useState(false);


  const [
    showQR,
    setShowQR,
  ] = useState(false);


  const [
    showLanguage,
    setShowLanguage,
  ] = useState(false);


  const [
    showName,
    setShowName,
  ] = useState(false);


  const [
    nameDraft,
    setNameDraft,
  ] = useState("");


  const [
    copied,
    setCopied,
  ] = useState(false);


  // ===================================
  // EVENT ANNOUNCEMENT
  // ===================================

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
  ] = useState<AnnouncementPriority>(
    "normal"
  );


  const [
    creatingAnnouncement,
    setCreatingAnnouncement,
  ] = useState(false);


  const [
    announcementError,
    setAnnouncementError,
  ] = useState("");


  const [
    announcementSent,
    setAnnouncementSent,
  ] = useState(false);


  // ===================================
  // COUNTRY ROOM
  // ===================================

  const [
    showCountryRoom,
    setShowCountryRoom,
  ] = useState(false);


  const [
    countrySearch,
    setCountrySearch,
  ] = useState("");


  const [
    selectedCountry,
    setSelectedCountry,
  ] = useState<Country | null>(
    null
  );


  const [
    creatingCountry,
    setCreatingCountry,
  ] = useState(false);


  const [
    countryError,
    setCountryError,
  ] = useState("");


  // ===================================
  // OTHER ROOM
  // ===================================

  const [
    showCreateRoom,
    setShowCreateRoom,
  ] = useState(false);


  const [
    roomName,
    setRoomName,
  ] = useState("");


  const [
    roomType,
    setRoomType,
  ] = useState<RoomType>(
    "group"
  );


  const [
    creatingRoom,
    setCreatingRoom,
  ] = useState(false);


  const [
    roomError,
    setRoomError,
  ] = useState("");


  const t =
    copy[language] ||
    copy.en;


  const isOrganizer =
    !!eventData &&
    !!senderId &&
    eventData.owner_id ===
      senderId;


  const eventUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/event/${eventId}`
      : "";


  const countryRooms =
    rooms.filter(
      (room) =>
        room.room_type ===
        "country"
    );


  const generalRooms =
    rooms.filter(
      (room) =>
        room.room_type ===
        "general"
    );


  const otherRooms =
    rooms.filter(
      (room) =>
        room.room_type !==
          "country" &&
        room.room_type !==
          "general"
    );


  const filteredCountries =
    countries.filter(
      (country) => {
        const search =
          countrySearch
            .trim()
            .toLowerCase();


        return (
          country.name
            .toLowerCase()
            .includes(search) ||

          country.code
            .toLowerCase()
            .includes(search)
        );
      }
    );


  const latestEventAnnouncement =
    eventAnnouncements[0] ||
    null;


  // ===================================
  // READ HELPERS
  // ===================================

  function readUserIds(
    announcementId: number
  ) {
    return new Set(
      announcementReads
        .filter(
          (read) =>
            read.announcement_id ===
            announcementId
        )
        .map(
          (read) =>
            read.user_id
        )
    );
  }


  function readCount(
    announcementId: number
  ) {
    return readUserIds(
      announcementId
    ).size;
  }


  function readPercentage(
    announcementId: number
  ) {
    if (
      participants.length ===
      0
    ) {
      return 0;
    }


    return Math.min(
      100,
      Math.round(
        (
          readCount(
            announcementId
          ) /
          participants.length
        ) *
          100
      )
    );
  }


  // ===================================
  // LOCAL PROFILE
  // ===================================

  useEffect(() => {
    const savedLanguage =
      localStorage.getItem(
        "wyd_language"
      );


    const savedName =
      localStorage.getItem(
        "wyd_display_name"
      );


    


    if (savedLanguage) {
      setLanguage(
        savedLanguage
      );
    } else {
      setNeedsLanguage(
        true
      );
    }


    if (savedName) {
      setDisplayName(
        savedName
      );


      setNameDraft(
        savedName
      );
    } else {
      setNeedsName(
        true
      );
    }
  }, []);


  // ===================================
  // EVENT DATA
  // ===================================

  useEffect(() => {
    if (
      !supabase ||
      !eventId ||
      !senderId ||
      needsLanguage ||
      needsName ||
      !displayName
    ) {
      return;
    }


    const client = supabase;

    let active =
      true;


    async function refreshParticipants() {
      const {
        data,
        error,
      } = await client
        .from(
          "event_participants"
        )
        .select(
          "user_id,display_name,language,role"
        )
        .eq(
          "event_id",
          eventId
        );


      if (
        !active ||
        error ||
        !data
      ) {
        return;
      }


      setParticipants(
        data as Participant[]
      );
    }


    async function refreshRooms() {
      const {
        data,
        error,
      } = await client
        .from("rooms")
        .select(
          "id,event_id,name,room_type,country_code,sort_order,status"
        )
        .eq(
          "event_id",
          eventId
        )
        .eq(
          "status",
          "active"
        )
        .order(
          "sort_order",
          {
            ascending: true,
          }
        );


      if (
        !active ||
        error ||
        !data
      ) {
        return;
      }


      setRooms(
        data as Room[]
      );
    }


    async function refreshAnnouncementStats() {
      const {
        data: announcementData,
        error: announcementError,
      } = await client
        .from(
          "event_announcements"
        )
        .select("*")
        .eq(
          "event_id",
          eventId
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(10);


      if (
        active &&
        !announcementError &&
        announcementData
      ) {
        setEventAnnouncements(
          announcementData as EventAnnouncement[]
        );
      }


      const {
        data: readData,
        error: readError,
      } = await client
        .from(
          "event_announcement_reads"
        )
        .select(
          "announcement_id,user_id,read_at"
        )
        .eq(
          "event_id",
          eventId
        );


      if (
        active &&
        !readError &&
        readData
      ) {
        setAnnouncementReads(
          readData as AnnouncementRead[]
        );
      }
    }


    async function refreshEventTools() {
      const {
        data: scheduleData,
        error: scheduleError,
      } = await client
        .from(
          "event_schedule_items"
        )
        .select(
          "id,event_id,title,description,location_name,starts_at,ends_at,source_language"
        )
        .eq(
          "event_id",
          eventId
        )
        .order(
          "starts_at",
          {
            ascending: true,
          }
        )
        .limit(50);


      if (
        active &&
        !scheduleError &&
        scheduleData
      ) {
        const now =
          Date.now();


        const next =
          (
            scheduleData as EventScheduleItem[]
          ).find(
            (item) => {
              const effectiveEnd =
                item.ends_at ||
                item.starts_at;


              return (
                new Date(
                  effectiveEnd
                ).getTime() >=
                now
              );
            }
          ) ||
          null;


        setNextSchedule(
          (current) => {
            if (
              !current &&
              !next
            ) {
              return null;
            }


            if (
              current &&
              next &&
              current.id ===
                next.id &&
              current.title ===
                next.title &&
              current.description ===
                next.description &&
              current.location_name ===
                next.location_name &&
              current.starts_at ===
                next.starts_at &&
              current.ends_at ===
                next.ends_at &&
              current.source_language ===
                next.source_language
            ) {
              return current;
            }


            return next;
          }
        );
      }


      const {
        data: meetingData,
        error: meetingError,
      } = await client
        .from(
          "event_meeting_points"
        )
        .select(
          "event_id,name,details,map_url,source_language,updated_at"
        )
        .eq(
          "event_id",
          eventId
        )
        .maybeSingle();


      if (
        active &&
        !meetingError
      ) {
        const incoming =
          meetingData
            ? meetingData as MeetingPoint
            : null;


        setMeetingPoint(
          (current) => {
            if (
              !current &&
              !incoming
            ) {
              return null;
            }


            if (
              current &&
              incoming &&
              current.event_id ===
                incoming.event_id &&
              current.name ===
                incoming.name &&
              current.details ===
                incoming.details &&
              current.map_url ===
                incoming.map_url &&
              current.source_language ===
                incoming.source_language &&
              current.updated_at ===
                incoming.updated_at
            ) {
              return current;
            }


            return incoming;
          }
        );
      }
    }


    async function initialize() {
      setLoading(
        true
      );


      const joined = await client.rpc('join_wyd_event', { p_event_id: eventId, p_display_name: displayName, p_language: language });
      if (joined.error) { if (active) { setNotFound(true); setLoading(false); } return; }
      const {
        data,
        error,
      } = await client
        .from("events")
        .select("*")
        .eq(
          "id",
          eventId
        )
        .maybeSingle();


      if (
        error ||
        !data
      ) {
        if (active) {
          setNotFound(
            true
          );


          setLoading(
            false
          );
        }


        return;
      }


      if (!active) {
        return;
      }


      const event =
        data as EventData;


      setEventData(
        event
      );


      await Promise.all([
        refreshRooms(),
        refreshParticipants(),
        refreshAnnouncementStats(),
        refreshEventTools(),
      ]);


      if (active) {
        setLoading(
          false
        );
      }
    }


    initialize();


    const timer =
      setInterval(() => {
        refreshRooms();
        refreshParticipants();
        refreshAnnouncementStats();
        refreshEventTools();
      }, 3000);


    return () => {
      active = false;


      clearInterval(
        timer
      );
    };
  }, [
    supabase,
    eventId,
    senderId,
    displayName,
    language,
    needsLanguage,
    needsName,
  ]);


  // ===================================
  // NEXT SCHEDULE TRANSLATION
  // ===================================

  useEffect(() => {
    const title =
      nextSchedule?.title ||
      "";


    const description =
      nextSchedule?.description ||
      "";


    const sourceLanguage =
      nextSchedule?.source_language ||
      "";


    setScheduleOriginal(
      false
    );


    if (
      !nextSchedule ||
      sourceLanguage ===
        language
    ) {
      setTranslatedScheduleTitle(
        ""
      );


      setTranslatedScheduleDescription(
        ""
      );


      return;
    }


    let cancelled =
      false;


    async function translateText(
      text: string
    ) {
      if (!text) {
        return "";
      }


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
                  text,

                  sourceLanguage,

                  targetLanguage:
                    language,
                }),
            }
          );


        const raw =
          await response.text();


        if (
          !response.ok ||
          !raw
        ) {
          return text;
        }


        const data =
          JSON.parse(
            raw
          );


        return (
          data?.translatedText ||
          text
        );
      } catch {
        return text;
      }
    }


    async function translate() {
      const [
        translatedTitle,
        translatedDescription,
      ] =
        await Promise.all([
          translateText(
            title
          ),

          translateText(
            description
          ),
        ]);


      if (cancelled) {
        return;
      }


      setTranslatedScheduleTitle(
        translatedTitle
      );


      setTranslatedScheduleDescription(
        translatedDescription
      );
    }


    translate();


    return () => {
      cancelled =
        true;
    };
  }, [
    nextSchedule?.id,
    nextSchedule?.title,
    nextSchedule?.description,
    nextSchedule?.source_language,
    language,
  ]);


  // ===================================
  // MEETING TRANSLATION
  // ===================================

  useEffect(() => {
    const details =
      meetingPoint?.details ||
      "";


    const sourceLanguage =
      meetingPoint?.source_language ||
      "";


    setMeetingOriginal(
      false
    );


    if (
      !details ||
      sourceLanguage ===
        language
    ) {
      setTranslatedMeetingDetails(
        ""
      );


      return;
    }


    let cancelled =
      false;


    async function translate() {
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
                    details,

                  sourceLanguage,

                  targetLanguage:
                    language,
                }),
            }
          );


        const raw =
          await response.text();


        if (
          cancelled ||
          !response.ok ||
          !raw
        ) {
          return;
        }


        const data =
          JSON.parse(
            raw
          );


        if (
          cancelled
        ) {
          return;
        }


        setTranslatedMeetingDetails(
          data?.translatedText ||
          details
        );
      } catch {}
    }


    translate();


    return () => {
      cancelled =
        true;
    };
  }, [
    meetingPoint?.details,
    meetingPoint?.source_language,
    language,
  ]);


  // ===================================
  // EVENT ANNOUNCEMENT
  // ===================================

  async function createEventAnnouncement() {
    if (
      !supabase ||
      !isOrganizer ||
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


    setAnnouncementSent(
      false
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
          eventId,

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
        t.announcementError
      );


      setCreatingAnnouncement(
        false
      );


      return;
    }


    const announcement =
      data as EventAnnouncement;


    setEventAnnouncements(
      (current) => [
        announcement,

        ...current.filter(
          (item) =>
            item.id !==
            announcement.id
        ),
      ]
    );


    const {
      data: readData,
      error: readError,
    } = await supabase
      .from(
        "event_announcement_reads"
      )
      .insert({
        announcement_id:
          announcement.id,

        event_id:
          eventId,

        user_id:
          senderId,
      })
      .select(
        "announcement_id,user_id,read_at"
      )
      .single();


    if (
      readError &&
      readError.code !==
        "23505"
    ) {
      console.error(
        "Announcement author read error:",
        readError
      );
    }


    if (readData) {
      setAnnouncementReads(
        (current) => [
          ...current,

          readData as AnnouncementRead,
        ]
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


    setAnnouncementSent(
      true
    );


    setTimeout(() => {
      setAnnouncementSent(
        false
      );
    }, 2200);
  }


  // ===================================
  // COUNTRY ROOM
  // ===================================

  async function createCountryRoom() {
    if (
      !supabase ||
      !isOrganizer ||
      !selectedCountry ||
      creatingCountry
    ) {
      return;
    }


    const exists =
      rooms.some(
        (room) =>
          room.country_code ===
          selectedCountry.code
      );


    if (exists) {
      setCountryError(
        t.alreadyCreated
      );


      return;
    }


    setCreatingCountry(
      true
    );


    setCountryError(
      ""
    );


    const newRoomId =
      crypto
        .randomUUID()
        .replaceAll(
          "-",
          ""
        )
        ;


    const nextSortOrder =
      rooms.length ===
      0
        ? 0
        : Math.max(
            ...rooms.map(
              (room) =>
                room.sort_order
            )
          ) + 1;


    const {
      data,
      error,
    } = await supabase
      .from("rooms")
      .insert({
        id:
          newRoomId,

        event_id:
          eventId,

        name:
          `${selectedCountry.flag} ${selectedCountry.name}`,

        room_type:
          "country",

        country_code:
          selectedCountry.code,

        sort_order:
          nextSortOrder,

        owner_id:
          senderId,

        status:
          "active",
      })
      .select(
        "id,event_id,name,room_type,country_code,sort_order,status"
      )
      .single();


    if (
      error ||
      !data
    ) {
      console.error(
        "Create country room error:",
        error
      );


      setCountryError(
        error?.code ===
          "23505"
          ? t.alreadyCreated
          : t.roomError
      );


      setCreatingCountry(
        false
      );


      return;
    }


    setRooms(
      (current) => [
        ...current,
        data as Room,
      ]
    );


    setSelectedCountry(
      null
    );


    setCountrySearch(
      ""
    );


    setCreatingCountry(
      false
    );


    setShowCountryRoom(
      false
    );
  }


  // ===================================
  // OTHER ROOM
  // ===================================

  async function createRoom() {
    if (
      !supabase ||
      !isOrganizer ||
      !roomName.trim() ||
      creatingRoom
    ) {
      return;
    }


    setCreatingRoom(
      true
    );


    setRoomError(
      ""
    );


    const newRoomId =
      crypto
        .randomUUID()
        .replaceAll(
          "-",
          ""
        )
        ;


    const nextSortOrder =
      rooms.length ===
      0
        ? 0
        : Math.max(
            ...rooms.map(
              (room) =>
                room.sort_order
            )
          ) + 1;


    const {
      data,
      error,
    } = await supabase
      .from("rooms")
      .insert({
        id:
          newRoomId,

        event_id:
          eventId,

        name:
          roomName.trim(),

        room_type:
          roomType,

        country_code:
          null,

        sort_order:
          nextSortOrder,

        owner_id:
          senderId,

        status:
          "active",
      })
      .select(
        "id,event_id,name,room_type,country_code,sort_order,status"
      )
      .single();


    if (
      error ||
      !data
    ) {
      console.error(
        "Create room error:",
        error
      );


      setRoomError(
        t.roomError
      );


      setCreatingRoom(
        false
      );


      return;
    }


    setRooms(
      (current) => [
        ...current,
        data as Room,
      ]
    );


    setRoomName(
      ""
    );


    setRoomType(
      "group"
    );


    setCreatingRoom(
      false
    );


    setShowCreateRoom(
      false
    );
  }


  // ===================================
  // PROFILE
  // ===================================

  function chooseLanguage(
    code: string
  ) {
    localStorage.setItem(
      "wyd_language",
      code
    );


    document.documentElement.lang =
      code;


    setLanguage(
      code
    );


    setNeedsLanguage(
      false
    );


    setShowLanguage(
      false
    );
  }


  function saveFirstName(
    name: string
  ) {
    const clean =
      name.trim();


    if (!clean) {
      return;
    }


    localStorage.setItem(
      "wyd_display_name",
      clean
    );


    setDisplayName(
      clean
    );


    setNameDraft(
      clean
    );


    setNeedsName(
      false
    );
  }


  function saveEditedName() {
    const clean =
      nameDraft.trim();


    if (!clean) {
      return;
    }


    localStorage.setItem(
      "wyd_display_name",
      clean
    );


    setDisplayName(
      clean
    );


    setShowName(
      false
    );
  }


  // ===================================
  // SHARE
  // ===================================

  async function shareEvent() {
    if (!eventUrl) {
      return;
    }


    try {
      if (
        navigator.share
      ) {
        await navigator.share({
          title:
            eventData?.name ||
            "WYD Event",

          url:
            eventUrl,
        });


        return;
      }
    } catch {}


    try {
      await navigator.clipboard.writeText(
        eventUrl
      );


      setCopied(
        true
      );


      setTimeout(() => {
        setCopied(
          false
        );
      }, 1500);
    } catch {
      setShowQR(
        true
      );
    }
  }


  // ===================================
  // FORMAT
  // ===================================

  function locale() {
    if (
      language === "ko"
    ) {
      return "ko-KR";
    }


    if (
      language === "es"
    ) {
      return "es-ES";
    }


    return "en-US";
  }


  function formatDate(
    value: string | null
  ) {
    if (!value) {
      return null;
    }


    try {
      return new Intl.DateTimeFormat(
        locale(),
        {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      ).format(
        new Date(value)
      );
    } catch {
      return null;
    }
  }


  function formatAnnouncementTime(
    value: string
  ) {
    return (
      formatDate(
        value
      ) ||
      ""
    );
  }


  function scheduleTime(
    value: string
  ) {
    return new Intl.DateTimeFormat(
      locale(),
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(
      new Date(value)
    );
  }


  function scheduleDay(
    value: string
  ) {
    return new Intl.DateTimeFormat(
      locale(),
      {
        month: "short",
        day: "numeric",
      }
    ).format(
      new Date(value)
    );
  }


  // ===================================
  // DISPLAY TEXT
  // ===================================

  const scheduleTitle =
    nextSchedule
      ? scheduleOriginal ||
        nextSchedule.source_language ===
          language
        ? nextSchedule.title
        : translatedScheduleTitle ||
          nextSchedule.title
      : "";


  const scheduleDescription =
    nextSchedule?.description
      ? scheduleOriginal ||
        nextSchedule.source_language ===
          language
        ? nextSchedule.description
        : translatedScheduleDescription ||
          nextSchedule.description
      : "";


  const meetingDetails =
    meetingPoint?.details
      ? meetingOriginal ||
        meetingPoint.source_language ===
          language
        ? meetingPoint.details
        : translatedMeetingDetails ||
          meetingPoint.details
      : "";


  // ===================================
  // FIRST SCREENS
  // ===================================

  if (needsLanguage) {
    return (
      <LanguageScreen
        language={
          language
        }
        onSelect={
          chooseLanguage
        }
      />
    );
  }


  if (needsName) {
    return (
      <NameScreen
        title={
          t.yourName
        }
        description={
          t.nameDescription
        }
        placeholder={
          t.enterName
        }
        buttonText={
          t.continue
        }
        onSave={
          saveFirstName
        }
      />
    );
  }


  if (!supabase) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#fffefb] p-6">
        <p className="text-sm text-red-500">
          Supabase settings are missing.
        </p>
      </main>
    );
  }


  if (loading) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#fffefb]">
        <Brand />
      </main>
    );
  }


  if (
    notFound ||
    !eventData
  ) {
    return (
      <SimpleState
        title={
          t.notFound
        }
        buttonText={
          t.backHome
        }
        onClick={() =>
          router.push("/")
        }
      />
    );
  }


  if (
    eventData.status ===
    "ended"
  ) {
    return (
      <SimpleState
        title={
          t.eventEnded
        }
        description={
          t.eventEndedDescription
        }
        buttonText={
          t.backHome
        }
        onClick={() =>
          router.push("/")
        }
        danger
      />
    );
  }


  return (
    <main className="min-h-[100dvh] bg-[#f4f4f2] text-[#101820]">

      <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-[#fffefb]">


        {/* HEADER */}

        <header className="flex items-center justify-between px-5 pb-4 pt-6">

          <button
            onClick={() =>
              router.push("/")
            }
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f4f4f2] text-[22px]"
          >
            ‹
          </button>


          <Brand small />


          <button
            onClick={() =>
              setShowQR(
                true
              )
            }
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eef5ff] text-[#2868d8]"
          >
            <SmallQrIcon />
          </button>

        </header>


        {/* EVENT HERO */}

        <section className="px-5 pt-7">

          <div className="flex items-center gap-2">

            <span className="rounded-full bg-[#eaf2ff] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-[#2868d8]">
              {t.event}
            </span>


            {isOrganizer && (
              <span className="rounded-full bg-[#fff1bd] px-3 py-1.5 text-[9px] font-bold text-[#a97500]">
                {t.organizer}
              </span>
            )}

          </div>


          <h1 className="mt-5 max-w-[360px] text-[38px] font-bold leading-[1.05] tracking-[-0.055em]">
            {eventData.name}
          </h1>


          {eventData.description && (
            <p className="mt-4 max-w-[340px] text-sm leading-6 text-neutral-500">
              {eventData.description}
            </p>
          )}


          {(eventData.start_at ||
            eventData.end_at) && (

            <div className="mt-5 flex flex-wrap gap-2">

              {formatDate(
                eventData.start_at
              ) && (
                <DatePill>
                  {formatDate(
                    eventData.start_at
                  )}
                </DatePill>
              )}


              {formatDate(
                eventData.end_at
              ) && (
                <DatePill>
                  →
                  {" "}
                  {formatDate(
                    eventData.end_at
                  )}
                </DatePill>
              )}

            </div>

          )}


          <div className="mt-7 grid grid-cols-2 gap-3">

            <StatCard
              value={
                participants.length
              }
              label={
                t.participants
              }
              blue
            />


            <StatCard
              value={
                rooms.length
              }
              label={
                t.rooms
              }
            />

          </div>

        </section>


        {/* SHARE */}

        <section className="px-5 pt-5">

          <button
            onClick={
              shareEvent
            }
            className="flex w-full items-center justify-between rounded-[22px] border border-[#dce9ff] bg-[#f8fbff] px-5 py-4 text-left"
          >

            <div>

              <p className="text-[13px] font-bold">
                {copied
                  ? t.copied
                  : t.share}
              </p>

              <p className="mt-1 text-[10px] text-neutral-400">
                WYD · {eventId}
              </p>

            </div>


            <span className="text-[20px] text-[#2868d8]">
              ↗
            </span>

          </button>

        </section>


        {/* ===================================
            IMPORTANT EVENT INFORMATION
        =================================== */}

        <section className="px-5 pt-8">

          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">
            EVENT NOW
          </p>


          <div className="mt-4 space-y-3">


            {/* NEXT SCHEDULE */}

            <div className="overflow-hidden rounded-[26px] border border-[#dce9ff] bg-white shadow-[0_8px_25px_rgba(0,0,0,0.035)]">

              <button
                onClick={() =>
                  router.push(
                    `/event/${eventId}/schedule`
                  )
                }
                className="w-full p-5 text-left"
              >

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-2">

                    <span className="flex h-9 w-9 items-center justify-center rounded-[13px] bg-[#eef5ff] text-[#2868d8]">
                      □
                    </span>

                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#2868d8]">
                      {t.nextSchedule}
                    </p>

                  </div>


                  <span className="text-neutral-300">
                    ›
                  </span>

                </div>


                {nextSchedule ? (

                  <div className="mt-5">

                    <div className="flex items-start gap-4">

                      <div className="shrink-0">

                        <p className="text-[25px] font-black tracking-[-0.05em] text-[#2868d8]">
                          {scheduleTime(
                            nextSchedule.starts_at
                          )}
                        </p>

                        <p className="mt-1 text-[9px] font-bold text-neutral-400">
                          {scheduleDay(
                            nextSchedule.starts_at
                          )}
                        </p>

                      </div>


                      <div className="min-w-0 flex-1 border-l border-neutral-100 pl-4">

                        <p className="text-[15px] font-black leading-6">
                          {scheduleTitle}
                        </p>


                        {nextSchedule.location_name && (
                          <p className="mt-2 text-[10px] font-bold text-[#46a968]">
                            ⌖ {nextSchedule.location_name}
                          </p>
                        )}


                        {scheduleDescription && (
                          <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-neutral-500">
                            {scheduleDescription}
                          </p>
                        )}

                      </div>

                    </div>

                  </div>

                ) : (

                  <p className="mt-5 text-[12px] text-neutral-400">
                    {t.scheduleEmpty}
                  </p>

                )}

              </button>


              {nextSchedule &&
                nextSchedule.source_language !==
                  language && (

                <div className="border-t border-neutral-100 px-5 py-3">

                  <button
                    onClick={() =>
                      setScheduleOriginal(
                        (current) =>
                          !current
                      )
                    }
                    className="text-[9px] font-bold text-[#2868d8]"
                  >
                    {scheduleOriginal
                      ? t.translated
                      : t.original}
                  </button>

                </div>

              )}

            </div>


            {/* MEETING POINT */}

            <div className="overflow-hidden rounded-[26px] border border-[#dfeee4] bg-white shadow-[0_8px_25px_rgba(0,0,0,0.035)]">

              <button
                onClick={() =>
                  router.push(
                    `/event/${eventId}/meeting`
                  )
                }
                className="w-full p-5 text-left"
              >

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-2">

                    <span className="flex h-9 w-9 items-center justify-center rounded-[13px] bg-[#eef8f1] text-[#46a968]">
                      ⌖
                    </span>

                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#46a968]">
                      {t.meetingPoint}
                    </p>

                  </div>


                  <span className="text-neutral-300">
                    ›
                  </span>

                </div>


                {meetingPoint ? (

                  <div className="mt-5">

                    <h3 className="text-[22px] font-black leading-tight tracking-[-0.045em]">
                      {meetingPoint.name}
                    </h3>


                    {meetingDetails && (
                      <p className="mt-3 line-clamp-3 text-[12px] leading-6 text-neutral-500">
                        {meetingDetails}
                      </p>
                    )}

                  </div>

                ) : (

                  <p className="mt-5 text-[12px] text-neutral-400">
                    {t.meetingEmpty}
                  </p>

                )}

              </button>


              {meetingPoint && (
                <div className="flex items-center gap-2 border-t border-neutral-100 px-5 py-3">

                  {meetingPoint.source_language !==
                    language && (

                    <button
                      onClick={() =>
                        setMeetingOriginal(
                          (current) =>
                            !current
                        )
                      }
                      className="mr-auto text-[9px] font-bold text-[#2868d8]"
                    >
                      {meetingOriginal
                        ? t.translated
                        : t.original}
                    </button>

                  )}


                  {!(
                    meetingPoint.source_language !==
                    language
                  ) && (
                    <div className="mr-auto" />
                  )}


                  {meetingPoint.map_url && (

                    <a
                      href={
                        meetingPoint.map_url
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-[#eef8f1] px-4 py-2 text-[9px] font-black text-[#3d965c]"
                    >
                      📍 {t.openMap}
                    </a>

                  )}

                </div>
              )}

            </div>

          </div>

        </section>


        {/* SENT */}

        {announcementSent && (

          <section className="px-5 pt-4">

            <div className="flex items-center gap-3 rounded-[20px] bg-[#eef8f1] px-4 py-3">

              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#46a968]">
                ✓
              </span>

              <p className="text-[12px] font-bold text-[#34844f]">
                {t.sent}
              </p>

            </div>

          </section>

        )}


        {/* ORGANIZER TOOLS */}

        {isOrganizer && (

          <section className="px-5 pt-5">

            <div className="rounded-[25px] border border-[#ffe9a8] bg-[#fffaf0] p-4">

              <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-[#b47b00]">
                {t.organizerTools}
              </p>


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
                className="mt-3 flex w-full items-center rounded-[20px] bg-[#101820] p-4 text-left text-white shadow-[0_8px_25px_rgba(0,0,0,0.10)]"
              >

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-white/10 text-xl">
                  📢
                </div>


                <div className="ml-4 min-w-0 flex-1">

                  <p className="text-[14px] font-bold">
                    {t.broadcast}
                  </p>

                  <p className="mt-1 text-[9px] leading-4 text-white/55">
                    {t.broadcastDescription}
                  </p>

                </div>


                <span className="text-white/40">
                  ›
                </span>

              </button>


              <div className="mt-2 grid grid-cols-2 gap-2">

                <button
                  onClick={() => {
                    setSelectedCountry(
                      null
                    );

                    setCountrySearch(
                      ""
                    );

                    setCountryError(
                      ""
                    );

                    setShowCountryRoom(
                      true
                    );
                  }}
                  className="rounded-[20px] bg-white p-4 text-left"
                >

                  <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#eaf2ff] text-xl">
                    🌍
                  </div>

                  <p className="mt-3 text-[12px] font-bold">
                    {t.createCountryRoom}
                  </p>

                  <p className="mt-1 text-[9px] text-neutral-400">
                    🇰🇷 🇪🇸 🇫🇷 🇯🇵
                  </p>

                </button>


                <button
                  onClick={() => {
                    setRoomName(
                      ""
                    );

                    setRoomType(
                      "group"
                    );

                    setRoomError(
                      ""
                    );

                    setShowCreateRoom(
                      true
                    );
                  }}
                  className="rounded-[20px] bg-white p-4 text-left"
                >

                  <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#fff1bd] text-[24px] text-[#d69400]">
                    +
                  </div>

                  <p className="mt-3 text-[12px] font-bold">
                    {t.createOtherRoom}
                  </p>

                  <p className="mt-1 text-[9px] text-neutral-400">
                    Bus · Group · Help
                  </p>

                </button>

              </div>

            </div>

          </section>

        )}


        {/* ANNOUNCEMENT STATS */}

        {isOrganizer && (

          <section className="px-5 pt-8">

            <div>

              <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#2868d8]">
                BROADCAST
              </p>

              <h2 className="mt-2 text-[25px] font-bold tracking-[-0.04em]">
                {t.announcementStatus}
              </h2>

            </div>


            {latestEventAnnouncement ? (

              <button
                onClick={() =>
                  setSelectedAnnouncement(
                    latestEventAnnouncement
                  )
                }
                className="mt-5 w-full rounded-[25px] border border-neutral-100 bg-white p-5 text-left shadow-[0_8px_25px_rgba(0,0,0,0.04)]"
              >

                <div className="flex items-center justify-between gap-3">

                  <PriorityBadge
                    priority={
                      latestEventAnnouncement.priority
                    }
                    t={
                      t
                    }
                  />

                  <span className="text-[9px] text-neutral-400">
                    {formatAnnouncementTime(
                      latestEventAnnouncement.created_at
                    )}
                  </span>

                </div>


                <p className="mt-4 line-clamp-3 text-[14px] font-semibold leading-6">
                  {latestEventAnnouncement.content}
                </p>


                <div className="mt-5 flex items-end justify-between">

                  <div>

                    <p className="text-[23px] font-black tracking-[-0.04em] text-[#2868d8]">
                      {readCount(
                        latestEventAnnouncement.id
                      )}
                      {" / "}
                      {participants.length}
                    </p>

                    <p className="mt-1 text-[9px] font-bold text-neutral-400">
                      {t.confirmed}
                    </p>

                  </div>


                  <p className="text-[20px] font-black">
                    {readPercentage(
                      latestEventAnnouncement.id
                    )}
                    %
                  </p>

                </div>


                <ProgressBar
                  percentage={
                    readPercentage(
                      latestEventAnnouncement.id
                    )
                  }
                />


                <p className="mt-4 text-[10px] font-bold text-[#2868d8]">
                  {t.viewDetails} →
                </p>

              </button>

            ) : (

              <EmptyCard>
                {t.noAnnouncements}
              </EmptyCard>

            )}


            {eventAnnouncements.length >
              1 && (

              <div className="mt-5">

                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400">
                  {t.recentAnnouncements}
                </p>


                <div className="mt-3 space-y-2">

                  {eventAnnouncements
                    .slice(
                      1,
                      5
                    )
                    .map(
                      (
                        announcement
                      ) => (

                        <button
                          key={
                            announcement.id
                          }
                          onClick={() =>
                            setSelectedAnnouncement(
                              announcement
                            )
                          }
                          className="flex w-full items-center rounded-[20px] bg-[#f6f6f3] p-4 text-left"
                        >

                          <PriorityDot
                            priority={
                              announcement.priority
                            }
                          />


                          <div className="ml-3 min-w-0 flex-1">

                            <p className="truncate text-[12px] font-bold">
                              {announcement.content}
                            </p>

                            <p className="mt-1 text-[9px] text-neutral-400">
                              {readCount(
                                announcement.id
                              )}
                              /
                              {participants.length}
                              {" "}
                              {t.confirmed}
                            </p>

                          </div>


                          <span className="text-neutral-300">
                            ›
                          </span>

                        </button>

                      )
                    )}

                </div>

              </div>

            )}

          </section>

        )}


        {/* GENERAL */}

        {generalRooms.length >
          0 && (

          <section className="px-5 pt-8">

            <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-neutral-400">
              {t.network}
            </p>


            <div className="mt-4 space-y-3">

              {generalRooms.map(
                (room) => (

                  <RoomCard
                    key={
                      room.id
                    }
                    room={
                      room
                    }
                    onClick={() =>
                      router.push(
                        `/room/${room.id}`
                      )
                    }
                  />

                )
              )}

            </div>

          </section>

        )}


        {/* COUNTRY */}

        <section className="px-5 pt-8">

          <div className="flex items-end justify-between">

            <div>

              <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#2868d8]">
                WORLD
              </p>

              <h2 className="mt-2 text-[25px] font-bold tracking-[-0.04em]">
                {t.countryRooms}
              </h2>

            </div>


            <span className="text-[11px] text-neutral-400">
              {countryRooms.length}
            </span>

          </div>


          <div className="mt-5 space-y-3">

            {countryRooms.length ===
            0 ? (

              <EmptyCard>
                {t.noCountryRooms}
              </EmptyCard>

            ) : (

              countryRooms.map(
                (room) => (

                  <RoomCard
                    key={
                      room.id
                    }
                    room={
                      room
                    }
                    onClick={() =>
                      router.push(
                        `/room/${room.id}`
                      )
                    }
                  />

                )
              )

            )}

          </div>

        </section>


        {/* OTHER */}

        <section className="px-5 pb-10 pt-9">

          <div className="flex items-end justify-between">

            <div>

              <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-neutral-400">
                WYD
              </p>

              <h2 className="mt-2 text-[25px] font-bold tracking-[-0.04em]">
                {t.otherRooms}
              </h2>

            </div>


            <span className="text-[11px] text-neutral-400">
              {otherRooms.length}
            </span>

          </div>


          <div className="mt-5 space-y-3">

            {otherRooms.length ===
            0 ? (

              <EmptyCard>
                {t.noOtherRooms}
              </EmptyCard>

            ) : (

              otherRooms.map(
                (room) => (

                  <RoomCard
                    key={
                      room.id
                    }
                    room={
                      room
                    }
                    onClick={() =>
                      router.push(
                        `/room/${room.id}`
                      )
                    }
                  />

                )
              )

            )}

          </div>

        </section>


        {/* SETTINGS */}

        <section className="border-t border-neutral-100 px-5 pb-10 pt-5">

          <button
            onClick={() =>
              setShowLanguage(
                true
              )
            }
            className="flex w-full items-center justify-between py-3 text-left"
          >

            <span className="text-sm font-semibold">
              {t.language}
            </span>

            <span className="text-xs text-neutral-400">
              {
                languages.find(
                  (item) =>
                    item.code ===
                    language
                )?.name
              }
              {" "}
              ›
            </span>

          </button>


          <button
            onClick={() => {
              setNameDraft(
                displayName
              );

              setShowName(
                true
              );
            }}
            className="flex w-full items-center justify-between py-3 text-left"
          >

            <span className="text-sm font-semibold">
              {t.changeName}
            </span>

            <span className="max-w-[170px] truncate text-xs text-neutral-400">
              {displayName}
              {" "}
              ›
            </span>

          </button>

        </section>

      </div>


      {/* ANNOUNCEMENT DETAILS */}

      {selectedAnnouncement && (

        <AnnouncementStatusSheet
          announcement={
            selectedAnnouncement
          }
          participants={
            participants
          }
          readIds={
            readUserIds(
              selectedAnnouncement.id
            )
          }
          t={
            t
          }
          time={
            formatAnnouncementTime(
              selectedAnnouncement.created_at
            )
          }
          onClose={() =>
            setSelectedAnnouncement(
              null
            )
          }
        />

      )}


      {/* ANNOUNCEMENT WRITER */}

      {showAnnouncementWriter && (

        <Sheet
          onClose={() => {
            if (
              !creatingAnnouncement
            ) {
              setShowAnnouncementWriter(
                false
              );
            }
          }}
        >

          <SheetHeader
            eyebrow="WYD EVENT"
            title={
              t.announcementTitle
            }
            onClose={() => {
              if (
                !creatingAnnouncement
              ) {
                setShowAnnouncementWriter(
                  false
                );
              }
            }}
          />


          <p className="mt-3 text-sm leading-6 text-neutral-500">
            {t.announcementDescription}
          </p>


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
            placeholder={
              t.announcementPlaceholder
            }
            className="mt-6 w-full resize-none rounded-[22px] bg-[#f4f4f2] px-4 py-4 text-sm leading-6 outline-none"
          />


          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">
            {t.priority}
          </p>


          <div className="mt-3 grid grid-cols-3 gap-2">

            <PriorityButton
              active={
                announcementPriority ===
                "normal"
              }
              label={
                t.normal
              }
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
              label={
                t.important
              }
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
              label={
                t.urgent
              }
              type="urgent"
              onClick={() =>
                setAnnouncementPriority(
                  "urgent"
                )
              }
            />

          </div>


          {announcementPriority ===
            "urgent" && (

            <div className="mt-4 rounded-[18px] bg-[#fff1f2] px-4 py-3">

              <p className="text-[10px] font-bold leading-5 text-[#ff4458]">
                🚨 긴급 공지는 참가자의 화면을 크게 덮어 표시됩니다.
              </p>

            </div>

          )}


          {announcementError && (

            <div className="mt-4 rounded-[18px] bg-red-50 px-4 py-3 text-xs text-red-500">
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
              ? t.sending
              : announcementPriority ===
                "urgent"
              ? t.sendUrgent
              : t.sendAnnouncement}
          </button>

        </Sheet>

      )}


      {/* COUNTRY ROOM */}

      {showCountryRoom && (

        <Sheet
          onClose={() => {
            if (
              !creatingCountry
            ) {
              setShowCountryRoom(
                false
              );
            }
          }}
        >

          <SheetHeader
            eyebrow="WYD WORLD"
            title={
              t.createCountryRoom
            }
            onClose={() =>
              setShowCountryRoom(
                false
              )
            }
          />


          <p className="mt-3 text-sm leading-6 text-neutral-500">
            {t.countryDescription}
          </p>


          <input
            value={
              countrySearch
            }
            onChange={(event) =>
              setCountrySearch(
                event.target.value
              )
            }
            placeholder={
              t.searchCountry
            }
            className="mt-5 w-full rounded-[19px] bg-[#f4f4f2] px-4 py-4 text-sm outline-none"
          />


          <div className="mt-3 max-h-[44vh] space-y-2 overflow-y-auto">

            {filteredCountries.map(
              (country) => {

                const alreadyExists =
                  rooms.some(
                    (room) =>
                      room.country_code ===
                      country.code
                  );


                const selected =
                  selectedCountry?.code ===
                  country.code;


                return (
                  <button
                    key={
                      country.code
                    }
                    disabled={
                      alreadyExists
                    }
                    onClick={() => {
                      setSelectedCountry(
                        country
                      );

                      setCountryError(
                        ""
                      );
                    }}
                    className={`flex w-full items-center rounded-[18px] border px-4 py-3 text-left ${
                      alreadyExists
                        ? "border-transparent bg-[#f5f5f2] opacity-40"
                        : selected
                        ? "border-[#2868d8] bg-[#f7fbff]"
                        : "border-transparent bg-[#f5f5f2]"
                    }`}
                  >

                    <span className="text-[26px]">
                      {country.flag}
                    </span>


                    <div className="ml-3 flex-1">

                      <p className="text-sm font-bold">
                        {country.name}
                      </p>

                      <p className="mt-0.5 text-[9px] text-neutral-400">
                        {country.code}
                      </p>

                    </div>


                    {alreadyExists ? (

                      <span className="text-[10px] text-neutral-400">
                        ✓
                      </span>

                    ) : selected ? (

                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2868d8] text-[10px] text-white">
                        ✓
                      </span>

                    ) : null}

                  </button>
                );
              }
            )}

          </div>


          {countryError && (

            <div className="mt-4 rounded-[17px] bg-red-50 px-4 py-3 text-xs text-red-500">
              {countryError}
            </div>

          )}


          <button
            onClick={
              createCountryRoom
            }
            disabled={
              !selectedCountry ||
              creatingCountry
            }
            className="mt-5 w-full rounded-[20px] bg-[#2868d8] py-4 text-sm font-bold text-white disabled:bg-neutral-200"
          >
            {creatingCountry
              ? t.creating
              : selectedCountry
              ? `${selectedCountry.flag} ${selectedCountry.name}`
              : t.chooseCountry}
          </button>

        </Sheet>

      )}


      {/* OTHER ROOM */}

      {showCreateRoom && (

        <Sheet
          onClose={() => {
            if (
              !creatingRoom
            ) {
              setShowCreateRoom(
                false
              );
            }
          }}
        >

          <SheetHeader
            eyebrow="WYD NETWORK"
            title={
              t.createOtherRoom
            }
            onClose={() =>
              setShowCreateRoom(
                false
              )
            }
          />


          <p className="mt-3 text-sm leading-6 text-neutral-500">
            {t.createRoomDescription}
          </p>


          <FieldLabel>
            {t.roomName}
          </FieldLabel>


          <input
            autoFocus
            value={
              roomName
            }
            onChange={(event) =>
              setRoomName(
                event.target.value
              )
            }
            placeholder={
              t.roomNamePlaceholder
            }
            className="mt-2 w-full rounded-[20px] bg-[#f5f5f2] px-4 py-4 text-sm outline-none"
          />


          <div className="mt-6">

            <FieldLabel noMargin>
              {t.roomType}
            </FieldLabel>


            <div className="mt-3 space-y-2">

              <RoomTypeButton
                active={
                  roomType ===
                  "group"
                }
                icon="◉"
                title={
                  t.group
                }
                description={
                  t.groupDescription
                }
                onClick={() =>
                  setRoomType(
                    "group"
                  )
                }
              />


              <RoomTypeButton
                active={
                  roomType ===
                  "location"
                }
                icon="⌖"
                title={
                  t.location
                }
                description={
                  t.locationDescription
                }
                onClick={() =>
                  setRoomType(
                    "location"
                  )
                }
              />


              <RoomTypeButton
                active={
                  roomType ===
                  "help"
                }
                icon="?"
                title={
                  t.help
                }
                description={
                  t.helpDescription
                }
                onClick={() =>
                  setRoomType(
                    "help"
                  )
                }
              />


              <RoomTypeButton
                active={
                  roomType ===
                  "custom"
                }
                icon="◇"
                title={
                  t.custom
                }
                description={
                  t.customDescription
                }
                onClick={() =>
                  setRoomType(
                    "custom"
                  )
                }
              />

            </div>

          </div>


          {roomError && (

            <div className="mt-4 rounded-[17px] bg-red-50 px-4 py-3 text-xs text-red-500">
              {roomError}
            </div>

          )}


          <button
            onClick={
              createRoom
            }
            disabled={
              !roomName.trim() ||
              creatingRoom
            }
            className="mt-6 w-full rounded-[20px] bg-[#2868d8] py-4 text-sm font-bold text-white disabled:bg-neutral-200"
          >
            {creatingRoom
              ? t.creating
              : t.create}
          </button>

        </Sheet>

      )}


      {/* QR */}

      {showQR && (

        <Sheet
          onClose={() =>
            setShowQR(
              false
            )
          }
        >

          <SheetHeader
            eyebrow={
              eventData.name
            }
            title={
              t.eventQR
            }
            onClose={() =>
              setShowQR(
                false
              )
            }
          />


          <p className="mt-3 text-sm leading-6 text-neutral-500">
            {t.qrDescription}
          </p>


          <div className="mt-7 flex justify-center">

            <div className="rounded-[30px] border border-[#dce9ff] bg-white p-6">

              {eventUrl && (

                <QRCodeSVG
                  value={
                    eventUrl
                  }
                  size={220}
                  level="M"
                  includeMargin={
                    false
                  }
                  fgColor="#101820"
                  bgColor="#ffffff"
                />

              )}

            </div>

          </div>

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
          onSelect={
            chooseLanguage
          }
          onClose={() =>
            setShowLanguage(
              false
            )
          }
        />

      )}


      {/* NAME */}

      {showName && (

        <Sheet
          onClose={() =>
            setShowName(
              false
            )
          }
        >

          <SheetHeader
            eyebrow="PROFILE"
            title={
              t.changeName
            }
            onClose={() =>
              setShowName(
                false
              )
            }
          />


          <input
            value={
              nameDraft
            }
            onChange={(event) =>
              setNameDraft(
                event.target.value
              )
            }
            className="mt-6 w-full rounded-[20px] bg-[#f5f5f2] px-4 py-4 text-sm outline-none"
          />


          <button
            onClick={
              saveEditedName
            }
            disabled={
              !nameDraft.trim()
            }
            className="mt-4 w-full rounded-[20px] bg-[#101820] py-4 text-sm font-bold text-white disabled:bg-neutral-200"
          >
            {t.save}
          </button>

        </Sheet>

      )}

    </main>
  );
}


// =======================================
// ANNOUNCEMENT STATUS
// =======================================

function AnnouncementStatusSheet({
  announcement,
  participants,
  readIds,
  t,
  time,
  onClose,
}: {
  announcement: EventAnnouncement;
  participants: Participant[];
  readIds: Set<string>;
  t: Record<string, string>;
  time: string;
  onClose: () => void;
}) {
  const confirmed =
    participants.filter(
      (participant) =>
        readIds.has(
          participant.user_id
        )
    );


  const unconfirmed =
    participants.filter(
      (participant) =>
        !readIds.has(
          participant.user_id
        )
    );


  const percentage =
    participants.length ===
    0
      ? 0
      : Math.round(
          (
            confirmed.length /
            participants.length
          ) *
            100
        );


  return (
    <Sheet
      onClose={
        onClose
      }
    >

      <SheetHeader
        eyebrow="WYD BROADCAST"
        title={
          t.announcementStatus
        }
        onClose={
          onClose
        }
      />


      <div className="mt-5 rounded-[22px] bg-[#f5f5f2] p-4">

        <div className="flex items-center justify-between">

          <PriorityBadge
            priority={
              announcement.priority
            }
            t={
              t
            }
          />

          <span className="text-[9px] text-neutral-400">
            {time}
          </span>

        </div>


        <p className="mt-4 whitespace-pre-wrap text-[14px] font-semibold leading-6">
          {announcement.content}
        </p>

      </div>


      <div className="mt-5 rounded-[22px] bg-[#eef5ff] p-5">

        <div className="flex items-end justify-between">

          <div>

            <p className="text-[29px] font-black tracking-[-0.05em] text-[#2868d8]">
              {confirmed.length}
              {" / "}
              {participants.length}
            </p>

            <p className="mt-1 text-[10px] font-bold text-[#2868d8]/60">
              {t.confirmed}
            </p>

          </div>


          <p className="text-[25px] font-black text-[#2868d8]">
            {percentage}%
          </p>

        </div>


        <ProgressBar
          percentage={
            percentage
          }
        />

      </div>


      <div className="mt-6 grid grid-cols-2 gap-2">

        <div className="rounded-[18px] bg-[#eef8f1] p-4">

          <p className="text-[21px] font-black text-[#3a9a5c]">
            {confirmed.length}
          </p>

          <p className="mt-1 text-[9px] font-bold text-[#3a9a5c]">
            ✓ {t.confirmed}
          </p>

        </div>


        <div className="rounded-[18px] bg-[#f4f4f2] p-4">

          <p className="text-[21px] font-black text-neutral-500">
            {unconfirmed.length}
          </p>

          <p className="mt-1 text-[9px] font-bold text-neutral-400">
            ○ {t.unconfirmed}
          </p>

        </div>

      </div>


      <div className="mt-7">

        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#3a9a5c]">
          ✓ {t.confirmed}
        </p>


        <div className="mt-3 space-y-2">

          {confirmed.map(
            (participant) => (

              <ParticipantStatus
                key={
                  participant.user_id
                }
                participant={
                  participant
                }
                confirmed
              />

            )
          )}

        </div>

      </div>


      <div className="mt-7">

        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-400">
          ○ {t.unconfirmed}
        </p>


        <div className="mt-3 space-y-2">

          {unconfirmed.map(
            (participant) => (

              <ParticipantStatus
                key={
                  participant.user_id
                }
                participant={
                  participant
                }
              />

            )
          )}

        </div>

      </div>

    </Sheet>
  );
}


function ParticipantStatus({
  participant,
  confirmed = false,
}: {
  participant: Participant;
  confirmed?: boolean;
}) {
  return (
    <div className="flex items-center rounded-[18px] bg-[#f6f6f3] px-4 py-3">

      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-black ${
          confirmed
            ? "bg-[#e7f6ec] text-[#3a9a5c]"
            : "bg-white text-neutral-300"
        }`}
      >
        {confirmed
          ? "✓"
          : "○"}
      </span>


      <div className="ml-3 min-w-0 flex-1">

        <p className="truncate text-[12px] font-bold">
          {participant.display_name}
        </p>

        <p className="mt-0.5 text-[9px] text-neutral-400">
          {languages.find(
            (item) =>
              item.code ===
              participant.language
          )?.name ||
            participant.language}
        </p>

      </div>

    </div>
  );
}


// =======================================
// COMPONENTS
// =======================================

function ProgressBar({
  percentage,
}: {
  percentage: number;
}) {
  return (
    <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-100">

      <div
        className="h-full rounded-full bg-[#2868d8] transition-all duration-500"
        style={{
          width:
            `${percentage}%`,
        }}
      />

    </div>
  );
}


function PriorityBadge({
  priority,
  t,
}: {
  priority: AnnouncementPriority;
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
      ? "bg-[#fff1f2] text-[#ff4458]"
      : priority === "important"
      ? "bg-[#fff3c9] text-[#b47b00]"
      : "bg-[#eef5ff] text-[#2868d8]";


  return (
    <span
      className={`rounded-full px-3 py-1.5 text-[9px] font-black ${className}`}
    >
      {label}
    </span>
  );
}


function PriorityDot({
  priority,
}: {
  priority: AnnouncementPriority;
}) {
  return (
    <span
      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
        priority === "urgent"
          ? "bg-[#ff4458]"
          : priority === "important"
          ? "bg-[#f5b51b]"
          : "bg-[#2868d8]"
      }`}
    />
  );
}


function RoomCard({
  room,
  onClick,
}: {
  room: Room;
  onClick: () => void;
}) {
  const country =
    countries.find(
      (item) =>
        item.code ===
        room.country_code
    );


  return (
    <button
      onClick={
        onClick
      }
      className="flex w-full items-center rounded-[24px] border border-neutral-100 bg-white p-4 text-left shadow-[0_8px_25px_rgba(0,0,0,0.035)]"
    >

      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[19px] ${
          room.room_type ===
          "country"
            ? "bg-[#eef5ff]"
            : room.room_type ===
              "help"
            ? "bg-[#fff1f2] text-[#ff4458]"
            : room.room_type ===
              "location"
            ? "bg-[#eef8f1] text-[#46a968]"
            : room.room_type ===
              "group"
            ? "bg-[#fff7dc] text-[#c78b00]"
            : "bg-[#eef5ff] text-[#2868d8]"
        }`}
      >

        {room.room_type ===
        "country" ? (

          <span className="text-[27px]">
            {country?.flag ||
              "🌍"}
          </span>

        ) : (

          <RoomIcon
            type={
              room.room_type
            }
          />

        )}

      </div>


      <div className="ml-4 min-w-0 flex-1">

        <p className="truncate text-[15px] font-bold">
          {room.name ||
            "Room"}
        </p>

        <p className="mt-1 text-[9px] uppercase tracking-[0.13em] text-neutral-400">
          {room.room_type}
        </p>

      </div>


      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f5f2]">
        ›
      </div>

    </button>
  );
}


function EmptyCard({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="mt-5 rounded-[24px] bg-[#f5f5f2] p-6 text-center text-sm text-neutral-400">
      {children}
    </div>
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
  type: AnnouncementPriority;
  onClick: () => void;
}) {
  let style =
    "border-neutral-100 bg-[#f5f5f2] text-neutral-500";


  if (active) {
    if (
      type === "urgent"
    ) {
      style =
        "border-[#ff4458] bg-[#fff1f2] text-[#ff4458]";
    } else if (
      type === "important"
    ) {
      style =
        "border-[#efb632] bg-[#fff7dd] text-[#ad7700]";
    } else {
      style =
        "border-[#2868d8] bg-[#eef5ff] text-[#2868d8]";
    }
  }


  return (
    <button
      onClick={
        onClick
      }
      className={`rounded-[16px] border py-3 text-[11px] font-bold ${style}`}
    >
      {label}
    </button>
  );
}


function RoomTypeButton({
  active,
  icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={
        onClick
      }
      className={`flex w-full items-center rounded-[20px] border p-3 text-left ${
        active
          ? "border-[#2868d8] bg-[#f7fbff]"
          : "border-transparent bg-[#f6f6f3]"
      }`}
    >

      <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[#eef5ff] text-[#2868d8]">
        {icon}
      </div>


      <div className="ml-3 flex-1">

        <p className="text-[12px] font-bold">
          {title}
        </p>

        <p className="mt-1 text-[9px] text-neutral-400">
          {description}
        </p>

      </div>


      {active && (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2868d8] text-[10px] text-white">
          ✓
        </span>
      )}

    </button>
  );
}


function RoomIcon({
  type,
}: {
  type: string;
}) {
  if (
    type === "help"
  ) {
    return (
      <span className="text-xl font-bold">
        ?
      </span>
    );
  }


  if (
    type === "location"
  ) {
    return (
      <span className="text-xl">
        ⌖
      </span>
    );
  }


  if (
    type === "group"
  ) {
    return (
      <span className="text-[16px] font-bold">
        ◉
      </span>
    );
  }


  if (
    type === "custom"
  ) {
    return (
      <span className="text-lg">
        ◇
      </span>
    );
  }


  return (
    <span className="text-[19px] font-bold">
      •••
    </span>
  );
}


function StatCard({
  value,
  label,
  blue = false,
}: {
  value: number;
  label: string;
  blue?: boolean;
}) {
  return (
    <div
      className={`rounded-[22px] p-4 ${
        blue
          ? "bg-[#eef5ff]"
          : "bg-[#fff7dc]"
      }`}
    >

      <p
        className={`text-[27px] font-bold ${
          blue
            ? "text-[#2868d8]"
            : "text-[#b98000]"
        }`}
      >
        {value}
      </p>

      <p className="mt-1 text-[10px] text-neutral-500">
        {label}
      </p>

    </div>
  );
}


function DatePill({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <span className="rounded-full bg-[#f4f4f2] px-3 py-2 text-[10px] text-neutral-500">
      {children}
    </span>
  );
}


function Brand({
  small = false,
}: {
  small?: boolean;
}) {
  return (
    <div>

      <div className="relative inline-block">

        <h1
          className={`font-black tracking-[-0.06em] ${
            small
              ? "text-[21px]"
              : "text-[34px]"
          }`}
        >
          WYD
        </h1>


        <span className="absolute -right-2 top-0 h-2 w-2 rounded-full bg-[#FFD43B]" />

      </div>

    </div>
  );
}


function SmallQrIcon() {
  return (
    <div className="relative h-5 w-5">

      <span className="absolute left-0 top-0 h-2 w-2 border-l-2 border-t-2 border-current" />
      <span className="absolute right-0 top-0 h-2 w-2 border-r-2 border-t-2 border-current" />
      <span className="absolute bottom-0 left-0 h-2 w-2 border-b-2 border-l-2 border-current" />
      <span className="absolute bottom-0 right-0 h-2 w-2 border-b-2 border-r-2 border-current" />

    </div>
  );
}


function FieldLabel({
  children,
  noMargin = false,
}: {
  children: ReactNode;
  noMargin?: boolean;
}) {
  return (
    <p
      className={`text-[11px] font-bold ${
        noMargin
          ? ""
          : "mt-6"
      }`}
    >
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
      onClick={
        onClose
      }
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

        <h2 className="mt-2 text-[27px] font-bold tracking-[-0.045em]">
          {title}
        </h2>

      </div>


      <button
        onClick={
          onClose
        }
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4f4f2] text-xl"
      >
        ×
      </button>

    </div>
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
    <Sheet
      onClose={
        onClose
      }
    >

      <SheetHeader
        eyebrow="Language"
        title={
          title
        }
        onClose={
          onClose
        }
      />

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

        <h2 className="mt-16 text-[42px] font-bold">
          Choose your
          <br />
          language.
        </h2>

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


function LanguageList({
  language,
  onSelect,
}: {
  language: string;
  onSelect: (code: string) => void;
}) {
  return (
    <div className="mt-6 max-h-[55vh] space-y-2 overflow-y-auto">

      {languages.map(
        (item) => {

          const selected =
            item.code ===
            language;


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
              className={`flex w-full items-center justify-between rounded-[18px] px-5 py-4 ${
                selected
                  ? "bg-[#101820] text-white"
                  : "bg-[#f5f5f2]"
              }`}
            >

              <span className="text-sm font-semibold">
                {item.name}
              </span>


              {selected && (
                <span>✓</span>
              )}

            </button>
          );
        }
      )}

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
  const [
    value,
    setValue,
  ] = useState("");


  function submit(
    event: FormEvent
  ) {
    event.preventDefault();

    onSave(
      value
    );
  }


  return (
    <main className="flex min-h-[100dvh] justify-center bg-[#f4f4f2] p-4">

      <div className="w-full max-w-[430px] rounded-[34px] bg-[#fffefb] px-6 py-8">

        <Brand />


        <form
          onSubmit={
            submit
          }
          className="mt-[18vh]"
        >

          <h2 className="text-[42px] font-bold">
            {title}
          </h2>

          <p className="mt-4 text-sm text-neutral-500">
            {description}
          </p>

          <input
            autoFocus
            value={
              value
            }
            onChange={(event) =>
              setValue(
                event.target.value
              )
            }
            placeholder={
              placeholder
            }
            className="mt-8 w-full rounded-[22px] bg-[#f4f4f2] px-5 py-5"
          />

          <button
            disabled={
              !value.trim()
            }
            className="mt-3 w-full rounded-[22px] bg-[#2868d8] py-5 text-sm font-bold text-white disabled:bg-neutral-200"
          >
            {buttonText}
          </button>

        </form>

      </div>

    </main>
  );
}


function SimpleState({
  title,
  description,
  buttonText,
  onClick,
  danger = false,
}: {
  title: string;
  description?: string;
  buttonText: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <main className="flex min-h-[100dvh] justify-center bg-[#f4f4f2] p-4">

      <div className="flex min-h-[calc(100dvh-32px)] w-full max-w-[430px] flex-col rounded-[34px] bg-[#fffefb] px-6 py-8">

        <Brand />


        <div className="my-auto">

          <h1
            className={`text-[36px] font-bold ${
              danger
                ? "text-[#ff4458]"
                : ""
            }`}
          >
            {title}
          </h1>


          {description && (

            <p className="mt-4 text-sm text-neutral-500">
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