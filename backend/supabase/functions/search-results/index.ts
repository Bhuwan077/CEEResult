// ====================================================================
// Supabase Edge Function: search-results
// Runtime: Deno / Supabase Edge Runtime
// Purpose: Serverless, low-latency, edge-cached CEE result lookup
// ====================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    let symbolNumber = "";
    let examinationId: string | null = null;

    if (req.method === "POST") {
      const body = await req.json();
      symbolNumber = (body.symbol_number ?? "").toString().trim();
      examinationId = body.examination_id ?? null;
    } else {
      const url = new URL(req.url);
      symbolNumber = (url.searchParams.get("symbol_number") ?? "").trim();
      examinationId = url.searchParams.get("examination_id");
    }

    if (!symbolNumber) {
      return new Response(
        JSON.stringify({
          success: false,
          found: false,
          message: "Symbol number is required.",
          results: [],
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Call stored procedure search_student_result
    const { data, error } = await supabase.rpc("search_student_result", {
      p_symbol_number: symbolNumber,
      p_examination_id: examinationId,
    });

    if (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          results: [],
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const found = Array.isArray(data) && data.length > 0;
    return new Response(
      JSON.stringify({
        success: true,
        found,
        query_symbol: symbolNumber,
        message: found
          ? `Found ${data.length} result(s) for symbol number '${symbolNumber}'.`
          : `No published result found for symbol number '${symbolNumber}'.`,
        results: data ?? [],
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60, s-maxage=300",
        },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
