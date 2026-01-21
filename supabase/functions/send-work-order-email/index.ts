import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WorkOrderEmailRequest {
  type: "new" | "approved" | "completed" | "signed_off" | "quote_provided" | "quote_approved" | "quote_rejected" | "comment";
  work_order_id: string;
  title: string;
  description: string;
  location: string;
  priority: string;
  tenant_email?: string;
  tenant_name?: string;
  assigned_to?: string;
  completion_notes?: string;
  rating?: number;
  feedback?: string;
  // Quote fields
  quoted_amount?: number;
  quote_notes?: string;
  quote_rejection_reason?: string;
  // Comment fields
  comment_text?: string;
  commenter_name?: string;
  commenter_role?: string;
}

const PORTAL_URL = Deno.env.get("PORTAL_URL") || "https://building-hub-connect.lovable.app";

const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case "urgent":
    case "emergency":
      return "#dc2626";
    case "high":
      return "#ea580c";
    case "medium":
      return "#ca8a04";
    default:
      return "#16a34a";
  }
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const getEmailTemplate = (data: WorkOrderEmailRequest): { subject: string; html: string } => {
  const priorityColor = getPriorityColor(data.priority);
  const workOrderLink = `${PORTAL_URL}/work-orders/${data.work_order_id}`;

  switch (data.type) {
    case "new":
      return {
        subject: `New Maintenance Request: ${data.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e3a5f;">New Maintenance Request Submitted</h2>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
              <p><strong>Title:</strong> ${data.title}</p>
              <p><strong>Priority:</strong> <span style="color: ${priorityColor}; font-weight: bold;">${data.priority.toUpperCase()}</span></p>
              <p><strong>Location:</strong> ${data.location}</p>
              <p><strong>Description:</strong></p>
              <p style="background-color: white; padding: 15px; border-radius: 4px;">${data.description}</p>
              <p><strong>Submitted by:</strong> ${data.tenant_name || "Unknown"} (${data.tenant_email || "No email"})</p>
            </div>
            <p style="margin-top: 20px;">
              <a href="${workOrderLink}" style="background-color: #1e3a5f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Work Order in Portal
              </a>
            </p>
          </div>
        `,
      };

    case "approved":
      return {
        subject: `Work Order Approved: ${data.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">Your Maintenance Request Has Been Approved</h2>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
              <p><strong>Title:</strong> ${data.title}</p>
              <p><strong>Location:</strong> ${data.location}</p>
              <p><strong>Status:</strong> <span style="color: #16a34a; font-weight: bold;">APPROVED</span></p>
              ${data.assigned_to ? `<p><strong>Assigned to:</strong> ${data.assigned_to}</p>` : ""}
              <p>Our maintenance team will begin work on your request soon. You will receive another notification when work begins.</p>
            </div>
            <p style="margin-top: 20px;">
              <a href="${workOrderLink}" style="background-color: #1e3a5f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Work Order Status
              </a>
            </p>
          </div>
        `,
      };

    case "quote_provided":
      return {
        subject: `Quote Ready for Approval: ${data.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ea580c;">Quote Ready for Your Approval</h2>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
              <p><strong>Title:</strong> ${data.title}</p>
              <p><strong>Location:</strong> ${data.location}</p>
              <div style="background-color: #fff7ed; border: 2px solid #ea580c; padding: 20px; border-radius: 8px; margin: 15px 0;">
                <p style="font-size: 24px; font-weight: bold; color: #ea580c; margin: 0;">
                  ${data.quoted_amount ? formatCurrency(data.quoted_amount) : 'Quote pending'}
                </p>
                <p style="color: #9a3412; margin-top: 5px;">Quoted Amount</p>
              </div>
              ${data.quote_notes ? `
                <p><strong>Work Details:</strong></p>
                <p style="background-color: white; padding: 15px; border-radius: 4px;">${data.quote_notes}</p>
              ` : ""}
              <p style="margin-top: 15px; padding: 15px; background-color: #fef3c7; border-radius: 4px;">
                <strong>Action Required:</strong> Please review this quote and approve or reject it to proceed.
              </p>
            </div>
            <p style="margin-top: 20px;">
              <a href="${workOrderLink}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">
                Review & Approve Quote
              </a>
            </p>
          </div>
        `,
      };

    case "quote_approved":
      return {
        subject: `Quote Approved: ${data.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">Quote Has Been Approved</h2>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
              <p><strong>Title:</strong> ${data.title}</p>
              <p><strong>Location:</strong> ${data.location}</p>
              <p><strong>Status:</strong> <span style="color: #16a34a; font-weight: bold;">QUOTE APPROVED</span></p>
              ${data.quoted_amount ? `<p><strong>Approved Amount:</strong> ${formatCurrency(data.quoted_amount)}</p>` : ""}
              <p><strong>Approved by:</strong> ${data.tenant_name || "Tenant"}</p>
              <p style="margin-top: 15px; padding: 15px; background-color: #dcfce7; border-radius: 4px;">
                The tenant has approved this quote. Work can now proceed.
              </p>
            </div>
            <p style="margin-top: 20px;">
              <a href="${workOrderLink}" style="background-color: #1e3a5f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Work Order Details
              </a>
            </p>
          </div>
        `,
      };

    case "quote_rejected":
      return {
        subject: `Quote Rejected: ${data.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Quote Has Been Rejected</h2>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
              <p><strong>Title:</strong> ${data.title}</p>
              <p><strong>Location:</strong> ${data.location}</p>
              <p><strong>Status:</strong> <span style="color: #dc2626; font-weight: bold;">QUOTE REJECTED</span></p>
              ${data.quoted_amount ? `<p><strong>Quoted Amount:</strong> ${formatCurrency(data.quoted_amount)}</p>` : ""}
              <p><strong>Rejected by:</strong> ${data.tenant_name || "Tenant"}</p>
              ${data.quote_rejection_reason ? `
                <p><strong>Rejection Reason:</strong></p>
                <p style="background-color: white; padding: 15px; border-radius: 4px;">${data.quote_rejection_reason}</p>
              ` : ""}
            </div>
            <p style="margin-top: 20px;">
              <a href="${workOrderLink}" style="background-color: #1e3a5f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Work Order Details
              </a>
            </p>
          </div>
        `,
      };

    case "completed":
      return {
        subject: `Work Completed - Please Review: ${data.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Your Maintenance Request Has Been Completed</h2>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
              <p><strong>Title:</strong> ${data.title}</p>
              <p><strong>Location:</strong> ${data.location}</p>
              <p><strong>Status:</strong> <span style="color: #2563eb; font-weight: bold;">COMPLETED</span></p>
              ${data.completion_notes ? `
                <p><strong>Completion Notes:</strong></p>
                <p style="background-color: white; padding: 15px; border-radius: 4px;">${data.completion_notes}</p>
              ` : ""}
              <p style="margin-top: 15px; padding: 15px; background-color: #fef3c7; border-radius: 4px;">
                <strong>Action Required:</strong> Please review the completed work and sign off to close this work order.
              </p>
            </div>
            <p style="margin-top: 20px;">
              <a href="${workOrderLink}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Review and Sign Off
              </a>
            </p>
          </div>
        `,
      };

    case "signed_off":
      return {
        subject: `Work Order Signed Off: ${data.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">Work Order Signed Off by Tenant</h2>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
              <p><strong>Title:</strong> ${data.title}</p>
              <p><strong>Location:</strong> ${data.location}</p>
              <p><strong>Status:</strong> <span style="color: #7c3aed; font-weight: bold;">SIGNED OFF</span></p>
              ${data.rating ? `<p><strong>Rating:</strong> ${"⭐".repeat(data.rating)} (${data.rating}/5)</p>` : ""}
              ${data.feedback ? `
                <p><strong>Tenant Feedback:</strong></p>
                <p style="background-color: white; padding: 15px; border-radius: 4px;">${data.feedback}</p>
              ` : ""}
              <p><strong>Signed off by:</strong> ${data.tenant_name || "Tenant"}</p>
            </div>
            <p style="margin-top: 20px;">
              <a href="${workOrderLink}" style="background-color: #1e3a5f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Work Order Details
              </a>
            </p>
          </div>
        `,
      };

    case "comment":
      return {
        subject: `New Comment on Work Order: ${data.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e3a5f;">New Comment on Your Maintenance Request</h2>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
              <p><strong>Work Order:</strong> ${data.title}</p>
              <p><strong>Location:</strong> ${data.location}</p>
              <p><strong>Comment from:</strong> ${data.commenter_name || "Staff"} (${data.commenter_role || "Maintenance"})</p>
              <div style="background-color: white; padding: 15px; border-radius: 4px; border-left: 4px solid #1e3a5f; margin-top: 10px;">
                <p style="margin: 0;">${data.comment_text}</p>
              </div>
            </div>
            <p style="margin-top: 20px;">
              <a href="${workOrderLink}" style="background-color: #1e3a5f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View & Reply
              </a>
            </p>
          </div>
        `,
      };

    default:
      throw new Error(`Unknown email type: ${data.type}`);
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: WorkOrderEmailRequest = await req.json();
    console.log("Received email request:", JSON.stringify(data, null, 2));

    const maintenanceEmail = Deno.env.get("MAINTENANCE_EMAIL") || "maintenance@thetkfund.com";
    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "sam@thetkfund.com";

    const { subject, html } = getEmailTemplate(data);

    const recipients: string[] = [];
    const ccRecipients: string[] = [];

    switch (data.type) {
      case "new":
        // New work orders go to maintenance, CC tenant
        recipients.push(maintenanceEmail);
        if (data.tenant_email) {
          ccRecipients.push(data.tenant_email);
        }
        break;
      case "quote_provided":
      case "approved":
      case "completed":
        // Status updates go to tenant
        if (data.tenant_email) {
          recipients.push(data.tenant_email);
        }
        break;
      case "quote_approved":
      case "quote_rejected":
      case "signed_off":
        // Quote/sign off notifications go to maintenance
        recipients.push(maintenanceEmail);
        break;
      case "comment":
        // Comments: if staff comments, notify tenant; if tenant comments, notify maintenance
        if (data.commenter_role === 'admin' || data.commenter_role === 'maintenance') {
          if (data.tenant_email) {
            recipients.push(data.tenant_email);
          }
        } else {
          recipients.push(maintenanceEmail);
        }
        break;
    }

    if (recipients.length === 0) {
      console.log("No recipients found for email type:", data.type);
      return new Response(
        JSON.stringify({ success: true, message: "No recipients to notify" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Sending email to ${recipients.join(", ")}${ccRecipients.length > 0 ? ` (CC: ${ccRecipients.join(", ")})` : ""}: ${subject}`);

    const emailPayload: any = {
      from: "TenantPortal <onboarding@resend.dev>",
      to: recipients,
      subject,
      html,
    };

    if (ccRecipients.length > 0) {
      emailPayload.cc = ccRecipients;
    }

    const emailResponse = await resend.emails.send(emailPayload);

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-work-order-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);