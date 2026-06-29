import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    // 1. Fetch unpaid invoices that are due soon, due today, or overdue
    const { data: invoices, error: fetchError } = await supabase
      .from("invoices")
      .select(`
        *,
        tenants:tenant_id(
          first_name,
          email,
          profile_id,
          units:unit_id(unit_number)
        )
      `)
      .eq("status", "unpaid");

    if (fetchError) throw fetchError;

    let remindersSent = 0;
    const today = new Date();

    for (const invoice of invoices) {
      const dueDate = new Date(invoice.due_date);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let reminderType = "";
      let message = "";

      if (diffDays === 3) {
        reminderType = "due_soon";
        message = `Friendly reminder: Rent for unit ${invoice.tenants?.units?.unit_number} of KES ${invoice.amount} is due in 3 days.`;
      } else if (diffDays === 0) {
        reminderType = "due_today";
        message = `Rent for unit ${invoice.tenants?.units?.unit_number} is due today (KES ${invoice.amount}).`;
      } else if (diffDays === -1) {
        reminderType = "overdue";
        message = `Your rent for unit ${invoice.tenants?.units?.unit_number} is now overdue. Please clear KES ${invoice.amount} to avoid penalties.`;
      }

      if (reminderType !== "") {
        // Send Email
        if (invoice.tenants?.email) {
          await fetch(`${supabaseUrl}/functions/v1/send-email`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseServiceKey}` },
              body: JSON.stringify({
                  to: invoice.tenants.email,
                  subject: `Rent Reminder: ${reminderType.replace('_', ' ').toUpperCase()}`,
                  body: message
              })
          });
        }
        
        // Send Push
        if (invoice.tenants?.profile_id) {
           await fetch(`${supabaseUrl}/functions/v1/send-push`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseServiceKey}` },
              body: JSON.stringify({
                  userId: invoice.tenants.profile_id,
                  title: "Rent Reminder",
                  body: message
              })
          });
        }
        
        remindersSent++;
      }
    }

    return new Response(JSON.stringify({ success: true, remindersSent }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error running rent reminders:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
