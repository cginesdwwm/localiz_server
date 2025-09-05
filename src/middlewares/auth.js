/**
Rôle : C'est un middleware. Son but n'est pas de gérer les routes, mais de s'interposer entre une requête et une route pour effectuer une action de vérification. Ici, il vérifie l'authenticité de l'utilisateur pour les routes qui nécessitent d'être protégées.
Contenu : Il contient les fonctions authMiddleware (pour valider le token JWT) et isAdmin (pour vérifier le rôle). Ces fonctions sont réutilisables et peuvent être appliquées à n'importe quelle route qui en a besoin.
Export : Il utilise des exports nommés (export function ...) car il expose plusieurs fonctions qui peuvent être importées individuellement.
=> responsable de la vérification du token
 */

import jwt from "jsonwebtoken";
import User from "../models/user.schema.js"; // Importe le modèle d'utilisateur

// Middleware pour la vérification du token JWT
export async function authMiddleware(req, res, next) {
  try {
    // On récupère le jeton depuis les cookies de la requête
    const token = req.cookies.token;

    if (!token) {
      // Si aucun token n'est présent, on renvoie une erreur 401 (Non autorisé)
      return res
        .status(401)
        .json({ message: "Non autorisé : aucun token fourni" });
    }

    // On vérifie la validité du token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");

    // On trouve l'utilisateur correspondant au jeton
    const user = await User.findById(decoded.id).select("-password -__v");
    if (!user) {
      return res
        .status(401)
        .json({ message: "Non autorisé : utilisateur introuvable" });
    }

    // On ajoute les informations de l'utilisateur à l'objet de la requête
    req.user = user;
    req.userId = user._id;

    // On continue vers la prochaine fonction de middleware ou la route
    next();
  } catch (err) {
    console.error("Erreur de vérification du token:", err);
    // Si la vérification échoue (token invalide ou expiré)
    res
      .status(401)
      .json({ message: "Votre session a expiré. Veuillez vous reconnecter." });
  }
}

// Middleware pour vérifier si l'utilisateur est un administrateur
export function isAdmin(req, res, next) {
  // `req.user` est disponible si `authMiddleware` a été exécuté avant
  if (req.user?.role === "admin") return next();
  return res.status(403).json({ message: "Accès interdit : admin uniquement" });
}
