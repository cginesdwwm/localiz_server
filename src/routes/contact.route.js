import express from "express";
import { body } from "express-validator";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  postContact,
  listContacts,
} from "../controllers/contact.controller.js";
import { authMiddleware, isAdmin } from "../middlewares/authMiddleware.js";

// Simple in-memory rate limiter for contact form to reduce spam attacks.
// Allows `max` requests per `windowMs` per IP. This is sufficient for
// small deployments or demos; in production use a shared store (Redis).
const rateLimitMap = new Map();
const rateLimiter = (opts = { windowMs: 60 * 60 * 1000, max: 5 }) => {
  const { windowMs, max } = opts;
  return (req, res, next) => {
    try {
      const ip =
        req.ip ||
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress;
      const now = Date.now();
      const entry = rateLimitMap.get(ip) || { count: 0, reset: now + windowMs };
      if (now > entry.reset) {
        entry.count = 0;
        entry.reset = now + windowMs;
      }
      entry.count += 1;
      rateLimitMap.set(ip, entry);
      if (entry.count > max) {
        const retryAfter = Math.ceil((entry.reset - now) / 1000);
        res.setHeader("Retry-After", String(retryAfter));
        return res
          .status(429)
          .json({ message: "Trop de requêtes — réessayez plus tard." });
      }
      return next();
    } catch (err) {
      return next();
    }
  };
};

const router = express.Router();

// POST /contact
router.post(
  "/",
  rateLimiter({ windowMs: 60 * 60 * 1000, max: 5 }),
  [
    body("name").trim().notEmpty().withMessage("Le nom est requis"),
    body("email")
      .trim()
      .normalizeEmail()
      .isEmail()
      .withMessage("Email invalide"),
    body("subject")
      .trim()
      .notEmpty()
      .withMessage("L'objet est requis")
      .isLength({ max: 150 })
      .withMessage("L'objet ne peut pas dépasser 150 caractères"),
    body("message")
      .trim()
      .isLength({ min: 20 })
      .withMessage("Le message est trop court"),
  ],
  validateRequest,
  postContact
);

// Admin: list messages (paginated)
router.get("/", authMiddleware, isAdmin, listContacts);

// Admin: archive (soft-delete) a message
router.delete("/:id", authMiddleware, isAdmin, (req, res, next) => {
  // forward to controller
  import("../controllers/contact.controller.js").then((m) =>
    m.archiveContact(req, res, next)
  );
});

// Admin: restore an archived message
router.patch("/unarchive/:id", authMiddleware, isAdmin, (req, res, next) => {
  import("../controllers/contact.controller.js").then((m) =>
    m.unarchiveContact(req, res, next)
  );
});

export default router;
