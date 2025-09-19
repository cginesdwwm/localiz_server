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

// PUT /users/me - update profile fields
router.put("/me", authMiddleware, async (req, res) => {
  try {
    const {
      bio,
      showFirstName,
      showCity,
      firstName,
      lastName,
      username,
      email,
      phone,
      gender,
      birthday,
      postalCode,
      city,
      profilePhoto,
    } = req.body || {};

    const user = await User.findById(req.userId);
    if (!user)
      return res.status(404).json({ message: "Utilisateur introuvable" });

    // Helper to check uniqueness for username/email/phone
    const checkUnique = async (field, value) => {
      if (!value) return null;
      const q = {};
      q[field] = value;
      const exists = await User.findOne(q).select("_id");
      if (exists && exists._id.toString() !== req.userId) {
        return true;
      }
      return false;
    };

    if (bio !== undefined) {
      if (typeof bio !== "string" || bio.length > 120) {
        return res
          .status(400)
          .json({ message: "Bio invalide (max 120 caractères)" });
      }
      user.bio = bio;
    }

    if (showFirstName !== undefined) {
      if (typeof showFirstName !== "boolean") {
        return res
          .status(400)
          .json({ message: "showFirstName doit être booléen" });
      }
      user.showFirstName = showFirstName;
    }

    if (showCity !== undefined) {
      if (typeof showCity !== "boolean") {
        return res.status(400).json({ message: "showCity doit être booléen" });
      }
      user.showCity = showCity;
    }

    if (firstName !== undefined) {
      if (typeof firstName !== "string" || firstName.trim().length === 0) {
        return res.status(400).json({ message: "Prénom invalide" });
      }
      user.firstName = firstName.trim();
    }

    if (lastName !== undefined) {
      if (typeof lastName !== "string" || lastName.trim().length === 0) {
        return res.status(400).json({ message: "Nom invalide" });
      }
      user.lastName = lastName.trim();
    }

    if (username !== undefined) {
      if (typeof username !== "string" || username.trim().length < 2) {
        return res.status(400).json({ message: "Nom d'utilisateur invalide" });
      }
      const used = await checkUnique("username", username.trim());
      if (used)
        return res
          .status(400)
          .json({ message: "Nom d'utilisateur déjà utilisé" });
      user.username = username.trim();
    }

    if (email !== undefined) {
      if (
        typeof email !== "string" ||
        !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)
      ) {
        return res.status(400).json({ message: "Email invalide" });
      }
      const used = await checkUnique("email", email.trim());
      if (used) return res.status(400).json({ message: "Email déjà utilisé" });
      user.email = email.trim();
    }

    if (gender !== undefined) {
      if (typeof gender !== "string")
        return res.status(400).json({ message: "Gender invalide" });
      user.gender = gender;
    }

    if (birthday !== undefined) {
      const d = new Date(birthday);
      if (isNaN(d.getTime()))
        return res.status(400).json({ message: "Birthday invalide" });
      user.birthday = d;
    }

    if (postalCode !== undefined) {
      if (typeof postalCode !== "string" || postalCode.trim().length === 0) {
        return res.status(400).json({ message: "Postal code invalide" });
      }
      user.postalCode = postalCode.trim();
    }

    if (city !== undefined) {
      if (typeof city !== "string") {
        return res.status(400).json({ message: "City invalide" });
      }
      user.city = city.trim();
    }

    if (profilePhoto !== undefined) {
      if (typeof profilePhoto !== "string") {
        return res.status(400).json({ message: "profilePhoto invalide" });
      }
      // If client sent a full Supabase public URL, extract storage path portion
      // e.g. https://xyz.supabase.co/storage/v1/object/public/avatars/abc.jpg -> avatars/abc.jpg
      const marker = "/storage/v1/object/public/";
      let toStore = profilePhoto.trim();
      try {
        const idx = toStore.indexOf(marker);
        if (idx !== -1) {
          toStore = toStore.slice(idx + marker.length);
        }
      } catch (e) {}
      user.profilePhoto = toStore;
    }

    await user.save();
    const safe = user.toObject();
    delete safe.password;
    delete safe.__v;

    res.status(200).json({ user: safe, message: "Profil mis à jour" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
