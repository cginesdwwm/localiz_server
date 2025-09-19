/*
    Points importants pour débutant :
  - Ne jamais stocker un mot de passe en clair : on utilise bcrypt.hash avant de sauvegarder.
  - Pour la connexion, on compare le mot de passe reçu avec bcrypt.compare.
  - Les contrôleurs renvoient des codes HTTP appropriés (200 pour succès, 400 pour erreur client).

  1 : vérifier en console si je récupère les données
  console.log(req.body);
  2 : vérification des données
  3 : ajout des données
  4 : envoi données et/ou message front
*/

import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import User from "../models/user.schema.js";
import TempUser from "../models/tempuser.schema.js";

import { frenchForbiddenWords } from "../config/forbidden_words.js";

import {
  sendConfirmationEmail,
  sendSuccessEmail,
  sendResetPasswordEmail,
} from "../email/email.js";

dotenv.config();

/**
 * Fonctions utilitaires
 * Regroupement des petites fonctions internes utilisées par les contrôleurs.
 */

/**
 * Crée un jeton JWT avec l'email pour la vérification de l'inscription.
 */
const createTokenEmail = (email) => {
  return jwt.sign({ email }, process.env.SECRET_KEY, { expiresIn: "3600s" });
};

/**
 * Fonction utilitaire pour capitaliser la première lettre de chaque mot.
 * {string} str : La chaîne à capitaliser.
 * {string} : La chaîne capitalisée.
 */
