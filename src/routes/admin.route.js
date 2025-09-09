/*
  server/src/routes/admin.route.js
  - Ce fichier contient les routes qui sont accessibles uniquement aux administrateurs.
  - Ces routes utilisent le middleware 'auth' pour vérifier que l'utilisateur est authentifié.
  - Par la suite, vous pouvez ajouter un middleware 'admin' pour vérifier son rôle.
*/

import express from "express";
import User from "../models/user.schema.js";
import Deal from "../models/deal.schema.js";
import Listing from "../models/listing.schema.js";

// Importation correcte des fonctions de middleware nommées
import { authMiddleware, isAdmin } from "../middlewares/authMiddleware.js";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

const router = express.Router();

// Appliquez les deux middlewares à toutes les routes de ce routeur.
// 1. `authMiddleware` vérifie si l'utilisateur est authentifié.
// 2. `isAdmin` vérifie si l'utilisateur a le rôle d'administrateur.
// Si ces deux vérifications réussissent, l'accès aux routes est autorisé.
router.use(authMiddleware, isAdmin);

// Sanity check (maintenant protégé et réservé aux admins)
router.get("/health", async (req, res) => {
  const env = process.env.NODE_ENV || "development";
  const uptime = process.uptime();
  const time = new Date().toISOString();

  // DB check: mongoose.connection.readyState -> 1 = connected
  let db = "unknown";
  try {
    const state = mongoose.connection.readyState;
    db = state === 1 ? "ok" : "disconnected";
  } catch (err) {
    db = "error";
  }

  // Lire la version de package.json si disponible
  let version = "-";
  try {
    const pkgPath = path.resolve(process.cwd(), "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    version = pkg.version || pkg?.version || "-";
  } catch (err) {
    version = "-";
  }

  res.json({ ok: db === "ok", env, time, uptime, db, version });
});

// Stats simples (réservé aux admins)
router.get("/stats", async (req, res) => {
  const users = await User.countDocuments();
  res.json({ users });
});

// Overview: counts and simple last-7-days series for users and deals
router.get("/overview", async (req, res) => {
  const usersCount = await User.countDocuments();
  const dealsCount = await Deal.countDocuments();
  const listingsCount = await Listing.countDocuments();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 6); // 7 days including today

  // aggregate users by day
  const usersAgg = await User.aggregate([
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
  ]);

  const dealsAgg = await Deal.aggregate([
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
  ]);

  const listingsAgg = await Listing.aggregate([
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
  ]);

  // Build arrays for last 7 days
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const s = d.toISOString().slice(0, 10);
    days.push(s);
  }

  const usersMap = Object.fromEntries(usersAgg.map((r) => [r._id, r.count]));
  const dealsMap = Object.fromEntries(dealsAgg.map((r) => [r._id, r.count]));

  const usersSeries = days.map((day) => ({ day, count: usersMap[day] || 0 }));
  const dealsSeries = days.map((day) => ({ day, count: dealsMap[day] || 0 }));
  const listingsMap = Object.fromEntries(
    listingsAgg.map((r) => [r._id, r.count])
  );
  const listingsSeries = days.map((day) => ({
    day,
    count: listingsMap[day] || 0,
  }));

  res.json({
    users: usersCount,
    deals: dealsCount,
    listings: listingsCount,
    usersSeries,
    dealsSeries,
    listingsSeries,
  });
});
// Activité récente: derniers utilisateurs inscrits, bons plans et annonces (jusqu'à 25)
router.get("/recent", async (req, res) => {
  const recentUsers = await User.find()
    .sort({ createdAt: -1 })
    .limit(25)
    .select("username email createdAt");

  const recentDeals = await Deal.find()
    .sort({ createdAt: -1 })
    .limit(25)
    .select("title author createdAt")
    .populate("author", "username email");

  const recentListings = await Listing.find()
    .sort({ createdAt: -1 })
    .limit(25)
    .select("title owner createdAt")
    .populate("owner", "username email");

  res.json({ recentUsers, recentDeals, recentListings });
});

// Liste utilisateurs
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
