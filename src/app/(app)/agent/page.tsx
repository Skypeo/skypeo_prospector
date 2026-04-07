import { createClient } from "@/lib/supabase/server";
import { DEFAULT_AGENT_PROMPT } from "@/lib/agentDefaults";
import AgentClient from "./AgentClient";

export default async function AgentPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("prompt, tim_whatsapp")
    .eq("id", 1)
    .single();

  const prompt = data?.prompt || DEFAULT_AGENT_PROMPT;
  const timWhatsapp = data?.tim_whatsapp || "";

  return <AgentClient initialPrompt={prompt} initialTimWhatsapp={timWhatsapp} />;
}
