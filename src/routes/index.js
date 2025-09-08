/*
    server/src/routes/index.js
    - Ce fichier est le point d'entrée pour toutes les routes de l'API.
    - Il monte chaque routeur sur le chemin approprié (ex: /api/auth, /api/users).
*/

import express from "express";

import userRoutes from "./user.route.js";
import blogRoutes from "./blog.route.js";
import adminRoutes from "./admin.route.js";
import usersRoutes from "./users.js"; // Import du routeur users

import { authMiddleware, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Routes publiques
router.use("/blog", blogRoutes);
router.use("/user", userRoutes);

// Routes protégées avec le middleware d'authentification
// Montez le routeur "users" sur le chemin "/users"
router.use("/users", authMiddleware, usersRoutes);

// Routes d'administration, protégées par l'authentification et le rôle admin
router.use("/admin", authMiddleware, isAdmin, adminRoutes);

export default router;
