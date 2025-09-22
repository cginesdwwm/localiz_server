import { body, validationResult } from "express-validator";
import { LISTING_TAGS } from "../config/listing_tags.js";

export const listingCreateValidation = [
  // The client form posts: image (url), location.name (as title), type, description
  body("images").optional().isArray(),
  body("title")
    .optional()
    .isString()
    .isLength({ min: 3 })
    .withMessage("Titre trop court"),
  body("type")
    .exists()
    .withMessage("Le type est requis")
    .isIn(["donate", "swap"])
    .withMessage("Type invalide"),
  body("tags")
    .exists()
    .withMessage("La catégorie est requise")
    .isArray({ min: 1 })
    .withMessage("Sélectionnez au moins une catégorie"),
  body("tags.*").optional().isString().isIn(LISTING_TAGS),
  body("condition")
    .exists()
    .withMessage("L'état est requis")
    .isIn(["new", "like_new", "used"])
    .withMessage("État invalide"),
  body("description")
    .exists()
    .withMessage("La description est requise")
    .isString()
    .isLength({ min: 20 })
    .withMessage("La description doit contenir au moins 20 caractères"),
  body("location").optional().isObject(),
  body("location.postalCode")
    .optional()
    .isString()
    .isLength({ min: 5, max: 5 })
    .withMessage("Code postal invalide"),
  body("location.city").optional().isString().withMessage("Ville invalide"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    next();
  },
];

export const listingUpdateValidation = [
  body("images").optional().isArray(),
  body("title")
    .optional()
    .isString()
    .isLength({ min: 3 })
    .withMessage("Titre trop court"),
  body("type").optional().isIn(["donate", "swap"]).withMessage("Type invalide"),
  body("tags").optional().isArray({ min: 1 }),
  body("tags.*").optional().isString().isIn(LISTING_TAGS),
  body("condition")
    .optional()
    .isIn(["new", "like_new", "used"])
    .withMessage("État invalide"),
  body("description")
    .optional()
    .isString()
    .isLength({ min: 20 })
    .withMessage("La description doit contenir au moins 20 caractères"),
  body("location").optional().isObject(),
  body("location.postalCode")
    .optional()
    .isString()
    .isLength({ min: 5, max: 5 })
    .withMessage("Code postal invalide"),
  body("location.city").optional().isString().withMessage("Ville invalide"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    next();
  },
];
