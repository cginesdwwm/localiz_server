// ======================================================================
// Email helpers for Localiz
// - Transport setup (Nodemailer)
// - Branding (logo resolution with safe formats)
// - Shared HTML template (buildEmailTemplate)
// - Transactional email senders (signup, reset, contact, etc.)
// ======================================================================

import nodemailer from "nodemailer";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

// ----------------------------------------------------------------------
// Transporter configuration (Gmail)
// NOTE: Set EMAIL_USER and EMAIL_PASS in environment variables.
// ----------------------------------------------------------------------
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn(
    "Warning: EMAIL_USER or EMAIL_PASS is not set — emails will likely fail to send."
  );
}

// ----------------------------------------------------------------------
// Branding / logo resolution
// - Prefer PNG/JPG over WEBP to avoid transparency issues in email clients
// - Can be disabled globally via EMAIL_DISABLE_LOGO=true
// - Uses EMAIL_LOGO_URL or PUBLIC_LOGO_URL if provided
// ----------------------------------------------------------------------
// Resolve a logo image compatible with email clients (prefer PNG/JPG over WEBP)
// We'll attach it inline (CID) if a local file exists and no EMAIL_LOGO_URL is set.
// Note: some email clients (notably Outlook) render transparency poorly; prefer a flat PNG/JPG for emails.
const candidateLogos = [
  path.join(process.cwd(), "client", "public", "logo-email.png"),
  path.join(process.cwd(), "client", "public", "logo.png"),
  path.join(process.cwd(), "client", "public", "logo.jpg"),
  path.join(
    process.cwd(),
    "client",
    "src",
    "assets",
    "images",
    "logo-email.png"
  ),
  path.join(process.cwd(), "client", "src", "assets", "images", "logo.png"),
  path.join(process.cwd(), "client", "src", "assets", "images", "logo.jpg"),
  // Avoid WEBP for emails: many clients mishandle it, especially with transparency
];
const resolvedLocalLogoPath = candidateLogos.find((p) => {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
});

// Allow disabling logos globally across all emails (set EMAIL_DISABLE_LOGO=true)
const LOGO_DISABLED =
  String(process.env.EMAIL_DISABLE_LOGO || "").toLowerCase() === "true";

// Prefer explicit EMAIL_LOGO_URL; else allow PUBLIC_LOGO_URL; else no default (avoid WEBP defaults in emails)
// Rationale: many email clients mishandle WEBP and PNG alpha transparency; use an email-safe asset instead.
let publicLogoUrl = LOGO_DISABLED
  ? null
  : process.env.EMAIL_LOGO_URL || process.env.PUBLIC_LOGO_URL || null;
