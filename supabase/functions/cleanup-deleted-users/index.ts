import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Authenticate with secret token
  const authHeader = req.headers.get("authorization");
  const secretToken = Deno.env.get("CLEANUP_SECRET_TOKEN");
  if (!authHeader || authHeader !== `Bearer ${secretToken}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
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

    const userIds = usersToDelete.map((u: any) => u.id);

    // Delete from auth (cascades to profiles and related data)
    let deletedCount = 0;
    for (const userId of userIds) {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (!error) deletedCount++;
    }

    return new Response(
      JSON.stringify({ message: `Deleted ${deletedCount} users`, count: deletedCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
