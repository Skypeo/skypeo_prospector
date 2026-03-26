import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function validateTwilioSignature(request: NextRequest, body: string): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  // Si pas de token configuré, on bloque en prod, on laisse passer en dev
  if (!authToken) {
    if (process.env.NODE_ENV === "production") return false;
    return true;
  }

  const twilioSignature = request.headers.get("x-twilio-signature");
  if (!twilioSignature) return false;

  // Reconstruire l'URL complète
  const url = process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/api/webhook/twilio`
    : `${request.nextUrl.origin}/api/webhook/twilio`;

  // Construire le message à signer : URL + params triés
  const params = new URLSearchParams(body);
  const sortedKeys = [...params.keys()].sort();
  let toSign = url;
  for (const key of sortedKeys) {
    toSign += key + (params.get(key) ?? "");
  }

  // HMAC-SHA1
  const encoder = new TextEncoder();
  return crypto.subtle
    .importKey("raw", encoder.encode(authToken), { name: "HMAC", hash: "SHA-1" }, false, ["sign"])
    .then((key) => crypto.subtle.sign("HMAC", key, encoder.encode(toSign)))
    .then((sig) => {
      const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));
      return computed === twilioSignature;
    }) as unknown as boolean;
}

// Twilio envoie les webhooks en form-encoded
export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  // Valider la signature Twilio
  const isValid = validateTwilioSignature(request, rawBody);
  if (!isValid) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  const params = new URLSearchParams(rawBody);
  const from = params.get("From") as string; // "whatsapp:+33612345678"
  const body = params.get("Body") as string;

  if (!from || !body) {
    return new NextResponse("Missing fields", { status: 400 });
  }

  // Nettoyer le numéro (enlever "whatsapp:")
  const telephone = from.replace("whatsapp:", "");

  const supabase = await createClient();

  // Trouver le prospect par téléphone
  const { data: prospect } = await supabase
    .from("prospects")
    .select("id, statut")
    .eq("telephone", telephone)
    .single();

  if (prospect) {
    // Enregistrer le message entrant
    await supabase.from("conversations").insert({
      prospect_id: prospect.id,
      message: body,
      direction: "entrant",
      timestamp: new Date().toISOString(),
    });

    // Mettre à jour le statut si le prospect était "envoye"
    if (prospect.statut === "envoye") {
      await supabase
        .from("prospects")
        .update({ statut: "repondu" })
        .eq("id", prospect.id);
    }
  }

  // Réponse TwiML vide (pas de réponse automatique ici, c'est n8n qui gère)
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, {
    headers: { "Content-Type": "text/xml" },
  });
}
