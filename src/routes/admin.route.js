/*
  server/src/routes/admin.route.js
  - Ce fichier contient les routes qui sont accessibles uniquement aux administrateurs.
  - Ces routes utilisent le middleware 'auth' pour vérifier que l'utilisateur est authentifié.
  - Par la suite, vous pouvez ajouter un middleware 'admin' pour vérifier son rôle.
*/

import express from "express";
import User from "../models/user.schema.js";

// Importation correcte des fonctions de middleware nommées
import { authMiddleware, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Appliquez les deux middlewares à toutes les routes de ce routeur.
// 1. `authMiddleware` vérifie si l'utilisateur est authentifié.
// 2. `isAdmin` vérifie si l'utilisateur a le rôle d'administrateur.
// Si ces deux vérifications réussissent, l'accès aux routes est autorisé.
router.use(authMiddleware, isAdmin);

// Sanity check (maintenant protégé et réservé aux admins)
router.get("/health", (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || "development" });
});

// Stats simples (réservé aux admins)
router.get("/stats", async (req, res) => {
  const users = await User.countDocuments();
  res.json({ users });
});

// Liste utilisateurs (pagination simple)
router.get("/users", async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    User.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-password"),
    User.countDocuments(),
  ]);

  res.json({ items, total, page, pages: Math.ceil(total / limit) });
});

// Détail utilisateur
router.get("/users/:id", async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) {
    return res.status(404).json({ message: "Utilisateur introuvable" });
  }
  res.json(user);
});

// Promouvoir / rétrograder
router.patch("/users/:id/role", async (req, res) => {
  const { role } = req.body; // "user" | "admin"
  if (!["user", "admin"].includes(role)) {
    return res.status(400).json({ message: "Rôle invalide" });
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  ).select("-password");

  if (!user) {
    return res.status(404).json({ message: "Utilisateur introuvable" });
  }
  res.json({ message: "Rôle mis à jour", user });
});

// Supprimer utilisateur
router.delete("/users/:id", async (req, res) => {
  const deleted = await User.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: "Utilisateur introuvable" });
  }
  res.json({ message: "Utilisateur supprimé" });
});

export default router;