const capitalizeName = (str) => {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Mots interdits.
 * Création de l'expression régulière avec les mots de votre liste et les "word boundaries" (\b)
 * Le Regex (\b) permet de vérifier les mots en entier, ce qui est utile pour firstName et lastName.
 * On garde la liste pour la vérification du username, qui peut être plus stricte.
 */
const badWordsRegex = new RegExp(
  "\\b(" + frenchForbiddenWords.join("|") + ")\\b",
  "i" // "i" pour ignorer la casse
);

/**
 * Contrôleurs d'Authentification (Inscription, Connexion, Vérification)
 * Gèrent le flux d'entrée des utilisateurs dans le système.
 */

/* Inscription */
/**
 * La fonction register :
 * - Crée un utilisateur temporaire et envoie un email de confirmation.
 * - express.Request req : L'objet de la requête.
 * - express.Response res : L'objet de la réponse.
 */
export const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      username,
      email,
      phone,
      postalCode,
      city,
      birthday,
      gender,
      agreeToTerms,
      password,
    } = req.body;

    // Required fields for the registration flow
    const missing = [];
    if (!username) missing.push("username");
    if (!email) missing.push("email");
    if (!password) missing.push("password");
    if (!birthday) missing.push("birthday");
    if (!agreeToTerms) missing.push("agreeToTerms");

    if (missing.length > 0) {
      return res.status(400).json({
        message: "Champs requis manquants",
        missing,
      });
    }

    // Vérification du consentement RGPD
    if (!agreeToTerms) {
      return res.status(400).json({
        message:
          "L'acceptation des conditions est obligatoire pour l'inscription.",
      });
    }

    // Capitalisation des noms et prénoms avant validation (only if provided)
    const capitalizedFirstName = firstName
      ? capitalizeName(firstName)
      : undefined;
    const capitalizedLastName = lastName ? capitalizeName(lastName) : undefined;

    // Validation des mots interdits pour les noms (only if provided)
    if (
      (capitalizedFirstName && badWordsRegex.test(capitalizedFirstName)) ||
      (capitalizedLastName && badWordsRegex.test(capitalizedLastName))
    ) {
      return res.status(400).json({
        message: "Votre nom ou prénom contient un mot interdit.",
      });
    }

    // Pour le nom d'utilisateur, on maintient une vérification stricte qui bloque le mot même s'il est une sous-chaîne.
    if (
      frenchForbiddenWords.some((word) => username.toLowerCase().includes(word))
    ) {
      return res.status(400).json({
        message: "Le nom d'utilisateur contient un mot interdit.",
      });
    }

    // Vérification de l'existence de l'email et du nom d'utilisateur dans les deux collections (temporaire et finale)
    const [emailExists, usernameExists, pendingEmail, pendingUsername] =
      await Promise.all([
        User.findOne({ email }),
        User.findOne({ username }),
        TempUser.findOne({ email }),
        TempUser.findOne({ username }),
      ]);

    if (emailExists || usernameExists) {
      if (emailExists && usernameExists) {
        return res
          .status(400)
          .json({ message: "L'email et le pseudo sont déjà utilisés." });
      }
      if (emailExists) {
        return res.status(400).json({ message: "L'email est déjà utilisé." });
      }
      return res.status(400).json({ message: "Le pseudo est déjà utilisé." });
    } else if (pendingEmail || pendingUsername) {
      return res.status(400).json({
        message:
          "Veuillez vérifier votre boîte mail pour confirmer votre inscription.",
      });
    }

    // Vérification de l'existence du téléphone (only if provided)
    if (phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return res
          .status(400)
          .json({ message: "Numéro de téléphone déjà utilisé" });
      }
    }

    // Validation côté serveur : âge minimum 16 ans
    if (birthday) {
      const birthDate = new Date(birthday);
      if (isNaN(birthDate.getTime())) {
        return res.status(400).json({ message: "Date de naissance invalide." });
      }
      const now = new Date();
      let age = now.getFullYear() - birthDate.getFullYear();
      const m = now.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 16) {
        return res.status(400).json({
          message: "Vous devez avoir au moins 16 ans pour vous inscrire.",
        });
      }
    }

    // Traitement des données
    const hashedPassword = await bcrypt.hash(password, 10);
    const token = createTokenEmail(email);

    // Création et sauvegarde de l'utilisateur temporaire
    const tempUser = new TempUser({
      // Use capitalized names only if provided
      ...(capitalizedFirstName ? { firstName: capitalizedFirstName } : {}),
      ...(capitalizedLastName ? { lastName: capitalizedLastName } : {}),
      username,
      email,
      ...(phone ? { phone } : {}),
      ...(postalCode ? { postalCode } : {}),
      ...(city ? { city } : {}),
      birthday: birthday ? new Date(birthday) : undefined,
      ...(gender ? { gender } : {}),
      agreeToTerms: !!agreeToTerms,
      password: hashedPassword,
      token,
    });
    await tempUser.save();

    // Envoi de l'email de confirmation d'inscription
    await sendConfirmationEmail(email, token);

    // Calcul de la date d'expiration du token (en ms) à partir du JWT
    const decoded = jwt.decode(token);
    const expiresAt =
      decoded && decoded.exp ? decoded.exp * 1000 : Date.now() + 3600 * 1000;

    // Envoi de la réponse au client avec l'expiration afin que le front puisse
    // afficher un compte à rebours exact.
    return res.status(201).json({
      message:
        "Veuillez vérifier votre boîte mail pour confirmer votre inscription.",
      expiresAt,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* Connexion */
/**
 * La fonction login :
 * - Gère la connexion des utilisateurs.
 */
export const login = async (req, res) => {
  try {
    const { data, password } = req.body;
    if (!data || !password)
      return res.status(400).json({ message: "Données manquantes" });

    // Détection email ou username
    const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    let user;
    if (emailRegex.test(data)) {
      user = await User.findOne({ email: data });
    } else {
      user = await User.findOne({ username: data });
    }

    if (!user)
      return res
        .status(400)
        .json({ message: "Nom d'utilisateur ou email invalide" });

    // Vérification mot de passe
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: "Mot de passe incorrect" });

    // Génération JWT
    const token = jwt.sign({}, process.env.SECRET_KEY, {
      subject: user._id.toString(),
      expiresIn: "7d",
      algorithm: "HS256",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      // In development we use a more permissive SameSite so the cookie is sent from localhost:5173
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours en millisecondes
    });
    // httpOnly: true => Empêche l'accès au cookie via le code JavaScript côté client (sécurité contre les attaques XSS).
    // `secure: true` garantit que le cookie n'est envoyé que sur une connexion HTTPS.
    // En mode production, cette option est activée. En mode développement, elle est désactivée pour que l'API fonctionne en HTTP.
    // `sameSite` protège contre les attaques de type Cross-Site Request Forgery (CSRF).
    // `maxAge` définit la durée de vie du cookie. Ici, il est configuré pour expirer après 7 jours.

    const publicUser = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      phone: user.phone,
      postalCode: user.postalCode,
      birthday: user.birthday,
      gender: user.gender,
      role: user.role,
    };
    // publicUser est une version "nettoyée" de l’utilisateur, sans mot de passe ni informations sensibles.
    // Elle est créée avant d'envoyer les données côté client pour des raisons de sécurité.
    // On ne renvoie jamais le mot de passe haché de l'utilisateur au navigateur.

    return res
      .status(200)
      .json({ user: publicUser, message: "Connexion réussie" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const logoutUser = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    path: "/",
  });
  res.status(200).json({ message: "Déconnexion réussie" });
};