// Skip WEBP logos for better compatibility/transparency handling
if (publicLogoUrl && /\.webp(\?|#|$)/i.test(publicLogoUrl)) {
  console.warn(
    "EMAIL_LOGO_URL/PUBLIC_LOGO_URL points to a WEBP; skipping logo to avoid email client transparency issues. Provide a PNG/JPG instead."
  );
  publicLogoUrl = null;
}

// Only expose a logoPath when logos aren't disabled
const logoPath = LOGO_DISABLED ? null : resolvedLocalLogoPath;

// ----------------------------------------------------------------------
// Visual palette for emails
// - Mirrors client theme variables (see client/src/index.css)
// - Can be overridden with EMAIL_* color env vars
// ----------------------------------------------------------------------
// Values mirror `client/src/index.css` defaults (can be overridden via env)
const PALETTE = {
  // primary CTA color (matches --btn-cta-bg)
  primary: process.env.EMAIL_PRIMARY_COLOR || "#1b9476",
  // secondary/accent color (matches chart-color-4 / accent used in UI)
  accent: process.env.EMAIL_ACCENT_COLOR || "#a78bfa",
  // heading/main text color (use site background color for brand consistency)
  text: process.env.EMAIL_TEXT_COLOR || "#124660",
  // muted paragraph text
  muted: process.env.EMAIL_MUTED_COLOR || "#334155",
  // footer text color
  footerText: process.env.EMAIL_FOOTER_TEXT_COLOR || "#64748b",
  // page background color for the email; use site splash tone for subtle branding
  bg: process.env.EMAIL_BG_COLOR || "#f4ebd6",
  // card/container background (typically white for readability)
  containerBg: process.env.EMAIL_CONTAINER_BG || "#ffffff",
  containerShadow:
    process.env.EMAIL_CONTAINER_SHADOW || "0 4px 20px rgba(11,22,40,0.08)",
};

function stripHtmlToText(html) {
  if (!html) return "";
  return html
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}
// Note: PALETTE and stripHtmlToText are defined above once.

export function buildEmailTemplate({
  title,
  preheader,
  heading,
  bodyHtml,
  ctaText,
  ctaUrl,
  logoCid,
  supportEmail,
  logoUrl,
}) {
  const year = new Date().getFullYear();
  const safeCta = ctaUrl
    ? `background-color:${PALETTE.primary};color:#fff;text-decoration:none;padding:12px 18px;border-radius:12px;display:inline-block;`
    : "";

  return `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${title || "Localiz"}</title>
    <style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; background:${
    PALETTE.bg
  }; margin:0; padding:16px; }
  .container { max-width:600px; margin:0 auto; background:${
    PALETTE.containerBg
  }; border-radius:16px; overflow:hidden; box-shadow:${
    PALETTE.containerShadow
  }; }
  .header { background: linear-gradient(90deg,${PALETTE.primary},${
    PALETTE.accent
  }); color:#fff; padding:0 16px; }
  .logo { font-weight:700; font-size:18px; }
  .content { padding:0 16px 12px 16px; color:${PALETTE.text}; }
  h1 { margin:0 0 12px 0; font-size:20px; color:${PALETTE.text}; }
  p { margin:0 0 12px 0; line-height:1.45; color:${PALETTE.muted}; }
  .footer { padding:12px 16px; font-size:13px; color:${
    PALETTE.footerText
  }; background:#fbfdfe; }
      .preheader { display:none !important; visibility:hidden; mso-hide:all; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden; }
      @media (prefers-color-scheme: dark) {
        body { background:#0b1220; }
        .container { background:#071226; color:#e6eef8; }
        .content { color:#e6eef8; }
        .footer { background:#061020; color:#9fb4d4 }
      }
    </style>
  </head>
  <body>
    <span class="preheader">${preheader || ""}</span>
    <div class="container">
      <div class="header">
        <div style="display:flex;align-items:center;justify-content:center;gap:0;padding:0;">
          ${
            logoUrl
              ? `<span style="background:#ffffff;display:inline-block;padding:6px 10px;border-radius:12px;"><img src="${logoUrl}" alt="Localiz" style="max-width:225px;width:100%;height:auto;display:block;margin:0 auto;background:#ffffff;"/></span>`
              : logoCid
              ? `<span style="background:#ffffff;display:inline-block;padding:6px 10px;border-radius:12px;"><img src="cid:${logoCid}" alt="Localiz" style="max-width:225px;width:100%;height:auto;display:block;margin:0 auto;background:#ffffff;"/></span>`
              : `<div class="logo" style="font-size:20px;text-align:center;">Localiz</div>`
          }
        </div>
      </div>
      <div class="content">
        <h1>${heading || title || "Bonjour"}</h1>
        ${bodyHtml}
        ${
          ctaUrl
            ? `<p style="margin-top:18px"><a href="${ctaUrl}" style="${safeCta}">${
                ctaText || "Ouvrir"
              }</a></p>`
            : ""
        }
      </div>
      <div class="footer">
        <div>Localiz • ${year}</div>
        <div style="margin-top:6px">Vous recevez cet e-mail car vous avez un compte Localiz ou en avez fait la demande.</div>
        <div style="margin-top:6px">Contact support : <a href="mailto:${
          supportEmail || "support@localiz.fr"
        }">${supportEmail || "support@localiz.fr"}</a></div>
      </div>
    </div>
  </body>
  </html>
  `;
}

// ----------------------------------------------------------------------
// Signup confirmation email
// Input: (email: string, token: string)
// Sends a verification link to confirm a user's email address.
// ----------------------------------------------------------------------
export const sendConfirmationEmail = async (email, token) => {
  const base = (process.env.CLIENT_URL || "").replace(/\/+$/g, "");
  const confirmUrl = `${base}/confirm-email?token=${token}`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Confirmez votre e-mail — Localiz",
    text: "Merci d'avoir créé un compte Localiz. Pour valider votre adresse e-mail, cliquez sur le lien ci-dessous.",
  };

  if (publicLogoUrl) {
    mailOptions.html = buildEmailTemplate({
      title: "Confirmation d'inscription - Localiz",
      preheader:
        "Confirmez votre adresse e-mail pour activer votre compte Localiz.",
      heading: "Bienvenue chez Localiz !",
      bodyHtml: `<p>Merci d'avoir créé un compte Localiz. Pour valider votre adresse e-mail et activer votre compte, cliquez sur le bouton ci-dessous.</p>`,
      ctaText: "Confirmer mon e-mail",
      ctaUrl: confirmUrl,
      logoUrl: publicLogoUrl,
      supportEmail: process.env.SUPPORT_EMAIL || "support@localiz.fr",
    });
  } else if (logoPath) {
    mailOptions.attachments = [
      {
        filename: path.basename(logoPath),
        path: logoPath,
        cid: "localiz-logo",
      },
    ];
    mailOptions.html = buildEmailTemplate({
      title: "Confirmation d'inscription - Localiz",
      preheader:
        "Confirmez votre adresse e-mail pour activer votre compte Localiz.",
      heading: "Bienvenue chez Localiz !",
      bodyHtml: `<p>Merci d'avoir créé un compte Localiz. Pour valider votre adresse e-mail et activer votre compte, cliquez sur le bouton ci-dessous.</p>`,
      ctaText: "Confirmer mon adresse e-mail",
      ctaUrl: confirmUrl,
      logoCid: "localiz-logo",
      supportEmail: process.env.SUPPORT_EMAIL || "support@localiz.fr",
    });
  } else {
    mailOptions.html = buildEmailTemplate({
      title: "Confirmation d'inscription - Localiz",
      preheader:
        "Confirmez votre adresse e-mail pour activer votre compte Localiz.",
      heading: "Bienvenue chez Localiz !",
      bodyHtml: `<p>Merci d'avoir créé un compte Localiz. Pour valider votre adresse e-mail et activer votre compte, cliquez sur le bouton ci-dessous.</p>`,
      ctaText: "Confirmer mon adresse e-mail",
      ctaUrl: confirmUrl,
      supportEmail: process.env.SUPPORT_EMAIL || "support@localiz.fr",
    });
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("sendConfirmationEmail result:", {
      accepted: info.accepted,
      rejected: info.rejected,
      messageId: info.messageId,
    });
    return info;
  } catch (err) {
    console.error("sendConfirmationEmail error:", err);
    throw err;
  }
};

