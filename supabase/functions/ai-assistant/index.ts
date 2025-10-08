import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AssistantPayload {
  clientId: string;
  question: string;
  context?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Only POST requests are supported." }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  let payload: AssistantPayload;

  try {
    payload = await req.json();
  } catch (error) {
    console.error("Invalid JSON payload", error);
    return new Response(
      JSON.stringify({ error: "Invalid JSON payload." }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  if (!payload.clientId || !payload.question) {
    return new Response(
      JSON.stringify({
        error: "Missing required fields: clientId, question.",
      }),
      {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  console.log(
    "Assistant question received",
    JSON.stringify({
      clientId: payload.clientId,
      questionPreview: payload.question.slice(0, 120),
    }),
  );

  // TODO: Fetch contextual documents scoped by clientId from Supabase.
  // TODO: Invoke OpenAI Agents SDK with retrieved knowledge.
  // TODO: Stream or return structured answers to the client.

  return new Response(
    JSON.stringify({
      status: "accepted",
      message: "Assistant pipeline not yet implemented.",
      echo: {
        clientId: payload.clientId,
        question: payload.question,
      },
    }),
    {
      status: 202,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
