import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM || "OptimaVia <onboarding@resend.dev>";

type SendResult = { ok: boolean; error?: string };

async function send(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendResult> {
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Unknown error" };
  }
}

// ── Templates ─────────────────────────────────────────────────────────────

function baseTemplate(body: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
        <tr><td align="center">
          <table width="100%" style="max-width:480px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
            <tr>
              <td style="background:#1e3a5f;padding:20px 28px">
                <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700">OptimaVia</p>
                <p style="margin:2px 0 0;color:#94b8d8;font-size:12px">Making Work Seamless.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e2e8f0">
                <p style="margin:0;color:#94a3b8;font-size:11px">© 2026 OptimaVia. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;
}

// ── Exported senders ──────────────────────────────────────────────────────

export async function sendWelcomeEmail(opts: {
  to: string;
  employeeName: string;
  businessName: string;
  loginHandle: string;
  password: string;
}): Promise<SendResult> {
  const html = baseTemplate(`
    <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#0f172a">
      Welcome to ${escHtml(opts.businessName)}!
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6">
      Hi ${escHtml(opts.employeeName)}, your work account has been created.
      Here's everything you need to sign in.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#f1f5f9;border-radius:8px;padding:20px;margin-bottom:20px">
      <tr>
        <td style="padding:8px 0">
          <p style="margin:0;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Login</p>
          <p style="margin:4px 0 0;font-size:14px;font-family:monospace;color:#0f172a;font-weight:600">${escHtml(opts.loginHandle)}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-top:1px solid #e2e8f0">
          <p style="margin:0;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Password</p>
          <p style="margin:4px 0 0;font-size:14px;font-family:monospace;color:#0f172a;font-weight:600">${escHtml(opts.password)}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:13px;color:#64748b;line-height:1.6">
      Sign in at your manager's OptimaVia link and use the login and password above.
    </p>
    <p style="margin:0;font-size:13px;color:#94a3b8">
      If you didn't expect this email, please ignore it.
    </p>
  `);

  return send({ to: opts.to, subject: `Your ${opts.businessName} work account is ready`, html });
}

export async function sendPasswordResetEmail(opts: {
  to: string;
  employeeName: string;
  businessName: string;
  loginHandle: string;
  newPassword: string;
}): Promise<SendResult> {
  const html = baseTemplate(`
    <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#0f172a">
      Password Reset
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6">
      Hi ${escHtml(opts.employeeName)}, your password for ${escHtml(opts.businessName)} has been reset by your manager.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#f1f5f9;border-radius:8px;padding:20px;margin-bottom:20px">
      <tr>
        <td style="padding:8px 0">
          <p style="margin:0;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Login</p>
          <p style="margin:4px 0 0;font-size:14px;font-family:monospace;color:#0f172a;font-weight:600">${escHtml(opts.loginHandle)}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-top:1px solid #e2e8f0">
          <p style="margin:0;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.05em">New Password</p>
          <p style="margin:4px 0 0;font-size:14px;font-family:monospace;color:#0f172a;font-weight:600">${escHtml(opts.newPassword)}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#94a3b8">
      If you didn't expect this, please contact your manager.
    </p>
  `);

  return send({ to: opts.to, subject: `Your ${opts.businessName} password has been reset`, html });
}

export async function sendEmployerWelcomeEmail(opts: {
  to: string;
  name: string;
  businessName: string;
}): Promise<SendResult> {
  const html = baseTemplate(`
    <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#0f172a">
      Welcome to OptimaVia!
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6">
      Hi ${escHtml(opts.name)}, your OptimaVia account for <strong>${escHtml(opts.businessName)}</strong> is all set up and ready to go.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#f1f5f9;border-radius:8px;padding:20px;margin-bottom:20px">
      <tr>
        <td style="padding:8px 0">
          <p style="margin:0;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.05em">What you can do</p>
          <ul style="margin:8px 0 0;padding-left:20px;color:#475569;font-size:14px;line-height:1.8">
            <li>Dispatch jobs to your team</li>
            <li>Track job status and photos in real time</li>
            <li>Manage employees and their access</li>
            <li>Log revenue and expenses</li>
          </ul>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:13px;color:#64748b;line-height:1.6">
      Sign in anytime at your OptimaVia link to manage your operations.
    </p>
    <p style="margin:0;font-size:13px;color:#94a3b8">
      — The OptimaVia Team
    </p>
  `);

  return send({ to: opts.to, subject: `Welcome to OptimaVia — ${opts.businessName} is ready!`, html });
}

export async function sendJobAssignmentEmail(opts: {
  to: string;
  employeeName: string;
  businessName: string;
  clientName: string;
  serviceAddress: string;
  scheduledDate: string;
  scheduledTime?: string | null;
  notes?: string | null;
}): Promise<SendResult> {
  const when = opts.scheduledTime
    ? `${opts.scheduledDate} at ${opts.scheduledTime}`
    : opts.scheduledDate;

  const html = baseTemplate(`
    <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#0f172a">
      New Job Assigned
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6">
      Hi ${escHtml(opts.employeeName)}, you've been assigned a job by ${escHtml(opts.businessName)}.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#f1f5f9;border-radius:8px;padding:20px;margin-bottom:20px">
      <tr>
        <td style="padding:8px 0">
          <p style="margin:0;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Client</p>
          <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#0f172a">${escHtml(opts.clientName)}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-top:1px solid #e2e8f0">
          <p style="margin:0;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Address</p>
          <p style="margin:4px 0 0;font-size:14px;color:#0f172a">${escHtml(opts.serviceAddress)}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-top:1px solid #e2e8f0">
          <p style="margin:0;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Scheduled</p>
          <p style="margin:4px 0 0;font-size:14px;color:#0f172a">${escHtml(when)}</p>
        </td>
      </tr>
      ${opts.notes ? `
      <tr>
        <td style="padding:8px 0;border-top:1px solid #e2e8f0">
          <p style="margin:0;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Notes</p>
          <p style="margin:4px 0 0;font-size:14px;color:#475569">${escHtml(opts.notes)}</p>
        </td>
      </tr>` : ""}
    </table>
    <p style="margin:0;font-size:13px;color:#94a3b8">
      Log in to OptimaVia to view and manage your job.
    </p>
  `);

  return send({ to: opts.to, subject: `New job assigned: ${opts.clientName}`, html });
}

function escHtml(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
