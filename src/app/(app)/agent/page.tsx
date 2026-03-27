import { createClient } from "@/lib/supabase/server";
import { DEFAULT_AGENT_PROMPT } from "@/lib/agentDefaults";
import AgentClient from "./AgentClient";

export default async function AgentPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("prompt")
    .eq("id", 1)
    .single();

  const prompt = data?.prompt || DEFAULT_AGENT_PROMPT;

  return <AgentClient initialPrompt={prompt} />;
}
