import express from "express";
import {
  addOrUpdateRating,
  deleteRating,
  getUserRatingStats,
} from "../controllers/rating.controller.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Noter un utilisateur (profil)
router.post("/user/:userId", protect, addOrUpdateRating);
router.delete("/user/:userId", protect, deleteRating);

// Stats publiques d'un utilisateur (moyenne, nombre de notes)
router.get("/user/:userId/stats", getUserRatingStats);

export default router;
