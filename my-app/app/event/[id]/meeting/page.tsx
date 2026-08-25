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

import {
  createClient,
} from "@supabase/supabase-js";


type EventData = {
  id: string;
  name: string;
  owner_id: string;
  status: "active" | "ended";
};


type MeetingPoint = {
  event_id: string;
  name: string;
  details: string | null;
  map_url: string | null;
  source_language: string;
  updated_by: string;
  updated_at: string;
};


type AnnouncementPriority =
  | "normal"
  | "important"
  | "urgent";


const copy: Record<
  string,
  Record<string, string>
> = {
  en: {
    meeting:
      "Meeting point",

    subtitle:
      "The main place everyone should know.",

    organizer:
      "Organizer",

    set:
      "Set meeting point",

    edit:
      "Edit meeting point",

    name:
      "Location name",

    namePlaceholder:
      "Gate B · Seoul Plaza",

    details:
      "Instructions",

    detailsPlaceholder:
      "Meet next to the main entrance.",

    map:
      "Map link",

    mapPlaceholder:
      "https://maps.google.com/...",

    openMap:
      "Open map",

    save:
      "Save meeting point",

    saving:
      "Saving...",

    noMeeting:
      "The organizer has not set a meeting point yet.",

    updated:
      "Last updated",

    original:
      "Original",

    translated:
      "Translated",
  },

  ko: {
    meeting:
      "집합 장소",

    subtitle:
      "모든 참가자가 꼭 알아야 할 대표 집합 장소입니다.",

    organizer:
      "운영자",

    set:
      "집합 장소 설정",

    edit:
      "집합 장소 수정",

    name:
      "장소 이름",

    namePlaceholder:
      "서울광장 Gate B",

    details:
      "집합 안내",

    detailsPlaceholder:
      "메인 입구 오른쪽 깃발 앞에서 모여주세요.",

    map:
      "지도 링크",

    mapPlaceholder:
      "https://maps.google.com/...",

    openMap:
      "지도 열기",

    save:
      "집합 장소 저장",

    saving:
      "저장 중...",

    noMeeting:
      "아직 운영자가 집합 장소를 설정하지 않았습니다.",

    updated:
      "최근 수정",

    original:
      "원문",

    translated:
      "번역",
  },

  es: {
    meeting:
      "Punto de encuentro",

    subtitle:
      "El lugar principal que todos deben conocer.",

    organizer:
      "Organizador",

    set:
      "Establecer punto",

    edit:
      "Editar punto",

    name:
      "Nombre del lugar",

    namePlaceholder:
      "Puerta B · Plaza",

    details:
      "Instrucciones",

    detailsPlaceholder:
      "Reúnete junto a la entrada principal.",

    map:
      "Enlace del mapa",

    mapPlaceholder:
      "https://maps.google.com/...",

    openMap:
      "Abrir mapa",

    save:
      "Guardar",

    saving:
      "Guardando...",

    noMeeting:
      "El organizador todavía no ha establecido un punto de encuentro.",

    updated:
      "Actualizado",

    original:
      "Original",

    translated:
      "Traducido",
  },
};


