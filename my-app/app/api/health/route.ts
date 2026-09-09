import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export function GET() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return NextResponse.json({ service: "wyd-messenger", process: "ok", configured, dependencies: "not_probed", status: configured ? "configuration_present" : "configuration_pending" }, { status: configured ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