/* Vérification d'email */
/**
 * verifyMail :
 * Convertit un utilisateur temporaire en utilisateur permanent après confirmation par email.
 */
export const verifyMail = async (req, res) => {
  const { token } = req.params;
  console.log(token);

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const tempUser = await TempUser.findOne({ email: decoded.email, token });
    console.log(tempUser);

    if (!tempUser) {
      return res.redirect(
        `${
          process.env.MODE === "development"
            ? process.env.CLIENT_URL
            : process.env.DEPLOY_FRONT_URL
        }/register?message=error&clearRegister=1`
      );
    }

    const newUser = new User({
      firstName: tempUser.firstName,
      lastName: tempUser.lastName,
      username: tempUser.username,
      email: tempUser.email,
      phone: tempUser.phone,
      postalCode: tempUser.postalCode,
      city: tempUser.city,
      birthday: tempUser.birthday,
      gender: tempUser.gender,
      agreeToTerms: tempUser.agreeToTerms,
      password: tempUser.password,
    });

    await newUser.save();
    try {
      const delRes = await TempUser.deleteOne({ _id: tempUser._id });
      console.log("TempUser.deleteOne result:", delRes);
    } catch (delErr) {
      console.error("Failed to delete TempUser:", delErr);
    }

    // Envoi de l'email de succès
    await sendSuccessEmail(newUser.email, newUser.username);

    res.redirect(
      `${
        process.env.MODE === "development"
          ? process.env.CLIENT_URL
          : process.env.DEPLOY_FRONT_URL
      }/login?message=success&clearRegister=1`
    );
  } catch (error) {
    console.error(error); // Utilisez console.error pour les erreurs
    if (error.name === "TokenExpiredError") {
      // Gère le cas où le token de vérification a expiré
      return res.redirect(
        `${
          process.env.MODE === "development"
            ? process.env.CLIENT_URL
            : process.env.DEPLOY_FRONT_URL
        }/register?message=expired&clearRegister=1`
      );
    }
    // Gère toutes les autres erreurs
    return res.redirect(
      `${
        process.env.MODE === "development"
          ? process.env.CLIENT_URL
          : process.env.DEPLOY_FRONT_URL
      }/register?message=error&clearRegister=1`
    );
  }
};

/**
 * confirmEmail : API utilisée par le front.
 * Attend { token } en POST body ou ?token=... en GET/POST.
 * Renvoie JSON au front pour que la page côté client gère la navigation.
 */
