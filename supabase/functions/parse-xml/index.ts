import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ParseXmlPayload {
  clientId: string;
  filename: string;
  content: string;
  encoding?: "base64" | "utf-8";
}

function decodeContent(payload: ParseXmlPayload): string {
  if (payload.encoding === "base64") {
    return atob(payload.content);
  }
  return payload.content;
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

  let payload: ParseXmlPayload;

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

  if (!payload.clientId || !payload.filename || !payload.content) {
    return new Response(
      JSON.stringify({
        error: "Missing required fields: clientId, filename, content.",
      }),
      {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const xmlString = decodeContent(payload);

  console.log(
    "Received XML payload",
    JSON.stringify({
      clientId: payload.clientId,
      filename: payload.filename,
      size: xmlString.length,
    }),
  );

  // TODO: Persist raw file to Supabase Storage (bucket scoped per clientId).
  // TODO: Parse XML into normalized invoice entities and insert via supabase client.

  return new Response(
    JSON.stringify({
      status: "accepted",
      message: "XML payload received. Parsing pipeline not yet implemented.",
      summary: {
        clientId: payload.clientId,
        filename: payload.filename,
        charactersProcessed: xmlString.length,
      },
    }),
    {
      status: 202,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
