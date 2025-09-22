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
import Category from "../models/category.schema.js";

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
// Catégories (listing & deal)
// Récupérer toutes les catégories organisées par type
router.get("/categories", async (req, res) => {
  const [listing, deal] = await Promise.all([
    Category.find({ type: "listing" }).sort({ order: 1, name: 1 }),
    Category.find({ type: "deal" }).sort({ order: 1, name: 1 }),
  ]);
  res.json({ listing, deal });
});

// Créer une catégorie
router.post("/categories", async (req, res) => {
  const { type, name, active } = req.body;
  if (!type || !["listing", "deal"].includes(type)) {
    return res.status(400).json({ message: "Type invalide (listing ou deal)" });
  }
  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ message: "Nom de catégorie requis" });
  }
  const last = await Category.find({ type }).sort({ order: -1 }).limit(1);
  const nextOrder = last.length ? (last[0].order || 0) + 1 : 0;
  try {
    const cat = await Category.create({
      type,
      name: name.trim(),
      active: active !== undefined ? !!active : true,
      order: nextOrder,
    });
    res.status(201).json({ message: "Catégorie créée", category: cat });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "Cette catégorie existe déjà pour ce type" });
    }
    res.status(500).json({ message: "Erreur lors de la création" });
  }
});

// Mettre à jour une catégorie (nom, active)
router.put("/categories/:id", async (req, res) => {
  const { name, active } = req.body;
  const update = {};
  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Nom invalide" });
    }
    update.name = name.trim();
  }
  if (active !== undefined) update.active = !!active;

  try {
    const cat = await Category.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!cat) return res.status(404).json({ message: "Catégorie introuvable" });
    res.json({ message: "Catégorie mise à jour", category: cat });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "Cette catégorie existe déjà pour ce type" });
    }
    res.status(500).json({ message: "Erreur lors de la mise à jour" });
  }
});

// Supprimer une catégorie
router.delete("/categories/:id", async (req, res) => {
  const deleted = await Category.findByIdAndDelete(req.params.id);
  if (!deleted)
    return res.status(404).json({ message: "Catégorie introuvable" });
  res.json({ message: "Catégorie supprimée" });
});

// Réordonner une catégorie (monter/descendre)
router.patch("/categories/:id/move", async (req, res) => {
  const { direction } = req.body; // 'up' | 'down'
  if (!direction || !["up", "down"].includes(direction)) {
    return res.status(400).json({ message: "Direction invalide" });
  }
  const cat = await Category.findById(req.params.id);
  if (!cat) return res.status(404).json({ message: "Catégorie introuvable" });

  const delta = direction === "up" ? -1 : 1;
  const neighbor = await Category.findOne({
    type: cat.type,
    order: { [delta === -1 ? "$lt" : "$gt"]: cat.order },
  })
    .sort({ order: delta === -1 ? -1 : 1 })
    .limit(1);

  if (!neighbor) {
    return res.json({
      message: "Aucun réordonnancement nécessaire",
      category: cat,
    });
  }

  const currentOrder = cat.order || 0;
  const neighborOrder = neighbor.order || 0;
  cat.order = neighborOrder;
  neighbor.order = currentOrder;
  await Promise.all([cat.save(), neighbor.save()]);
  res.json({ message: "Ordre mis à jour", category: cat });
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

  const q = (req.query.q || "").trim();
  const sort = req.query.sort || "createdAt";
  const dir = req.query.dir === "desc" ? -1 : 1;

  // build filter
  const filter = {};
  if (q) {
    // search by username, email or id
    filter.$or = [
      { username: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { _id: q },
    ];
  }

  const sortObj = {};
  // protect against arbitrary fields and allow 'id' to map to _id
  const allowedSort = ["username", "email", "createdAt", "role", "id"];
  const key =
    sort === "id" ? "_id" : allowedSort.includes(sort) ? sort : "createdAt";
  sortObj[key] = dir;

  const [items, total] = await Promise.all([
    User.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .select("username email role createdAt"),
    User.countDocuments(filter),
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