export const confirmEmail = async (req, res) => {
  const token = req.body?.token || req.query?.token;
  if (!token) return res.status(400).json({ message: "Token manquant" });

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const tempUser = await TempUser.findOne({ email: decoded.email, token });

    if (!tempUser) {
      return res
        .status(400)
        .json({ message: "Token invalide ou utilisateur introuvable" });
    }

    const newUser = new User({
      firstName: tempUser.firstName,
      lastName: tempUser.lastName,
      username: tempUser.username,
      email: tempUser.email,
      phone: tempUser.phone,
      postalCode: tempUser.postalCode,
      city: tempUser.city,
      birthday: tempUser.birthday,
      gender: tempUser.gender,
      agreeToTerms: tempUser.agreeToTerms,
      password: tempUser.password,
    });

    await newUser.save();
    try {
      const delRes = await TempUser.deleteOne({ _id: tempUser._id });
      console.log("TempUser.deleteOne result:", delRes);
    } catch (delErr) {
      console.error("Failed to delete TempUser:", delErr);
    }

    // Envoi de l'email de succès (ce mail contient un lien vers /login)
    await sendSuccessEmail(newUser.email, newUser.username);

    return res.status(200).json({ message: "Utilisateur confirmé" });
  } catch (error) {
    console.error(error);
    if (error.name === "TokenExpiredError") {
      return res.status(410).json({ message: "Token expiré" });
    }
    return res.status(500).json({ message: "Erreur interne" });
  }
};

/**
 * Contrôleurs de gestion du mot de passe
 * Gèrent la réinitialisation et le changement de mot de passe.
 */

/* Mot de passe oublié */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Sécurité: Si l'utilisateur n'existe pas, on renvoie le même message de succès
    // pour éviter d'exposer si un email est enregistré ou non.
    if (!user) {
      return res.status(200).json({
        message:
          "Si l'adresse mail est valide, un lien de réinitialisation a été envoyé.",
      });
    }

    // Génération d'un jeton simple pour la réinitialisation du mot de passe.
    // bcrypt peut être utilisé pour hacher une valeur temporaire.
    const resetToken = await bcrypt.hash(user.email + Date.now(), 10);
    const cleanedToken = resetToken.replace(/[^a-zA-Z0-9]/g, ""); // Nettoyage du token

    // Sauvegarde du jeton et de sa date d'expiration dans la base de données
    user.resetPasswordToken = cleanedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 heure en ms
    await user.save();

    // Envoi de l'email avec le lien de réinitialisation
    await sendResetPasswordEmail(user.email, cleanedToken);

    return res.status(200).json({
      message:
        "Si l'adresse mail est valide, un lien de réinitialisation a été envoyé.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* Réinitialisation de mot de passe */
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Token invalide ou expiré." });
    }

    // Hash du nouveau mot de passe
    user.password = await bcrypt.hash(password, 10);

    // Nettoie les champs de réinitialisation pour que le token ne puisse pas être réutilisé.
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ message: "Mot de passe mis à jour avec succès." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* Changement de mot de passe (utilisateur connecté) */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Veuillez remplir tous les champs." });
    }

    // L'ID de l'utilisateur est ajouté à req par le middleware authMiddleware.
    const user = await User.findById(req.userId);

    // Vérification du mot de passe actuel.
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Mot de passe actuel incorrect." });
    }

    // Hash du nouveau mot de passe.
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Mot de passe mis à jour avec succès." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/**
 * Contrôleurs de gestion du profil
 * Gèrent la récupération et la suppression du profil utilisateur.
 */

/* Récupération du profil */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* Suppression de compte */
export const deleteAccount = async (req, res) => {
  try {
    const { userId } = req; // ID fourni par authMiddleware

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    res.status(200).json({ message: "Compte supprimé avec succès." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* Demande de suppression - marque le compte comme désactivé et enregistre la raison */
export const requestAccountDeletion = async (req, res) => {
  try {
    const { reason, details } = req.body || {};
    const userId = req.userId;

    if (!userId) return res.status(401).json({ message: "Non authentifié" });

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: "Utilisateur non trouvé." });

    user.disabled = true;
    user.deletionRequestedAt = new Date();
    if (reason) user.deletionReason = reason;
    if (details) user.deletionDetails = details;

    await user.save();

    // TODO: Optionnellement, pousser un job pour supprimer définitivement après 30 jours

    return res
      .status(200)
      .json({ message: "Demande de suppression enregistrée." });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: error.message });
  }
};
