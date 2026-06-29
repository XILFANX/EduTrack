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
    // Only allow cron to trigger this, or trigger manually from UI
    // In pg_cron, we do an HTTP POST to this endpoint

    const today = new Date();
    
    // Find leases expiring in 30, 14, 7 days
    // This requires a `leases` table or checking `units.lease_end_date` if they have one.
    // Assuming `tenants` table has `lease_end`
    const { data: tenants, error: tenantsError } = await supabase
      .from("tenants")
      .select(`
        *,
        units:unit_id(
          unit_number,
          properties:property_id(
            name,
            landlord_id
          )
        )
      `)
      .in("status", ["active"]);

    if (tenantsError) throw tenantsError;

    let alertCount = 0;

    for (const tenant of tenants) {
      if (!tenant.lease_end) continue;
      
      const leaseEnd = new Date(tenant.lease_end);
      const diffTime = Math.abs(leaseEnd.getTime() - today.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if ([30, 14, 7].includes(diffDays)) {
        // Create an alert in the database for the landlord/manager
        const landlordId = tenant.units?.properties?.landlord_id;
        if (!landlordId) continue;

        // In a full implementation, you would dispatch a Push/Email to the Landlord
        console.log(`Lease for tenant ${tenant.first_name} in unit ${tenant.units?.unit_number} expires in ${diffDays} days.`);
        
        // Example: Call send-push or send-email
        await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({
                to: "landlord@example.com", // Fetch actual landlord email
                subject: "Lease Expiry Alert",
                body: `Lease for unit ${tenant.units?.unit_number} expires in ${diffDays} days.`
            })
        });

        alertCount++;
      }
    }

    return new Response(JSON.stringify({ success: true, alertsSent: alertCount }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Lease expiry alert error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