// ----------------------------------------------------------------------
// Signup success email
// Input: (email: string, username?: string)
// Notifies the user their account is activated and links to login.
// ----------------------------------------------------------------------
export const sendSuccessEmail = async (email, username) => {
  const base = (process.env.CLIENT_URL || "").replace(/\/+$/g, "");
  const loginUrl = `${base}/login`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Bienvenue — compte activé",
    text: `Bonjour ${
      username || "utilisateur"
    },\n\nVotre inscription a été confirmée avec succès. Vous pouvez maintenant vous connecter à votre compte Localiz.`,
  };
  if (publicLogoUrl) {
    mailOptions.html = buildEmailTemplate({
      title: "Inscription confirmée — Localiz",
      preheader: "Votre compte Localiz a bien été activé.",
      heading: `Bonjour ${username || "utilisateur"},`,
      bodyHtml: `<p>Votre inscription a été confirmée avec succès. Vous pouvez maintenant vous connecter à votre compte Localiz.</p>`,
      ctaText: "Connexion",
      ctaUrl: loginUrl,
      logoUrl: publicLogoUrl,
      supportEmail: process.env.SUPPORT_EMAIL || "support@localiz.fr",
    });
  } else if (logoPath) {
    mailOptions.attachments = [
      {
        filename: path.basename(logoPath),
        path: logoPath,
        cid: "localiz-logo",
      },
    ];
    mailOptions.html = buildEmailTemplate({
      title: "Inscription confirmée — Localiz",
      preheader: "Votre compte Localiz a bien été activé.",
      heading: `Bonjour ${username || "utilisateur"},`,
      bodyHtml: `<p>Votre inscription a été confirmée avec succès. Vous pouvez maintenant vous connecter à votre compte Localiz.</p>`,
      ctaText: "Se connecter",
      ctaUrl: loginUrl,
      logoCid: "localiz-logo",
      supportEmail: process.env.SUPPORT_EMAIL || "support@localiz.fr",
    });
  } else {
    mailOptions.html = buildEmailTemplate({
      title: "Inscription confirmée — Localiz",
      preheader: "Votre compte Localiz a bien été activé.",
      heading: `Bonjour ${username || "utilisateur"},`,
      bodyHtml: `<p>Votre inscription a été confirmée avec succès. Vous pouvez maintenant vous connecter à votre compte Localiz.</p>`,
      ctaText: "Se connecter",
      ctaUrl: loginUrl,
      supportEmail: process.env.SUPPORT_EMAIL || "support@localiz.fr",
    });
  }

  return transporter.sendMail(mailOptions);
};

