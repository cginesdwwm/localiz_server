import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { body } from "express-validator";
import { authRateLimiter } from "../middlewares/rateLimiter.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  login,
  logoutUser,
  register,
  forgotPassword,
  resetPassword,
  verifyMail,
  confirmEmail,
  changePassword,
  deleteAccount,
  requestAccountDeletion,
  getMe,
} from "../controllers/user.controller.js";

const router = express.Router();

// Routes publiques
router.post(
  "/register",
  authRateLimiter,
  [
    body("username").isLength({ min: 4 }).withMessage("Pseudo invalide"),
    body("email").isEmail().withMessage("Email invalide"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Mot de passe trop court"),
    body("birthday")
      .notEmpty()
      .withMessage("Date de naissance requise")
      .isISO8601()
      .withMessage("Date de naissance invalide"),
    body("agreeToTerms")
      .custom((value) => value === true || value === "true")
      .withMessage("Vous devez accepter les conditions pour continuer."),
  ],
  validateRequest,
  register
);
router.get("/verifyMail/:token", verifyMail);
router.post("/confirm-email", confirmEmail);
router.post(
  "/login",
  authRateLimiter,
  [
    body("data").notEmpty().withMessage("Identifiant requis"),
    body("password").notEmpty().withMessage("Mot de passe requis"),
  ],
  validateRequest,
  login
);
router.post("/logout", logoutUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Routes protégées par authMiddleware
// Le /me ici est un endpoint REST qui représente l'utilisateur authentifié
router.get("/me", authMiddleware, getMe);
router.put("/change-password", authMiddleware, changePassword);
router.delete("/me", authMiddleware, deleteAccount);
router.post("/me/delete-request", authMiddleware, requestAccountDeletion);

export default router;
