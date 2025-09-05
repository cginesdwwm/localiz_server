// Rôle : C'est un routeur. Il définit les points de terminaison (endpoints) de votre API pour l'authentification des utilisateurs, c'est-à-dire l'inscription (/register) et la connexion (/login). C'est le "portail" par lequel les utilisateurs entrent dans votre système.
// Contenu : Il contient les routes qui reçoivent les requêtes du client et appellent le bon contrôleur pour gérer la logique d'inscription et de connexion.
// Export : Il exporte par défaut (export default router) le routeur complet pour qu'il puisse être monté dans le fichier index.js principal de vos routes.
// => responsable de la création du token

import jwt from "jsonwebtoken";
import User from "../models/user.schema.js"; // On importe le modèle pour pouvoir enrichir la requête avec les infos de l'utilisateur

const auth = async (req, res, next) => {
  try {
    // 1. On récupère le jeton depuis le cookie
    const token = req.cookies.token;

    if (!token) {
      // Si aucun token n'est présent, on renvoie une erreur 401 (Non autorisé)
      return res
        .status(401)
        .json({ message: "Non autorisé: Aucun token fourni" });
    }

    // 2. On vérifie le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");

    // 3. On trouve l'utilisateur et on le stocke dans la requête
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res
        .status(401)
        .json({ message: "Non autorisé: Utilisateur introuvable" });
    }

    // On ajoute l'utilisateur et son ID à l'objet de la requête pour les routes suivantes
    req.user = user;
    req.userId = user._id;

    // On continue vers la prochaine fonction de middleware ou la route
    next();
  } catch (err) {
    console.error("Erreur de vérification du token:", err);
    // Si la vérification échoue (token invalide ou expiré), on renvoie une erreur
    res.status(401).json({ message: "Non autorisé: Token invalide ou expiré" });
  }
};

export default auth;
