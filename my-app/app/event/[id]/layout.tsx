"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  useParams,
  usePathname,
  useRouter,
} from "next/navigation";

import { getSupabaseBrowser, useWydIdentity } from '@/lib/supabase-browser';


const navCopy: Record<
  string,
  {
    event: string;
    schedule: string;
    meeting: string;
    manage: string;
  }
> = {
  en: {
    event: "Event",
    schedule: "Schedule",
    meeting: "Meeting",
    manage: "Manage",
  },

  ko: {
    event: "이벤트",
    schedule: "일정",
    meeting: "집합 장소",
    manage: "관리",
  },

  es: {
    event: "Evento",
    schedule: "Horario",
    meeting: "Encuentro",
    manage: "Gestión",
  },
};


export default function EventLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router =
    useRouter();

  const pathname =
    usePathname();

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
    language,
    setLanguage,
  ] = useState("en");


  const { senderId } = useWydIdentity();


  const [
    isOrganizer,
    setIsOrganizer,
  ] = useState(false);


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
    const timer =
      setInterval(() => {
        const saved =
          localStorage.getItem(
            "wyd_language"
          );


        if (
          saved &&
          saved !== language
        ) {
          setLanguage(
            saved
          );
        }
      }, 1000);


    return () => {
      clearInterval(
        timer
      );
    };
  }, [
    language,
  ]);


  useEffect(() => {
    if (
      !supabase ||
      !eventId ||
      !senderId
    ) {
      return;
    }


    let active =
      true;


    async function checkOrganizer() {
      const {
        data,
        error,
      } = await supabase!
        .from("events")
        .select(
          "owner_id"
        )
        .eq(
          "id",
          eventId
        )
        .maybeSingle();


      if (
        !active ||
        error ||
        !data
      ) {
        return;
      }


      setIsOrganizer(
        data.owner_id ===
          senderId
      );
    }


    checkOrganizer();


    const timer =
      setInterval(
        checkOrganizer,
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
    eventId,
    senderId,
  ]);


  const t =
    navCopy[language] ||
    navCopy.en;


  const eventPath =
    `/event/${eventId}`;

  const schedulePath =
    `/event/${eventId}/schedule`;

  const meetingPath =
    `/event/${eventId}/meeting`;

  const managePath =
    `/event/${eventId}/manage`;


  const scheduleActive =
    pathname ===
    schedulePath;

  const meetingActive =
    pathname ===
    meetingPath;

  const manageActive =
    pathname ===
    managePath;

  const eventActive =
    !scheduleActive &&
    !meetingActive &&
    !manageActive;


  return (
    <div className="min-h-[100dvh] bg-[#f4f4f2]">

      <div className="pb-[92px]">
        {children}
      </div>


      <nav className="fixed bottom-0 left-1/2 z-[80] w-full max-w-[430px] -translate-x-1/2 border-t border-neutral-100 bg-[#fffefb]/95 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">

        <div
          className={`grid gap-2 ${
            isOrganizer
              ? "grid-cols-4"
              : "grid-cols-3"
          }`}
        >

          <NavButton
            icon="⌂"
            label={
              t.event
            }
            active={
              eventActive
            }
            onClick={() =>
              router.push(
                eventPath
              )
            }
          />


          <NavButton
            icon="□"
            label={
              t.schedule
            }
            active={
              scheduleActive
            }
            onClick={() =>
              router.push(
                schedulePath
              )
            }
          />


          <NavButton
            icon="⌖"
            label={
              t.meeting
            }
            active={
              meetingActive
            }
            onClick={() =>
              router.push(
                meetingPath
              )
            }
          />


          {isOrganizer && (

            <NavButton
              icon="•••"
              label={
                t.manage
              }
              active={
                manageActive
              }
              onClick={() =>
                router.push(
                  managePath
                )
              }
            />

          )}

        </div>

      </nav>

    </div>
  );
}


function NavButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={
        onClick
      }
      className={`flex min-h-[58px] flex-col items-center justify-center rounded-[18px] transition ${
        active
          ? "bg-[#eef5ff] text-[#2868d8]"
          : "text-neutral-400"
      }`}
    >

      <span
        className={`text-[19px] ${
          active
            ? "font-black"
            : "font-medium"
        }`}
      >
        {icon}
      </span>


      <span
        className={`mt-1 text-[9px] ${
          active
            ? "font-bold"
            : "font-medium"
        }`}
      >
        {label}
      </span>

    </button>
  );
}