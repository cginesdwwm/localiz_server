/**
 * routes/users.js
 * Routes liées aux opérations utilisateur protégées.
 */

import express from "express";
import User from "../models/user.schema.js";
import { authMiddleware } from "../middlewares/authMiddleware.js"; // L'importation doit se faire par le nom

const router = express.Router();

// GET /users/me - retourne le profil de l'utilisateur authentifié
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password -__v");
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /users/me/theme - update user's theme preference
router.put("/me/theme", authMiddleware, async (req, res) => {
  try {
    const { theme } = req.body;
    if (!theme || (theme !== "dark" && theme !== "light")) {
      return res.status(400).json({ message: "Theme invalide" });
    }
    const user = await User.findById(req.userId);
    if (!user)
      return res.status(404).json({ message: "Utilisateur introuvable" });
    user.theme = theme;
    await user.save();
    res.json({ message: "Préférence thème mise à jour", theme: user.theme });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
