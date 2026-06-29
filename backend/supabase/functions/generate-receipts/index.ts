import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { PDFDocument, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { paymentId } = await req.json();
    if (!paymentId) throw new Error("paymentId is required");

    // Fetch payment details
    const { data: payment, error: fetchError } = await supabase
      .from("payments")
      .select(`
        *,
        tenants:tenant_id(
          first_name,
          last_name,
          units:unit_id(
            unit_number,
            properties:property_id(
              name,
              landlords:landlord_id(
                company_name
              )
            )
          )
        )
      `)
      .eq("id", paymentId)
      .single();

    if (fetchError || !payment) throw new Error("Payment not found");

    const tenantName = `${payment.tenants.first_name} ${payment.tenants.last_name}`;
    const unitNumber = payment.tenants.units?.unit_number || "N/A";
    const propertyName = payment.tenants.units?.properties?.name || "N/A";
    const landlordName = payment.tenants.units?.properties?.landlords?.company_name || "EstateTrack";

    // Generate PDF Receipt
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    
    page.drawText(`${landlordName} - Payment Receipt`, { x: 50, y: 350, size: 20 });
    page.drawText(`Receipt No: ${payment.reference_no}`, { x: 50, y: 320, size: 12 });
    page.drawText(`Date: ${new Date(payment.payment_date).toLocaleDateString()}`, { x: 50, y: 300, size: 12 });
    
    page.drawText(`Received From: ${tenantName}`, { x: 50, y: 260, size: 14 });
    page.drawText(`Property: ${propertyName}, Unit ${unitNumber}`, { x: 50, y: 240, size: 12 });
    
    page.drawText(`Amount Paid: KES ${payment.amount}`, { x: 50, y: 200, size: 16 });
    page.drawText(`Payment Method: ${payment.method}`, { x: 50, y: 170, size: 12 });
    page.drawText(`Status: Success`, { x: 50, y: 150, size: 12 });

    const pdfBytes = await pdfDoc.save();

    // Upload to Supabase Storage
    const fileName = `${payment.tenant_id}/${payment.id}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(fileName, pdfBytes, {
        contentType: "application/pdf",
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("receipts")
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;

    // Update payment record with receipt URL
    await supabase
      .from("payments")
      .update({ receipt_url: publicUrl })
      .eq("id", paymentId);

    // Call send-email edge function to deliver receipt
    // (This calls the next step in the pipeline)

    return new Response(JSON.stringify({ success: true, url: publicUrl }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error generating receipt:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
