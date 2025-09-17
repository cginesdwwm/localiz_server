/*
    server/src/routes/index.js
    - Ce fichier est le point d'entrée pour toutes les routes de l'API.
    - Il monte chaque routeur sur le chemin approprié (ex: /api/auth, /api/users).
*/

import express from "express";

import userRoutes from "./user.route.js";
import blogRoutes from "./blog.route.js";
import ratingRoutes from "./rating.route.js";
import adminRoutes from "./admin.route.js";
import usersRoutes from "./users.js"; // Import du routeur users
import dealRoutes from "./deal.route.js";
import listingRoutes from "./listing.route.js";
import utilsRoutes from "./utils.js";

import { authMiddleware, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Minimal public health endpoint for uptime checks (no auth)
router.get("/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Routes publiques
router.use("/blog", blogRoutes);
router.use("/user", userRoutes);
router.use("/utils", utilsRoutes);
router.use("/rating", ratingRoutes);
router.use("/deals", dealRoutes);
router.use("/listings", listingRoutes);

// Routes protégées avec le middleware d'authentification
// Montez le routeur "users" sur le chemin "/users"
router.use("/users", authMiddleware, usersRoutes);

// Routes d'administration, protégées par l'authentification et le rôle admin
router.use("/admin", authMiddleware, isAdmin, adminRoutes);

export default router;
