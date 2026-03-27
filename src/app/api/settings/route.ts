import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { DEFAULT_AGENT_PROMPT } from "@/lib/agentDefaults";

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("prompt")
    .eq("id", 1)
    .single();
  return NextResponse.json({ prompt: data?.prompt || DEFAULT_AGENT_PROMPT });
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { prompt } = await req.json();
  await supabase
    .from("settings")
    .upsert({ id: 1, prompt, updated_at: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}
