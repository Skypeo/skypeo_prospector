import { createClient } from "@/lib/supabase/server";
import AgentClient from "./AgentClient";

const DEFAULT_PROMPT = "";

export default async function AgentPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("prompt")
    .eq("id", 1)
    .single();

  const prompt = data?.prompt ?? DEFAULT_PROMPT;

  return <AgentClient initialPrompt={prompt} />;
}