// ----------------------------------------------------------------------
// Password reset email
// Input: (toEmail: string, token: string)
// Sends a secure link to reset the user's password.
// ----------------------------------------------------------------------
export const sendResetPasswordEmail = async (toEmail, token) => {
  const base = (process.env.CLIENT_URL || "").replace(/\/+$/g, "");
  const resetUrl = `${base}/reset-password/${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: "Réinitialisez votre mot de passe — Localiz",
    text: "Instructions pour réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous.",
  };
  if (publicLogoUrl) {
    mailOptions.html = buildEmailTemplate({
      title: "Réinitialisation de mot de passe — Localiz",
      preheader: "Instructions pour réinitialiser votre mot de passe.",
      heading: "Réinitialisation de mot de passe",
      bodyHtml: `<p>Nous avons reçu une demande de réinitialisation de mot de passe pour ce compte.</p>
               <p>Si vous l'avez demandée, cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe. Ce lien expirera dans une heure.</p>`,
      ctaText: "Réinitialiser mon mot de passe",
      ctaUrl: resetUrl,
      logoUrl: publicLogoUrl,
      supportEmail: process.env.SUPPORT_EMAIL || "support@localiz.fr",
    });
  } else if (logoPath) {
    mailOptions.attachments = [
      {
        filename: path.basename(logoPath),
        path: logoPath,
        cid: "localiz-logo",
      },
    ];
    mailOptions.html = buildEmailTemplate({
      title: "Réinitialisation de mot de passe — Localiz",
      preheader: "Instructions pour réinitialiser votre mot de passe.",
      heading: "Réinitialisation de mot de passe",
      bodyHtml: `<p>Nous avons reçu une demande de réinitialisation de mot de passe pour ce compte.</p>
               <p>Si vous l'avez demandée, cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe. Ce lien expirera dans une heure.</p>`,
      ctaText: "Réinitialiser mon mot de passe",
      ctaUrl: resetUrl,
      logoCid: "localiz-logo",
      supportEmail: process.env.SUPPORT_EMAIL || "support@localiz.fr",
    });
  } else {
    mailOptions.html = buildEmailTemplate({
      title: "Réinitialisation de mot de passe — Localiz",
      preheader: "Instructions pour réinitialiser votre mot de passe.",
      heading: "Réinitialisation de mot de passe",
      bodyHtml: `<p>Nous avons reçu une demande de réinitialisation de mot de passe pour ce compte.</p>
               <p>Si vous l'avez demandée, cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe. Ce lien expirera dans une heure.</p>`,
      ctaText: "Réinitialiser mon mot de passe",
      ctaUrl: resetUrl,
      supportEmail: process.env.SUPPORT_EMAIL || "support@localiz.fr",
    });
  }

  await transporter.sendMail(mailOptions);
};

