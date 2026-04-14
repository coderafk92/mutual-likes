import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limit (resets on cold start, but sufficient for scheduled jobs)
let lastRunTimestamp = 0;
const RATE_LIMIT_MS = 60 * 60 * 1000; // 1 hour

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Rate limiting
  const now = Date.now();
  if (now - lastRunTimestamp < RATE_LIMIT_MS) {
    return new Response(JSON.stringify({ error: "Rate limited. Try again later." }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Authenticate with secret token
  const authHeader = req.headers.get("authorization");
  const secretToken = Deno.env.get("CLEANUP_SECRET_TOKEN");
  
  if (!secretToken || secretToken.length < 32) {
    console.error("CLEANUP_SECRET_TOKEN is not configured or too short");
    return new Response(JSON.stringify({ error: "Server misconfiguration" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!authHeader || authHeader !== `Bearer ${secretToken}`) {
    // Log failed auth attempt
    console.warn(`Unauthorized cleanup attempt from ${req.headers.get("x-forwarded-for") || "unknown"}`);
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    lastRunTimestamp = now;
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Find users past their scheduled deletion date
    const { data: usersToDelete, error: fetchError } = await supabase
      .from("profiles")
      .select("id")
      .eq("status", "pending_deletion")
      .lte("scheduled_deletion_date", new Date().toISOString());

    if (fetchError) throw fetchError;

    if (!usersToDelete || usersToDelete.length === 0) {
      return new Response(
        JSON.stringify({ message: "No users to delete", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userIds = usersToDelete.map((u: { id: string }) => u.id);
    
    // Cap batch size to prevent abuse
    const batchIds = userIds.slice(0, 50);

    // Delete from auth (cascades to profiles and related data)
    let deletedCount = 0;
    for (const userId of batchIds) {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (!error) deletedCount++;
      else console.error(`Failed to delete user ${userId}`);
    }

    console.log(`Cleanup completed: deleted ${deletedCount}/${batchIds.length} users`);

    return new Response(
      JSON.stringify({ message: `Deleted ${deletedCount} users`, count: deletedCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Cleanup error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