export default function MeetingPage() {
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


  const supabase =
    useMemo(() => {
      const url =
        process.env
          .NEXT_PUBLIC_SUPABASE_URL;

      const key =
        process.env
          .NEXT_PUBLIC_SUPABASE_ANON_KEY;


      if (!url || !key) {
        return null;
      }


      return createClient(
        url,
        key
      );
    }, []);


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
    meeting,
    setMeeting,
  ] = useState<MeetingPoint | null>(
    null
  );


  const [
    senderId,
    setSenderId,
  ] = useState("");


  const [
    language,
    setLanguage,
  ] = useState("en");


  const [
    translatedDetails,
    setTranslatedDetails,
  ] = useState("");


  const [
    translationLoading,
    setTranslationLoading,
  ] = useState(false);


  const [
    showOriginal,
    setShowOriginal,
  ] = useState(false);


  const [
    showEditor,
    setShowEditor,
  ] = useState(false);


  const [
    nameDraft,
    setNameDraft,
  ] = useState("");


  const [
    detailsDraft,
    setDetailsDraft,
  ] = useState("");


  const [
    mapDraft,
    setMapDraft,
  ] = useState("");


  const [
    saving,
    setSaving,
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


  // ===================================
  // PROFILE
  // ===================================

  useEffect(() => {
    const savedId =
      localStorage.getItem(
        "wyd_sender_id"
      );


    const savedLanguage =
      localStorage.getItem(
        "wyd_language"
      );


    if (savedId) {
      setSenderId(
        savedId
      );
    }


    if (savedLanguage) {
      setLanguage(
        savedLanguage
      );
    }
  }, []);


  useEffect(() => {
    const timer =
      setInterval(() => {
        const savedLanguage =
          localStorage.getItem(
            "wyd_language"
          );


        if (
          savedLanguage &&
          savedLanguage !==
            language
        ) {
          setLanguage(
            savedLanguage
          );
        }
      }, 1000);


    return () => {
      clearInterval(
        timer
      );
    };
  }, [language]);


  // ===================================
  // LOAD
  // ===================================

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
      } = await supabase!
        .from("events")
        .select(
          "id,name,owner_id,status"
        )
        .eq(
          "id",
          eventId
        )
        .maybeSingle();


      if (
        active &&
        event
      ) {
        setEventData(
          event as EventData
        );
      }


      const {
        data,
        error,
      } = await supabase!
        .from(
          "event_meeting_points"
        )
        .select("*")
        .eq(
          "event_id",
          eventId
        )
        .maybeSingle();


      if (!active) {
        return;
      }


      if (error) {
        console.error(
          "Meeting point load error:",
          error
        );


        setLoading(
          false
        );


        return;
      }


      if (!data) {
        setMeeting(
          null
        );


        setLoading(
          false
        );


        return;
      }


      const incoming =
        data as MeetingPoint;


      setMeeting(
        (current) => {
          if (
            current &&
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


      setLoading(
        false
      );
    }


    refresh();


    const channel =
      supabase.channel(
        `wyd-meeting-${eventId}`
      );


    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table:
            "event_meeting_points",
          filter:
            `event_id=eq.${eventId}`,
        },
        () => {
          refresh();
        }
      )
      .subscribe();


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


      supabase.removeChannel(
        channel
      );
    };
  }, [
    supabase,
    eventId,
  ]);


  // ===================================
  // TRANSLATION
  // ===================================

  useEffect(() => {
    const details =
      meeting?.details ||
      "";


    const sourceLanguage =
      meeting?.source_language ||
      "";


    setShowOriginal(
      false
    );


    if (!details) {
      setTranslatedDetails(
        ""
      );


      setTranslationLoading(
        false
      );


      return;
    }


    if (
      sourceLanguage ===
      language
    ) {
      setTranslatedDetails(
        ""
      );


      setTranslationLoading(
        false
      );


      return;
    }


    let cancelled =
      false;


    async function translate() {
      setTranslationLoading(
        true
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
                    details,

                  sourceLanguage,

                  targetLanguage:
                    language,
                }),
            }
          );


        const raw =
          await response.text();


        if (cancelled) {
          return;
        }


        if (
          !response.ok ||
          !raw
        ) {
          setTranslationLoading(
            false
          );


          return;
        }


        const data =
          JSON.parse(
            raw
          );


        if (cancelled) {
          return;
        }


        if (
          data?.translatedText
        ) {
          setTranslatedDetails(
            data.translatedText
          );
        }


        setTranslationLoading(
          false
        );
      } catch (
        error
      ) {
        if (
          !cancelled
        ) {
          console.error(
            "Meeting point translation error:",
            error
          );


          setTranslationLoading(
            false
          );
        }
      }
    }


    translate();


    return () => {
      cancelled =
        true;
    };
  }, [
    meeting?.details,
    meeting?.source_language,
    language,
  ]);


  // ===================================
  // AUTOMATIC ANNOUNCEMENT
  // ===================================

  async function createAutoAnnouncement(
    content: string,
    priority: AnnouncementPriority
  ) {
    if (
      !supabase ||
      !senderId ||
      !content.trim()
    ) {
      return;
    }


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
          content.trim(),

        source_language:
          language,

        priority,
      })
      .select(
        "id,event_id"
      )
      .single();


    if (
      error ||
      !data
    ) {
      console.error(
        "Automatic meeting announcement error:",
        error
      );


      return;
    }


    const {
      error: readError,
    } = await supabase
      .from(
        "event_announcement_reads"
      )
      .insert({
        announcement_id:
          data.id,

        event_id:
          eventId,

        user_id:
          senderId,
      });


    if (
      readError &&
      readError.code !==
        "23505"
    ) {
      console.error(
        "Automatic meeting announcement read error:",
        readError
      );
    }
  }


  function meetingAnnouncementText(
    action:
      | "created"
      | "updated"
      | "moved",

    name: string,

    details: string | null
  ) {
    if (
      language === "ko"
    ) {
      if (
        action ===
        "created"
      ) {
        return [
          "📍 집합 장소가 설정되었습니다.",
          "",
          name,
          details || "",
        ]
          .filter(Boolean)
          .join("\n");
      }


      if (
        action ===
        "moved"
      ) {
        return [
          "🚨 집합 장소가 변경되었습니다.",
          "",
          `새 집합 장소: ${name}`,
          details || "",
          "",
          "새로운 집합 장소를 확인해주세요.",
        ]
          .filter(Boolean)
          .join("\n");
      }


      return [
        "📍 집합 장소 안내가 변경되었습니다.",
        "",
        name,
        details || "",
      ]
        .filter(Boolean)
        .join("\n");
    }


    if (
      language === "es"
    ) {
      if (
        action ===
        "created"
      ) {
        return [
          "📍 Se ha establecido el punto de encuentro.",
          "",
          name,
          details || "",
        ]
          .filter(Boolean)
          .join("\n");
      }


      if (
        action ===
        "moved"
      ) {
        return [
          "🚨 El punto de encuentro ha cambiado.",
          "",
          `Nuevo punto: ${name}`,
          details || "",
          "",
          "Comprueba el nuevo punto de encuentro.",
        ]
          .filter(Boolean)
          .join("\n");
      }


      return [
        "📍 La información del punto de encuentro ha cambiado.",
        "",
        name,
        details || "",
      ]
        .filter(Boolean)
        .join("\n");
    }


    if (
      action ===
      "created"
    ) {
      return [
        "📍 The meeting point has been set.",
        "",
        name,
        details || "",
      ]
        .filter(Boolean)
        .join("\n");
    }


    if (
      action ===
      "moved"
    ) {
      return [
        "🚨 The meeting point has changed.",
        "",
        `New meeting point: ${name}`,
        details || "",
        "",
        "Please check the new meeting point.",
      ]
        .filter(Boolean)
        .join("\n");
    }


    return [
      "📍 The meeting point information has changed.",
      "",
      name,
      details || "",
    ]
      .filter(Boolean)
      .join("\n");
  }


  // ===================================
  // EDIT
  // ===================================

  function openEditor() {
    setNameDraft(
      meeting?.name ||
        ""
    );


    setDetailsDraft(
      meeting?.details ||
        ""
    );


    setMapDraft(
      meeting?.map_url ||
        ""
    );


    setErrorMessage(
      ""
    );


    setShowEditor(
      true
    );
  }


  async function saveMeeting(
    event: FormEvent
  ) {
    event.preventDefault();


    if (
      !supabase ||
      !isOrganizer ||
      !nameDraft.trim() ||
      saving
    ) {
      return;
    }


    const cleanName =
      nameDraft.trim();


    const cleanDetails =
      detailsDraft.trim() ||
      null;


    const cleanMap =
      mapDraft.trim() ||
      null;


    if (
      cleanMap &&
      !/^https?:\/\//i.test(
        cleanMap
      )
    ) {
      setErrorMessage(
        "지도 링크는 http:// 또는 https://로 시작해야 합니다."
      );


      return;
    }


    const wasExisting =
      !!meeting;


    const locationChanged =
      !!meeting &&
      (
        meeting.name !==
          cleanName ||

        (
          meeting.map_url ||
          null
        ) !==
          cleanMap
      );


    const detailsChanged =
      !!meeting &&
      (
        meeting.details ||
        null
      ) !==
        cleanDetails;


    const anythingChanged =
      !meeting ||
      locationChanged ||
      detailsChanged;


    setSaving(
      true
    );


    setErrorMessage(
      ""
    );


    const updatedAt =
      new Date()
        .toISOString();


    const {
      data,
      error,
    } = await supabase
      .from(
        "event_meeting_points"
      )
      .upsert(
        {
          event_id:
            eventId,

          name:
            cleanName,

          details:
            cleanDetails,

          map_url:
            cleanMap,

          source_language:
            language,

          updated_by:
            senderId,

          updated_at:
            updatedAt,
        },
        {
          onConflict:
            "event_id",
        }
      )
      .select("*")
      .single();


    if (error) {
      console.error(
        "Meeting point save error:",
        error
      );


      setErrorMessage(
        "집합 장소를 저장하지 못했습니다."
      );


      setSaving(
        false
      );


      return;
    }


    if (data) {
      setMeeting(
        data as MeetingPoint
      );
    }


    /*
     * 저장 성공 후 자동 공지.
     */
    if (
      anythingChanged
    ) {
      if (
        !wasExisting
      ) {
        await createAutoAnnouncement(
          meetingAnnouncementText(
            "created",
            cleanName,
            cleanDetails
          ),
          "important"
        );
      } else if (
        locationChanged
      ) {
        /*
         * 장소 이름이나 지도 링크가 바뀌었다면
         * 실제 집합 장소가 이동한 것으로 보고
         * 긴급 공지.
         */
        await createAutoAnnouncement(
          meetingAnnouncementText(
            "moved",
            cleanName,
            cleanDetails
          ),
          "urgent"
        );
      } else if (
        detailsChanged
      ) {
        await createAutoAnnouncement(
          meetingAnnouncementText(
            "updated",
            cleanName,
            cleanDetails
          ),
          "important"
        );
      }
    }


    setSaving(
      false
    );


    setShowEditor(
      false
    );
  }


  // ===================================
  // DISPLAY
  // ===================================

  const displayedDetails =
    meeting?.details
      ? showOriginal ||
        meeting.source_language ===
          language
        ? meeting.details
        : translatedDetails ||
          meeting.details
      : "";


  const isTranslated =
    !!meeting?.details &&
    meeting.source_language !==
      language;


  // ===================================
  // UI
  // ===================================

  if (!supabase) {
    return (
      <SimpleState
        text="Supabase settings are missing."
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


  return (
    <main className="min-h-[100dvh] bg-[#f4f4f2] text-[#101820]">

      <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-[#fffefb] px-5 pb-10 pt-6">


        {/* HEADER */}

        <div className="flex items-center justify-between">

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


          {isOrganizer ? (

            <button
              onClick={
                openEditor
              }
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2868d8] text-[16px] font-bold text-white"
            >
              ✎
            </button>

          ) : (

            <div className="h-11 w-11" />

          )}

        </div>


        {/* HERO */}

        <section className="pt-10">

          <div className="flex items-center gap-2">

            <span className="rounded-full bg-[#eef8f1] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-[#46a968]">
              EVENT LOCATION
            </span>


            {isOrganizer && (

              <span className="rounded-full bg-[#fff1bd] px-3 py-1.5 text-[9px] font-bold text-[#a97500]">
                {t.organizer}
              </span>

            )}

          </div>


          <h1 className="mt-5 text-[38px] font-black tracking-[-0.055em]">
            {t.meeting}
          </h1>


          <p className="mt-3 text-sm leading-6 text-neutral-500">
            {eventData?.name}
          </p>


          <p className="mt-1 max-w-[330px] text-sm leading-6 text-neutral-400">
            {t.subtitle}
          </p>

        </section>


        {!meeting ? (

          <section className="pt-10">

            <div className="rounded-[28px] bg-[#f5f5f2] p-8 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-white text-[27px] text-[#46a968]">
                ⌖
              </div>


              <p className="mt-5 text-[13px] leading-6 text-neutral-400">
                {t.noMeeting}
              </p>


              {isOrganizer && (

                <button
                  onClick={
                    openEditor
                  }
                  className="mt-6 rounded-full bg-[#2868d8] px-6 py-3 text-[11px] font-bold text-white"
                >
                  + {t.set}
                </button>

              )}

            </div>

          </section>

        ) : (

          <section className="pt-10">

            <div className="overflow-hidden rounded-[30px] border border-[#dfeee4] bg-white shadow-[0_12px_35px_rgba(0,0,0,0.045)]">


              <div className="bg-[#eef8f1] p-6">

                <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-white text-[25px] text-[#46a968]">
                  ⌖
                </div>


                <h2 className="mt-6 text-[30px] font-black leading-[1.05] tracking-[-0.05em]">
                  {meeting.name}
                </h2>

              </div>


              <div className="p-6">

                {displayedDetails && (

                  <p className="whitespace-pre-wrap text-[14px] font-medium leading-7">
                    {displayedDetails}
                  </p>

                )}


                {translationLoading &&
                  isTranslated &&
                  !translatedDetails && (

                  <div className="mt-4 flex items-center gap-2">

                    <div className="h-3 w-3 animate-spin rounded-full border border-neutral-200 border-t-[#2868d8]" />

                    <p className="text-[9px] text-neutral-400">
                      Translating...
                    </p>

                  </div>

                )}


                {isTranslated && (

                  <button
                    onClick={() =>
                      setShowOriginal(
                        (current) =>
                          !current
                      )
                    }
                    className="mt-4 text-[10px] font-bold text-[#2868d8]"
                  >
                    {showOriginal
                      ? t.translated
                      : t.original}
                  </button>

                )}


                {meeting.map_url && (

                  <a
                    href={
                      meeting.map_url
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 flex w-full items-center justify-between rounded-[20px] bg-[#2868d8] px-5 py-4 text-sm font-black text-white"
                  >

                    <span>
                      📍 {t.openMap}
                    </span>

                    <span>
                      ↗
                    </span>

                  </a>

                )}


                <p className="mt-5 text-[9px] text-neutral-400">
                  {t.updated}
                  {" · "}
                  {formatUpdated(
                    meeting.updated_at,
                    language
                  )}
                </p>

              </div>

            </div>


            {isOrganizer && (

              <button
                onClick={
                  openEditor
                }
                className="mt-5 w-full rounded-[20px] border border-[#dce9ff] bg-[#f8fbff] py-4 text-[12px] font-bold text-[#2868d8]"
              >
                ✎ {t.edit}
              </button>

            )}

          </section>

        )}

      </div>


      {/* EDITOR */}

      {showEditor && (

        <Sheet
          onClose={() => {
            if (!saving) {
              setShowEditor(
                false
              );
            }
          }}
        >

          <SheetHeader
            title={
              meeting
                ? t.edit
                : t.set
            }
            onClose={() => {
              if (!saving) {
                setShowEditor(
                  false
                );
              }
            }}
          />


          <form
            onSubmit={
              saveMeeting
            }
            className="mt-6"
          >

            <FieldLabel>
              {t.name}
            </FieldLabel>


            <input
              autoFocus
              value={
                nameDraft
              }
              onChange={(event) =>
                setNameDraft(
                  event.target.value
                )
              }
              placeholder={
                t.namePlaceholder
              }
              className="mt-2 w-full rounded-[19px] bg-[#f4f4f2] px-4 py-4 text-sm outline-none"
            />


            <FieldLabel>
              {t.details}
            </FieldLabel>


            <textarea
              value={
                detailsDraft
              }
              onChange={(event) =>
                setDetailsDraft(
                  event.target.value
                )
              }
              rows={4}
              placeholder={
                t.detailsPlaceholder
              }
              className="mt-2 w-full resize-none rounded-[19px] bg-[#f4f4f2] px-4 py-4 text-sm leading-6 outline-none"
            />


            <FieldLabel>
              {t.map}
            </FieldLabel>


            <input
              value={
                mapDraft
              }
              onChange={(event) =>
                setMapDraft(
                  event.target.value
                )
              }
              placeholder={
                t.mapPlaceholder
              }
              className="mt-2 w-full rounded-[19px] bg-[#f4f4f2] px-4 py-4 text-sm outline-none"
            />


            {errorMessage && (

              <div className="mt-4 rounded-[17px] bg-red-50 px-4 py-3 text-xs text-red-500">
                {errorMessage}
              </div>

            )}


            <button
              type="submit"
              disabled={
                saving ||
                !nameDraft.trim()
              }
              className="mt-6 w-full rounded-[20px] bg-[#2868d8] py-4 text-sm font-black text-white disabled:bg-neutral-200"
            >
              {saving
                ? t.saving
                : t.save}
            </button>

          </form>

        </Sheet>

      )}

    </main>
  );
}


function formatUpdated(
  value: string,
  language: string
) {
  return new Intl.DateTimeFormat(
    language === "ko"
      ? "ko-KR"
      : language === "es"
      ? "es-ES"
      : "en-US",
    {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(
    new Date(value)
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


function SimpleState({
  text,
}: {
  text: string;
}) {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#fffefb] p-6">

      <p className="text-sm text-red-500">
        {text}
      </p>

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
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/30 p-3 backdrop-blur-sm sm:items-center"
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
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between">

      <div>

        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#46a968]">
          WYD MEETING
        </p>

        <h2 className="mt-2 text-[27px] font-black tracking-[-0.045em]">
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


function FieldLabel({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <p className="mt-5 text-[10px] font-bold">
      {children}
    </p>
  );
}