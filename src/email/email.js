import nodemailer from "nodemailer";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

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

// Helper: unified HTML email template
// Path to client logo (relative to project root). We'll attach it inline if present.
const logoPath = path.join(
  process.cwd(),
  "client",
  "src",
  "assets",
  "images",
  "logo.png"
);

// Use env if provided; otherwise leave undefined so the code can fall back to the bundled local logo file
const publicLogoUrl = process.env.EMAIL_LOGO_URL;

// Palette used across email templates (keeps parity with client theme variables)
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
              ? `<img src="${logoUrl}" alt="Localiz" style="max-width:225px;width:100%;height:auto;display:block;margin:0 auto;"/>`
              : logoCid
              ? `<img src="cid:${logoCid}" alt="Localiz" style="max-width:225px;width:100%;height:auto;display:block;margin:0 auto;"/>`
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

// Fonction pour envoyer l'email de confirmation d'inscription
export const sendConfirmationEmail = async (email, token) => {
  const base = (process.env.CLIENT_URL || "").replace(/\/+$/g, "");
  const confirmUrl = `${base}/confirm-email?token=${token}`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Confirmez votre e-mail — Localiz",
    text: "Merci d'avoir créé un compte Localiz. Pour valider votre adresse e-mail, cliquez sur le lien ci-dessous.", // Added text option
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
  } else if (fs.existsSync(logoPath)) {
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

// Fonction pour envoyer l'email d'inscription réussie
export const sendSuccessEmail = async (email, username) => {
  const base = (process.env.CLIENT_URL || "").replace(/\/+$/g, "");
  const loginUrl = `${base}/login`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Bienvenue — compte activé",
    text: `Bonjour ${
      username || "utilisateur"
    },\n\nVotre inscription a été confirmée avec succès. Vous pouvez maintenant vous connecter à votre compte Localiz.`, // Added text option
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
  } else if (fs.existsSync(logoPath)) {
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

// Fonction pour envoyer l'email de réinitialisation de mot de passe
export const sendResetPasswordEmail = async (toEmail, token) => {
  const base = (process.env.CLIENT_URL || "").replace(/\/+$/g, "");
  const resetUrl = `${base}/reset-password/${token}`;
  // buildEmailTemplate will be called below when composing mailOptions

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: "Réinitialisez votre mot de passe — Localiz",
    text: "Instructions pour réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous.", // Added text option
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
  } else if (fs.existsSync(logoPath)) {
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

// Fonction pour envoyer l'email de confirmation de réinitialisation de mot de passe
export const sendPasswordResetSuccessEmail = async (email, username) => {
  const base = (process.env.CLIENT_URL || "").replace(/\/+$/g, "");
  const loginUrl = `${base}/login`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Votre mot de passe a été mis à jour — Localiz",
    text: "Votre mot de passe a été modifié avec succès. Si vous n'êtes pas à l'origine de ce changement, contactez le support immédiatement.", // Added text option
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
  } else if (fs.existsSync(logoPath)) {
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
