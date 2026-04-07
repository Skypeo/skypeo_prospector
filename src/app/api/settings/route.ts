import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { DEFAULT_AGENT_PROMPT } from "@/lib/agentDefaults";

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("prompt, tim_whatsapp")
    .eq("id", 1)
    .single();
  return NextResponse.json({
    prompt: data?.prompt || DEFAULT_AGENT_PROMPT,
    tim_whatsapp: data?.tim_whatsapp || "",
  });
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const body = await req.json();
  const update: Record<string, unknown> = { id: 1, updated_at: new Date().toISOString() };
  if (typeof body.prompt === "string") update.prompt = body.prompt;
  if (typeof body.tim_whatsapp === "string") update.tim_whatsapp = body.tim_whatsapp;
  await supabase.from("settings").upsert(update);
  return NextResponse.json({ ok: true });
}
