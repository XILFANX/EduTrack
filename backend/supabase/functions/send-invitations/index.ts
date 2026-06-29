import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const whatsappToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { invitationId } = await req.json();
    if (!invitationId) throw new Error("invitationId is required");

    const { data: invitation, error: fetchError } = await supabase
      .from("invitations")
      .select("*")
      .eq("id", invitationId)
      .single();

    if (fetchError || !invitation) throw new Error("Invitation not found");

    const inviteLink = `https://estatetrack.com/invite/${invitation.token}`;
    const messageBody = `Hello! You have been invited to join EstateTrack. Click here to accept your invitation: ${inviteLink}`;

    // Send via Email
    if (invitation.email) {
      await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({
            to: invitation.email,
            subject: "You're invited to EstateTrack!",
            body: messageBody
        })
      });
    }

    // Send via WhatsApp if phone exists
    if (invitation.phone) {
        // Implement Meta Cloud API logic here
        // Example:
        // await fetch('https://graph.facebook.com/v17.0/.../messages', { ... })
        console.log(`Sending WhatsApp invite to ${invitation.phone}: ${inviteLink}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error sending invitation:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
