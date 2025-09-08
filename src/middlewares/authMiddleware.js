/**
Rôle : C'est un middleware. Son but n'est pas de gérer les routes, mais de s'interposer entre une requête et une route pour effectuer une action de vérification. Ici, il vérifie l'authenticité de l'utilisateur pour les routes qui nécessitent d'être protégées.
Contenu : Il contient les fonctions authMiddleware (pour valider le token JWT) et isAdmin (pour vérifier le rôle). Ces fonctions sont réutilisables et peuvent être appliquées à n'importe quelle route qui en a besoin.
Export : Il utilise des exports nommés (export function ...) car il expose plusieurs fonctions qui peuvent être importées individuellement.
=> responsable de la vérification du token
 */

import jwt from "jsonwebtoken";
import User from "../models/user.schema.js"; // Importe le modèle d'utilisateur

// protect: implémentation fournie par l'utilisateur. Elle récupère le token
// depuis les cookies, le vérifie et attache l'utilisateur correspondant
// à req.user. Retourne 400 si aucun token ou token invalide.
export const protect = async (req, res, next) => {
  // récupération du token attaché à la requête HTTP entrante
  const token = req.cookies?.token;

  // action si aucun token présent
  if (!token) {
    return res.status(400).json({ message: "Accès interdit. Aucun token." });
  }

  try {
    // support for different env var names and a dev fallback
    const secret =
      process.env.SECRET_KEY || process.env.JWT_SECRET || "dev_secret";

    // décryptage du token avec la clé secrète
    const decoded = jwt.verify(token, secret);

    // on attache à la requête l'utilisateur récupéré en BDD grâce à l'ID stocké dans le token
    // prefer `sub` (subject) but accept `id` or `userId` as fallback
    const userId = decoded?.sub || decoded?.id || decoded?.userId;

    const user = await User.findById(userId).select("-password -__v");
    if (!user) {
      return res
        .status(401)
        .json({ message: "Accès interdit : utilisateur introuvable." });
    }

    req.user = user;
    req.userId = user._id;

    // on peut alors passer au controller
    return next();
  } catch (error) {
    // action si token invalide
    console.error(error);
    return res.status(400).json({ message: "Accès interdit. Token invalide." });
  }
};

// Pour compatibilité descendante, on conserve `authMiddleware` et on le
// délègue à `protect`. Les imports existants qui utilisent
// `authMiddleware` continueront donc de fonctionner.
export async function authMiddleware(req, res, next) {
  return protect(req, res, next);
}

// Middleware pour vérifier si l'utilisateur est un administrateur
export function isAdmin(req, res, next) {
  if (req.user?.role === "admin") return next();
  return res.status(403).json({ message: "Accès interdit : admin uniquement" });
}