// ----------------------------------------------------------------------
// Password reset success email
// Input: (email: string, username?: string)
// Confirms the user's password was changed.
// ----------------------------------------------------------------------
export const sendPasswordResetSuccessEmail = async (email, username) => {
  const base = (process.env.CLIENT_URL || "").replace(/\/+$/g, "");
  const loginUrl = `${base}/login`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Votre mot de passe a été mis à jour — Localiz",
    text: "Votre mot de passe a été modifié avec succès. Si vous n'êtes pas à l'origine de ce changement, contactez le support immédiatement.",
  };
  if (publicLogoUrl) {
    mailOptions.html = buildEmailTemplate({
      title: "Mot de passe modifié — Localiz",
      preheader: "Votre mot de passe a été mis à jour.",
      heading: `Bonjour ${username || "utilisateur"},`,
      bodyHtml: `<p>Votre mot de passe a été modifié avec succès. Si vous n'êtes pas à l'origine de ce changement, contactez le support immédiatement.</p>`,
      ctaText: "Se connecter",
      ctaUrl: loginUrl,
      logoUrl: publicLogoUrl,
      supportEmail: process.env.SUPPORT_EMAIL || "support@localiz.fr",
    });
  } else if (logoPath) {
    mailOptions.attachments = [
      {
        filename: path.basename(logoPath),
        path: logoPath,
        cid: "localiz-logo",
      },
    ];
    mailOptions.html = buildEmailTemplate({
      title: "Mot de passe modifié — Localiz",
      preheader: "Votre mot de passe a été mis à jour.",
      heading: `Bonjour ${username || "utilisateur"},`,
      bodyHtml: `<p>Votre mot de passe a été modifié avec succès. Si vous n'êtes pas à l'origine de ce changement, contactez le support immédiatement.</p>`,
      ctaText: "Se connecter",
      ctaUrl: loginUrl,
      logoCid: "localiz-logo",
      supportEmail: process.env.SUPPORT_EMAIL || "support@localiz.fr",
    });
  } else {
    mailOptions.html = buildEmailTemplate({
      title: "Mot de passe modifié — Localiz",
      preheader: "Votre mot de passe a été mis à jour.",
      heading: `Bonjour ${username || "utilisateur"},`,
      bodyHtml: `<p>Votre mot de passe a été modifié avec succès. Si vous n'êtes pas à l'origine de ce changement, contactez le support immédiatement.</p>`,
      ctaText: "Se connecter",
      ctaUrl: loginUrl,
      supportEmail: process.env.SUPPORT_EMAIL || "support@localiz.fr",
    });
  }

  await transporter.sendMail(mailOptions);
};

// ----------------------------------------------------------------------
// Contact form — support notification (plain text)
// Input: { name, email, subject, message }
// Sends a minimal notification to SUPPORT_EMAIL with reply-to user.
// ----------------------------------------------------------------------
export const sendContactSupportNotification = async ({
  name,
  email,
  subject,
  message,
}) => {
  const supportEmail = process.env.SUPPORT_EMAIL || "support@localiz.fr";
  const textBody = [
    "Nouveau message de contact",
    `Nom: ${name || ""}`,
    `Email: ${email || ""}`,
    `Objet: ${subject || "(sans objet)"}`,
    "",
    "Message:",
    String(message || ""),
  ].join("\n");

  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: supportEmail,
    subject: `Nouveau message de contact: ${subject || "(sans objet)"}`,
    replyTo: email,
    text: textBody,
  });
};

// ----------------------------------------------------------------------
// Contact form — user acknowledgment (no logo)
// Input: { toEmail, name, subject, message }
// Sends a friendly confirmation to the user without a header image.
// ----------------------------------------------------------------------
export const sendContactAcknowledgment = async ({
  toEmail,
  name,
  subject,
  message,
}) => {
  const base = (process.env.CLIENT_URL || "").replace(/\/+$/g, "");
  const supportEmail = process.env.SUPPORT_EMAIL || "support@localiz.fr";
  const appName = process.env.APP_NAME || "Localiz";
  const safeMessage = String(message || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");

  const bodyHtml = `<p>Bonjour ${name || ""},</p>
    <p>Merci d'avoir contacté ${appName}. Notre équipe vous répondra dès que possible.</p>
    <p><strong>Objet:</strong> ${subject || ""}</p>
    <p><strong>Votre message:</strong></p>
    <blockquote style="border-left:3px solid #ccc;margin:8px 0;padding-left:12px;">${safeMessage}</blockquote>
    ${
      base
        ? `<p>Vous pouvez visiter notre site sur <a href="${base}">${base}</a>.</p>`
        : ""
    }
    <p style="margin-top:16px">— L'équipe ${appName}</p>`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: "Votre message a bien été reçu",
    replyTo: supportEmail,
    text: stripHtmlToText(bodyHtml),
  };

  // Build the acknowledgment email WITHOUT any logo image (no logoUrl/logoCid)
  mailOptions.html = buildEmailTemplate({
    title: "Votre message a bien été reçu",
    preheader: `Nous avons bien reçu votre message — ${appName}`,
    heading: "Merci, nous revenons vers vous bientôt",
    bodyHtml,
    ctaText: base ? "Ouvrir Localiz" : undefined,
    ctaUrl: base || undefined,
    supportEmail,
  });

  return transporter.sendMail(mailOptions);
};
