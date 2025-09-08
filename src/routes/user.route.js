import express from "express";
import { authMiddleware } from "../middlewares/auth.js";
import {
  login,
  logoutUser,
  register,
  forgotPassword,
  resetPassword,
  verifyMail,
  changePassword,
  deleteAccount,
  getMe,
} from "../controllers/user.controller.js";

const router = express.Router();

// Routes publiques
router.post("/register", register);
router.get("/verifyMail/:token", verifyMail);
router.post("/login", login);
router.post("/logout", logoutUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Routes protégées par authMiddleware
// Le /me ici est un endpoint REST qui représente l'utilisateur authentifié
router.get("/me", authMiddleware, getMe);
router.put("/change-password", authMiddleware, changePassword);
router.delete("/me", authMiddleware, deleteAccount);

export default router;
