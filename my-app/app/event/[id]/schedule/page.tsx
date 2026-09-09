"use client";
import { usePreferredLanguage } from "@/lib/use-preferred-language";
import { useEventRole } from "@/lib/use-event-role";
import { useTranslation } from "@/lib/use-translation";
import TranslationStatus from "@/components/translation-status";

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


type EventData = {
  id: string;
  name: string;
  owner_id: string;
  status: "active" | "ended";
};


type ScheduleItem = {
  id: number;
  event_id: string;
  title: string;
  description: string | null;
  location_name: string | null;
  starts_at: string;
  ends_at: string | null;
  source_language: string;
  created_by: string;
  created_at: string;
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
    schedule: "Schedule",

    subtitle:
      "Everything happening at this event.",

    add: "Add schedule",
    edit: "Edit schedule",

    title: "Title",

    titlePlaceholder:
      "Opening ceremony",

    description:
      "Description",

    descriptionPlaceholder:
      "Optional details",

    location:
      "Location",

    locationPlaceholder:
      "Main Hall",

    starts:
      "Starts",

    ends:
      "Ends",

    save:
      "Save",

    creating:
      "Saving...",

    delete:
      "Delete",

    noSchedule:
      "No schedule has been added yet.",

    upcoming:
      "Upcoming",

    past:
      "Past",

    organizer:
      "Organizer",

    ended:
      "This event has ended.",

    original:
      "Original",

    translated:
      "Translated",
  },

  ko: {
    schedule: "일정",

    subtitle:
      "이벤트의 전체 일정을 한곳에서 확인하세요.",

    add:
      "일정 추가",

    edit:
      "일정 수정",

    title:
      "일정 이름",

    titlePlaceholder:
      "개막식",

    description:
      "설명",

    descriptionPlaceholder:
      "필요한 안내를 입력하세요",

    location:
      "장소",

    locationPlaceholder:
      "메인 홀",

    starts:
      "시작",

    ends:
      "종료",

    save:
      "저장",

    creating:
      "저장 중...",

    delete:
      "삭제",

    noSchedule:
      "아직 등록된 일정이 없습니다.",

    upcoming:
      "예정",

    past:
      "지난 일정",

    organizer:
      "운영자",

    ended:
      "종료된 이벤트입니다.",

    original:
      "원문",

    translated:
      "번역",
  },

  es: {
    schedule:
      "Horario",

    subtitle:
      "Todo lo que ocurre en este evento.",

    add:
      "Añadir horario",

    edit:
      "Editar horario",

    title:
      "Título",

    titlePlaceholder:
      "Ceremonia de apertura",

    description:
      "Descripción",

    descriptionPlaceholder:
      "Detalles opcionales",

    location:
      "Lugar",

    locationPlaceholder:
      "Salón principal",

    starts:
      "Inicio",

    ends:
      "Fin",

    save:
      "Guardar",

    creating:
      "Guardando...",

    delete:
      "Eliminar",

    noSchedule:
      "Todavía no hay horarios.",

    upcoming:
      "Próximamente",

    past:
      "Pasado",

    organizer:
      "Organizador",

    ended:
      "Este evento ha terminado.",

    original:
      "Original",

    translated:
      "Traducido",
  },
};


