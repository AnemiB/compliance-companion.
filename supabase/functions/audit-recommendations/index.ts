import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { companies } = await req.json();
    if (!Array.isArray(companies)) {
      return new Response(JSON.stringify({ error: "companies must be an array" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const summary = companies.slice(0, 50).map((c: any) =>
      `- ${c.name} | type:${c.companyType} | owner:${c.ownerType} | ${c.province} | ${c.industry} | employees:${c.employeeCount} | complianceScore:${c.complianceScore}${c.lastInspectionDate ? ` | lastInspected:${c.lastInspectionDate}` : ' | NEVER inspected'}`
    ).join("\n");

    const systemPrompt = `You are a senior labour-compliance inspector advisor for the South African Department of Labour. Given a list of registered companies with their compliance metrics, recommend which companies should be prioritised for audit. Consider: low complianceScore (high risk), high-risk industries (mining, construction, agriculture, manufacturing), companies never inspected, large employee counts, and patterns across owner/company types.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Companies:\n${summary}\n\nReturn the top 5 audit priorities.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "audit_recommendations",
            description: "Return prioritised audit recommendations.",
            parameters: {
              type: "object",
              properties: {
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      companyName: { type: "string" },
                      priority: { type: "string", enum: ["critical", "high", "medium"] },
                      reason: { type: "string" },
                      focusAreas: { type: "array", items: { type: "string" } },
                    },
                    required: ["companyName", "priority", "reason", "focusAreas"],
                  },
                },
                overview: { type: "string", description: "1-2 sentence summary of overall risk landscape." },
              },
              required: ["recommendations", "overview"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "audit_recommendations" } },
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in workspace settings." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall ? JSON.parse(toolCall.function.arguments) : { recommendations: [], overview: "No recommendations." };

    return new Response(JSON.stringify(args), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("audit-recommendations error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
