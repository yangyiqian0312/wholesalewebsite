import { Resend } from "resend";
import { config } from "../../config.js";

type DeniedApplicationEmailInput = {
  to: string;
  contactName: string;
  businessName: string;
  deniedReason: string;
  resubmissionLink: string;
};

type ApprovedApplicationEmailInput = {
  to: string;
  contactName: string;
  businessName: string;
  registrationLink: string;
};

type ApprovedOrderEmailInput = {
  to: string;
  contactName: string;
  businessName: string;
  orderReference: string;
  orderLink: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildDeniedApplicationEmailHtml(input: DeniedApplicationEmailInput) {
  return `
    <div style="font-family:Arial,sans-serif;color:#1f2937;line-height:1.6;">
      <p>Hello ${escapeHtml(input.contactName)},</p>
      <p>
        Thank you for applying for a wholesale account for
        <strong>${escapeHtml(input.businessName)}</strong>.
      </p>
      <p>
        We reviewed your application and it is not approved yet for the following reason:
      </p>
      <div style="padding:12px 14px;border-radius:10px;background:#fef3f2;border:1px solid #fecaca;">
        ${escapeHtml(input.deniedReason)}
      </div>
      <p style="margin-top:16px;">
        You can update your previous application and resubmit it using this link:
      </p>
      <p>
        <a href="${input.resubmissionLink}" style="color:#1e4e8c;font-weight:700;">
          Continue editing your application
        </a>
      </p>
      <p>
        If you believe this was a mistake, please reply to this email or contact our team.
      </p>
    </div>
  `.trim();
}

function buildApprovedApplicationEmailHtml(input: ApprovedApplicationEmailInput) {
  return `
    <div style="font-family:Arial,sans-serif;color:#1f2937;line-height:1.6;">
      <p>Hello ${escapeHtml(input.contactName)},</p>
      <p>
        Your wholesale account application for
        <strong>${escapeHtml(input.businessName)}</strong> has been approved.
      </p>
      <p>
        Use the secure link below to create your account with the same email address you used on
        the application:
      </p>
      <p>
        <a href="${input.registrationLink}" style="color:#1e4e8c;font-weight:700;">
          Create your wholesale account
        </a>
      </p>
      <p>
        For security, only the approved application email can be used for registration.
      </p>
    </div>
  `.trim();
}

function buildApprovedOrderEmailHtml(input: ApprovedOrderEmailInput) {
  return `
    <div style="font-family:Arial,sans-serif;color:#1f2937;line-height:1.6;">
      <p>Hello ${escapeHtml(input.contactName)},</p>
      <p>
        Your wholesale order for <strong>${escapeHtml(input.businessName)}</strong> has been reviewed and approved.
      </p>
      <p>
        Order reference: <strong>${escapeHtml(input.orderReference)}</strong>
      </p>
      <p>
        You can now review the approved order and continue to payment from your account:
      </p>
      <p>
        <a href="${input.orderLink}" style="color:#1e4e8c;font-weight:700;">
          View your approved order
        </a>
      </p>
      <p>
        If anything looks incorrect, please reply to this email before sending payment.
      </p>
    </div>
  `.trim();
}

export async function sendDeniedApplicationEmail(input: DeniedApplicationEmailInput) {
  if (!config.RESEND_API_KEY || !config.RESEND_FROM_EMAIL) {
    return {
      sent: false,
      reason: "Email provider is not configured",
    } as const;
  }

  const resend = new Resend(config.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: config.RESEND_FROM_EMAIL,
    to: [input.to],
    subject: "Your wholesale account application needs updates",
    html: buildDeniedApplicationEmailHtml(input),
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    sent: true,
  } as const;
}

export async function sendApprovedApplicationEmail(input: ApprovedApplicationEmailInput) {
  if (!config.RESEND_API_KEY || !config.RESEND_FROM_EMAIL) {
    return {
      sent: false,
      reason: "Email provider is not configured",
    } as const;
  }

  const resend = new Resend(config.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: config.RESEND_FROM_EMAIL,
    to: [input.to],
    subject: "Your wholesale account has been approved",
    html: buildApprovedApplicationEmailHtml(input),
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    sent: true,
  } as const;
}

export async function sendApprovedOrderEmail(input: ApprovedOrderEmailInput) {
  if (!config.RESEND_API_KEY || !config.RESEND_FROM_EMAIL) {
    return {
      sent: false,
      reason: "Email provider is not configured",
    } as const;
  }

  const resend = new Resend(config.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: config.RESEND_FROM_EMAIL,
    to: [input.to],
    subject: "Your wholesale order is ready for payment",
    html: buildApprovedOrderEmailHtml(input),
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    sent: true,
  } as const;
}
