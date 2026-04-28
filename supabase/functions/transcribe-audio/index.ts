// Transcribe audio using Lovable AI Gateway (Gemini supports audio input)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { audioBase64, mimeType } = await req.json();
    if (!audioBase64) throw new Error("audioBase64 required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not set");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Transcribe this audio recording from a labour inspection audit verbatim. Return only the transcript text, no commentary." },
              { type: "input_audio", input_audio: { data: audioBase64, format: (mimeType || "audio/webm").includes("mp3") ? "mp3" : "webm" } },
            ],
          },
        ],
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error("AI gateway error", resp.status, err);
      // Fallback: return empty transcript so recording still saves
      return new Response(JSON.stringify({ transcript: "", error: err }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const transcript = data?.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ transcript }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("transcribe-audio error", e);
    return new Response(JSON.stringify({ error: String(e), transcript: "" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
