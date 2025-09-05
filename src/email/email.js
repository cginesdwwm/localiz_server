import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Fonction pour envoyer l'email de confirmation d'inscription
export const sendConfirmationEmail = async (email, token) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Confirmation d'inscription",
    html: `<p>Bienvenue chez Localiz ! Pour valider la création de votre compte, veuillez confirmer votre adresse e-mail en cliquant sur le lien suivant :</p>
           <a href="${process.env.API_URL}/user/verifyMail/${token}">Confirmer mon adresse e-mail</a>`,
  };

  await transporter.sendMail(mailOptions);
};

// Fonction pour envoyer l'email d'inscription réussie
export const sendSuccessEmail = async (email, username) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Inscription réussie",
    html: `<p>Bonjour ${username},</p>
           <p>Votre inscription a été confirmée avec succès. Vous pouvez maintenant vous connecter à votre compte Localiz.</p>
           <a href="${process.env.CLIENT_URL}/login">Je me connecte</a>`,
  };

  return await transporter.sendMail(mailOptions);
};

// Fonction pour envoyer l'email de réinitialisation de mot de passe
export const sendResetPasswordEmail = async (toEmail, token) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: "Réinitialisation de votre mot de passe",
    html: `
      <p>Vous avez demandé une réinitialisation de mot de passe.</p>
      <p>Cliquez sur ce lien pour réinitialiser votre mot de passe :</p>
      <a href="${process.env.CLIENT_URL}/reset-password/${token}">Réinitialiser le mot de passe</a>
      <p>Ce lien expirera dans une heure.</p>
      <p>Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