export default function SchedulePage() {
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


  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setClock(Date.now()), 30000); return () => clearInterval(timer); }, []);
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


  const { senderId } = useWydIdentity();


  const [language] = usePreferredLanguage();


  const [
    items,
    setItems,
  ] = useState<ScheduleItem[]>(
    []
  );


  


  const [
    originalItems,
    setOriginalItems,
  ] = useState<
    Record<number, boolean>
  >({});


  const [
    showEditor,
    setShowEditor,
  ] = useState(false);


  const [
    editingItem,
    setEditingItem,
  ] = useState<ScheduleItem | null>(
    null
  );


  const [
    titleDraft,
    setTitleDraft,
  ] = useState("");


  const [
    descriptionDraft,
    setDescriptionDraft,
  ] = useState("");


  const [
    locationDraft,
    setLocationDraft,
  ] = useState("");


  const [
    startsDraft,
    setStartsDraft,
  ] = useState("");


  const [
    endsDraft,
    setEndsDraft,
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


  const { canManage: isOrganizer } = useEventRole(eventId, senderId);


  const upcoming =
    items.filter(
      (item) => {
        const end =
          item.ends_at ||
          item.starts_at;

        return (
          new Date(end).getTime() >=
          clock
        );
      }
    );


  const past =
    items.filter(
      (item) => {
        const end =
          item.ends_at ||
          item.starts_at;

        return (
          new Date(end).getTime() <
          clock
        );
      }
    );


  // ===================================
  // PROFILE
  // ===================================

  


  // ===================================
  // LOAD
  // ===================================

  useEffect(() => {
    if (
      !supabase ||
      !senderId ||
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
          "id,name,owner_id,status"
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
        data,
        error,
      } = await supabase!
        .from(
          "event_schedule_items"
        )
        .select("*")
        .eq(
          "event_id",
          eventId
        )
        .order(
          "starts_at",
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


      setItems(
        data as ScheduleItem[]
      );


      setLoading(
        false
      );
    }


    refresh();


    const channel =
      supabase.channel(
        `wyd-schedule-${eventId}`
      );


    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table:
            "event_schedule_items",
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
    senderId,
  ]);


  // ===================================
  // TRANSLATION
  // ===================================

  


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
        "Automatic schedule announcement error:",
        error
      );

      return;
    }


    /*
     * 운영자가 자신의 자동 공지를
     * 다시 받을 필요가 없으므로 읽음 처리.
     */
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
        "Automatic announcement read error:",
        readError
      );
    }
  }


  function scheduleAnnouncementText(
    action:
      | "created"
      | "updated"
      | "deleted",

    title: string,

    startsAt: string,

    location: string | null
  ) {
    const dateText =
      formatFullDate(
        startsAt,
        language
      );


    if (
      language === "ko"
    ) {
      if (
        action ===
        "created"
      ) {
        return [
          "📅 새 일정이 추가되었습니다.",
          "",
          title,
          dateText,
          location
            ? `📍 ${location}`
            : "",
        ]
          .filter(Boolean)
          .join("\n");
      }


      if (
        action ===
        "updated"
      ) {
        return [
          "⚠️ 일정이 변경되었습니다.",
          "",
          title,
          dateText,
          location
            ? `📍 ${location}`
            : "",
        ]
          .filter(Boolean)
          .join("\n");
      }


      return [
        "⚠️ 일정이 취소되었습니다.",
        "",
        title,
        dateText,
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
          "📅 Se ha añadido un nuevo horario.",
          "",
          title,
          dateText,
          location
            ? `📍 ${location}`
            : "",
        ]
          .filter(Boolean)
          .join("\n");
      }


      if (
        action ===
        "updated"
      ) {
        return [
          "⚠️ El horario ha cambiado.",
          "",
          title,
          dateText,
          location
            ? `📍 ${location}`
            : "",
        ]
          .filter(Boolean)
          .join("\n");
      }


      return [
        "⚠️ Este horario ha sido cancelado.",
        "",
        title,
        dateText,
      ]
        .filter(Boolean)
        .join("\n");
    }


    if (
      action ===
      "created"
    ) {
      return [
        "📅 A new schedule has been added.",
        "",
        title,
        dateText,
        location
          ? `📍 ${location}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");
    }


    if (
      action ===
      "updated"
    ) {
      return [
        "⚠️ The schedule has changed.",
        "",
        title,
        dateText,
        location
          ? `📍 ${location}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");
    }


    return [
      "⚠️ A schedule has been cancelled.",
      "",
      title,
      dateText,
    ]
      .filter(Boolean)
      .join("\n");
  }


  // ===================================
  // EDITOR
  // ===================================

  function openNew() {
    setEditingItem(
      null
    );


    setTitleDraft(
      ""
    );


    setDescriptionDraft(
      ""
    );


    setLocationDraft(
      ""
    );


    setStartsDraft(
      ""
    );


    setEndsDraft(
      ""
    );


    setErrorMessage(
      ""
    );


    setShowEditor(
      true
    );
  }


  function openEdit(
    item: ScheduleItem
  ) {
    setEditingItem(
      item
    );


    setTitleDraft(
      item.title
    );


    setDescriptionDraft(
      item.description ||
        ""
    );


    setLocationDraft(
      item.location_name ||
        ""
    );


    setStartsDraft(
      toDateInput(
        item.starts_at
      )
    );


    setEndsDraft(
      item.ends_at
        ? toDateInput(
            item.ends_at
          )
        : ""
    );


    setErrorMessage(
      ""
    );


    setShowEditor(
      true
    );
  }


  async function saveSchedule(
    event: FormEvent
  ) {
    event.preventDefault();


    if (
      !supabase ||
      !isOrganizer ||
      !titleDraft.trim() ||
      !startsDraft ||
      saving
    ) {
      return;
    }


    setSaving(
      true
    );


    setErrorMessage(
      ""
    );


    const newStartsAt =
      new Date(
        startsDraft
      ).toISOString();


    const newEndsAt =
      endsDraft
        ? new Date(
            endsDraft
          ).toISOString()
        : null;


    const newTitle =
      titleDraft.trim();


    const newDescription =
      descriptionDraft.trim() ||
      null;


    const newLocation =
      locationDraft.trim() ||
      null;


    const payload = {
      event_id:
        eventId,

      title:
        newTitle,

      description:
        newDescription,

      location_name:
        newLocation,

      starts_at:
        newStartsAt,

      ends_at:
        newEndsAt,

      source_language:
        language,

      updated_at:
        new Date()
          .toISOString(),
    };


    if (editingItem) {
      const changed =
        editingItem.title !==
          newTitle ||

        (
          editingItem.description ||
          null
        ) !==
          newDescription ||

        (
          editingItem.location_name ||
          null
        ) !==
          newLocation ||

        editingItem.starts_at !==
          newStartsAt ||

        (
          editingItem.ends_at ||
          null
        ) !==
          newEndsAt;


      const {
        error,
      } = await supabase
        .from(
          "event_schedule_items"
        )
        .update(
          payload
        )
        .eq(
          "id",
          editingItem.id
        )
        .eq(
          "event_id",
          eventId
        );


      if (error) {
        console.error(
          "Schedule update error:",
          error
        );


        setErrorMessage(
          "일정을 수정하지 못했습니다."
        );


        setSaving(
          false
        );


        return;
      }


      if (changed) {
        await createAutoAnnouncement(
          scheduleAnnouncementText(
            "updated",
            newTitle,
            newStartsAt,
            newLocation
          ),
          "important"
        );
      }
    } else {
      const {
        error,
      } = await supabase
        .from(
          "event_schedule_items"
        )
        .insert({
          ...payload,

          created_by:
            senderId,
        });


      if (error) {
        console.error(
          "Schedule create error:",
          error
        );


        setErrorMessage(
          "일정을 추가하지 못했습니다."
        );


        setSaving(
          false
        );


        return;
      }


      await createAutoAnnouncement(
        scheduleAnnouncementText(
          "created",
          newTitle,
          newStartsAt,
          newLocation
        ),
        "normal"
      );
    }


    setSaving(
      false
    );


    setShowEditor(
      false
    );
  }


  async function deleteItem(
    item: ScheduleItem
  ) {
    if (
      !supabase ||
      !isOrganizer
    ) {
      return;
    }


    const confirmed =
      window.confirm(
        `"${item.title}" 일정을 삭제할까요?`
      );


    if (!confirmed) {
      return;
    }


    const {
      error,
    } = await supabase
      .from(
        "event_schedule_items"
      )
      .delete()
      .eq(
        "id",
        item.id
      )
      .eq(
        "event_id",
        eventId
      );


    if (error) {
      console.error(
        "Schedule delete error:",
        error
      );


      return;
    }


    await createAutoAnnouncement(
      scheduleAnnouncementText(
        "deleted",
        item.title,
        item.starts_at,
        item.location_name
      ),
      "important"
    );
  }


  // ===================================
  // TEXT
  // ===================================

  // ===================================
  // UI
  // ===================================

  if (
    !supabase
  ) {
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
                openNew
              }
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2868d8] text-[24px] font-light text-white"
            >
              +
            </button>

          ) : (

            <div className="h-11 w-11" />

          )}

        </div>


        {/* HERO */}

        <section className="pt-10">

          <div className="flex items-center gap-2">

            <span className="rounded-full bg-[#eef5ff] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-[#2868d8]">
              EVENT
            </span>


            {isOrganizer && (

              <span className="rounded-full bg-[#fff1bd] px-3 py-1.5 text-[9px] font-bold text-[#a97500]">
                {t.organizer}
              </span>

            )}

          </div>


          <h1 className="mt-5 text-[38px] font-black tracking-[-0.055em]">
            {t.schedule}
          </h1>


          <p className="mt-3 text-sm leading-6 text-neutral-500">
            {eventData?.name}
          </p>


          <p className="mt-1 max-w-[330px] text-sm leading-6 text-neutral-400">
            {t.subtitle}
          </p>

        </section>


        {eventData?.status ===
          "ended" && (

          <div className="mt-6 rounded-[20px] bg-[#fff1f2] px-4 py-3 text-xs font-bold text-[#ff4458]">
            {t.ended}
          </div>

        )}


        {/* UPCOMING */}

        <section className="pt-10">

          <div className="flex items-end justify-between">

            <div>

              <p className="text-[10px] font-black uppercase tracking-[0.17em] text-[#2868d8]">
                NOW & NEXT
              </p>

              <h2 className="mt-2 text-[24px] font-black tracking-[-0.04em]">
                {t.upcoming}
              </h2>

            </div>


            <span className="text-xs text-neutral-400">
              {upcoming.length}
            </span>

          </div>


          <div className="mt-5 space-y-3">

            {upcoming.length ===
            0 ? (

              <EmptyState
                text={
                  t.noSchedule
                }
              />

            ) : (

              upcoming.map(
                (item) => (

                  <ScheduleCard
                    key={
                      item.id
                    }
                    item={
                      item
                    }
                    original={
                      !!originalItems[
                        item.id
                      ]
                    }
                    t={
                      t
                    }
                    language={
                      language
                    }
                    isOrganizer={
                      isOrganizer
                    }
                    onToggleOriginal={() =>
                      setOriginalItems(
                        (current) => ({
                          ...current,

                          [item.id]:
                            !current[
                              item.id
                            ],
                        })
                      )
                    }
                    onEdit={() =>
                      openEdit(
                        item
                      )
                    }
                    onDelete={() =>
                      deleteItem(
                        item
                      )
                    }
                  />

                )
              )

            )}

          </div>

        </section>


        {/* PAST */}

        {past.length >
          0 && (

          <section className="pt-10">

            <p className="text-[10px] font-black uppercase tracking-[0.17em] text-neutral-400">
              {t.past}
            </p>


            <div className="mt-4 space-y-3 opacity-65">

              {past.map(
                (item) => (

                  <ScheduleCard
                    key={
                      item.id
                    }
                    item={
                      item
                    }
                    original={
                      !!originalItems[
                        item.id
                      ]
                    }
                    t={
                      t
                    }
                    language={
                      language
                    }
                    isOrganizer={
                      isOrganizer
                    }
                    onToggleOriginal={() =>
                      setOriginalItems(
                        (current) => ({
                          ...current,

                          [item.id]:
                            !current[
                              item.id
                            ],
                        })
                      )
                    }
                    onEdit={() =>
                      openEdit(
                        item
                      )
                    }
                    onDelete={() =>
                      deleteItem(
                        item
                      )
                    }
                  />

                )
              )}

            </div>

          </section>

        )}


        {isOrganizer &&
          eventData?.status ===
            "active" && (

          <button
            onClick={
              openNew
            }
            className="mt-8 w-full rounded-[21px] border border-dashed border-[#bcd4ff] py-4 text-[12px] font-bold text-[#2868d8]"
          >
            + {t.add}
          </button>

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
              editingItem
                ? t.edit
                : t.add
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
              saveSchedule
            }
            className="mt-6"
          >

            <FieldLabel>
              {t.title}
            </FieldLabel>


            <input
              autoFocus
              value={
                titleDraft
              }
              onChange={(event) =>
                setTitleDraft(
                  event.target.value
                )
              }
              placeholder={
                t.titlePlaceholder
              }
              className="mt-2 w-full rounded-[19px] bg-[#f4f4f2] px-4 py-4 text-sm outline-none"
            />


            <FieldLabel>
              {t.description}
            </FieldLabel>


            <textarea
              value={
                descriptionDraft
              }
              onChange={(event) =>
                setDescriptionDraft(
                  event.target.value
                )
              }
              rows={3}
              placeholder={
                t.descriptionPlaceholder
              }
              className="mt-2 w-full resize-none rounded-[19px] bg-[#f4f4f2] px-4 py-4 text-sm leading-6 outline-none"
            />


            <FieldLabel>
              {t.location}
            </FieldLabel>


            <input
              value={
                locationDraft
              }
              onChange={(event) =>
                setLocationDraft(
                  event.target.value
                )
              }
              placeholder={
                t.locationPlaceholder
              }
              className="mt-2 w-full rounded-[19px] bg-[#f4f4f2] px-4 py-4 text-sm outline-none"
            />


            <div className="mt-5 grid grid-cols-1 gap-4">

              <div>

                <FieldLabel noMargin>
                  {t.starts}
                </FieldLabel>


                <input
                  type="datetime-local"
                  value={
                    startsDraft
                  }
                  onChange={(event) =>
                    setStartsDraft(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-[19px] bg-[#f4f4f2] px-4 py-4 text-sm outline-none"
                />

              </div>


              <div>

                <FieldLabel noMargin>
                  {t.ends}
                </FieldLabel>


                <input
                  type="datetime-local"
                  value={
                    endsDraft
                  }
                  onChange={(event) =>
                    setEndsDraft(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-[19px] bg-[#f4f4f2] px-4 py-4 text-sm outline-none"
                />

              </div>

            </div>


            {errorMessage && (

              <div className="mt-4 rounded-[17px] bg-red-50 px-4 py-3 text-xs text-red-500">
                {errorMessage}
              </div>

            )}


            <button
              type="submit"
              disabled={
                saving ||
                !titleDraft.trim() ||
                !startsDraft
              }
              className="mt-6 w-full rounded-[20px] bg-[#2868d8] py-4 text-sm font-black text-white disabled:bg-neutral-200"
            >
              {saving
                ? t.creating
                : t.save}
            </button>

          </form>

        </Sheet>

      )}

    </main>
  );
}


function ScheduleCard({
  item,
  original,
  t,
  language,
  isOrganizer,
  onToggleOriginal,
  onEdit,
  onDelete,
}: {
  item: ScheduleItem;
  original: boolean;
  t: Record<string, string>;
  language: string;
  isOrganizer: boolean;
  onToggleOriginal: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const titleResult = useTranslation(item.title, item.source_language, language);
  const descriptionResult = useTranslation(item.description || '', item.source_language, language);
  const title = original ? item.title : titleResult.text || item.title;
  const description = original ? item.description : descriptionResult.text || item.description;
  const translated = titleResult.status === 'translated' || descriptionResult.status === 'translated';
  return (
    <article className="rounded-[25px] border border-neutral-100 bg-white p-5 shadow-[0_8px_25px_rgba(0,0,0,0.035)]">

      <div className="flex items-start">

        <div className="w-[72px] shrink-0">

          <p className="text-[21px] font-black tracking-[-0.04em] text-[#2868d8]">
            {formatTime(
              item.starts_at,
              language
            )}
          </p>

          <p className="mt-1 text-[9px] font-bold uppercase text-neutral-400">
            {formatDay(
              item.starts_at,
              language
            )}
          </p>

        </div>


        <div className="min-w-0 flex-1 border-l border-neutral-100 pl-4">

          <h3 className="text-[15px] font-black">
            {title}
          </h3>


          {item.location_name && (

            <p className="mt-2 text-[11px] font-bold text-[#46a968]">
              ⌖ {item.location_name}
            </p>

          )}


          {description && (

            <p className="mt-3 whitespace-pre-wrap text-[12px] leading-5 text-neutral-500">
              {description}
            </p>

          )}


          {item.ends_at && (

            <p className="mt-3 text-[9px] text-neutral-400">
              {formatTime(
                item.starts_at,
                language
              )}
              {" → "}
              {formatTime(
                item.ends_at,
                language
              )}
            </p>

          )}


          <TranslationStatus status={titleResult.status} language={language} retry={titleResult.retry} />
          {descriptionResult.status === 'failed' && <TranslationStatus status="failed" language={language} retry={descriptionResult.retry} />}
          {translated && (

            <button
              onClick={
                onToggleOriginal
              }
              className="mt-3 text-[9px] font-bold text-[#2868d8]"
            >
              {original
                ? t.translated
                : t.original}
            </button>

          )}

        </div>

      </div>


      {isOrganizer && (

        <div className="mt-4 flex justify-end gap-2 border-t border-neutral-100 pt-3">

          <button
            onClick={
              onEdit
            }
            className="rounded-full bg-[#eef5ff] px-4 py-2 text-[10px] font-bold text-[#2868d8]"
          >
            {t.edit}
          </button>


          <button
            onClick={
              onDelete
            }
            className="rounded-full bg-[#fff1f2] px-4 py-2 text-[10px] font-bold text-[#ff4458]"
          >
            {t.delete}
          </button>

        </div>

      )}

    </article>
  );
}


function formatTime(
  value: string,
  language: string
) {
  return new Intl.DateTimeFormat(
    localeFor(
      language
    ),
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(
    new Date(value)
  );
}


function formatDay(
  value: string,
  language: string
) {
  return new Intl.DateTimeFormat(
    localeFor(
      language
    ),
    {
      month: "short",
      day: "numeric",
    }
  ).format(
    new Date(value)
  );
}


function formatFullDate(
  value: string,
  language: string
) {
  return new Intl.DateTimeFormat(
    localeFor(
      language
    ),
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


function localeFor(
  language: string
) {
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


function toDateInput(
  value: string
) {
  const date =
    new Date(value);


  const offset =
    date.getTimezoneOffset();


  const local =
    new Date(
      date.getTime() -
        offset *
          60 *
          1000
    );


  return local
    .toISOString()
    .slice(
      0,
      16
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


function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-[24px] bg-[#f5f5f2] p-7 text-center">

      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-white text-xl text-[#2868d8]">
        □
      </div>

      <p className="mt-4 text-[12px] text-neutral-400">
        {text}
      </p>

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

        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#2868d8]">
          WYD SCHEDULE
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
  noMargin = false,
}: {
  children: ReactNode;
  noMargin?: boolean;
}) {
  return (
    <p
      className={`text-[10px] font-bold ${
        noMargin
          ? ""
          : "mt-5"
      }`}
    >
      {children}
    </p>
  );
}