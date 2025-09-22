import { body, validationResult } from "express-validator";
import { DEAL_TAGS } from "../config/deal_tags.js";

export const dealCreateValidation = [
  // Fields sent by the AddDealForm
  body("image")
    .exists()
    .withMessage("Image requise")
    .isString()
    .bail()
    .notEmpty()
    .withMessage("Image requise"),
  body("title")
    .exists()
    .withMessage("Titre requis")
    .isString()
    .isLength({ min: 3 })
    .withMessage("Titre trop court"),
  body("startDate")
    .exists()
    .withMessage("Date de début requise")
    .isISO8601()
    .toDate(),
  body("endDate").optional({ nullable: true }).isISO8601().toDate(),

  // Location: form provides locationName, address, zone -> server receives location.address at minimum (form requires address)
  body("location").exists().withMessage("Objet 'location' requis").isObject(),
  body("location.address").exists().withMessage("Adresse requise").isString(),
  body("location.name").optional().isString(),
  body("location.zone").optional().isString(),

  // Access conditions come as an object with a 'type' (required) and optional price when type === 'paid'
  body("accessConditions")
    .exists()
    .withMessage("Conditions d'accès requises")
    .isObject(),
  body("accessConditions.type")
    .exists()
    .withMessage("Type de conditions d'accès requis")
    .isIn(["free", "paid", "reservation", "reduction"])
    .withMessage("Type de conditions d'accès invalide"),
  body("accessConditions.price")
    .if(body("accessConditions.type").equals("paid"))
    .exists()
    .withMessage("Prix requis pour l'accès payant")
    .isFloat({ gt: 0 })
    .withMessage("Le prix doit être un nombre positif"),

  // Website optional
  body("website").optional().isURL().withMessage("URL invalide"),
  body("images")
    .optional()
    .isArray()
    .withMessage("Le champ images doit être un tableau"),
  body("images.*")
    .optional()
    .isString()
    .withMessage("Chaque image doit être une URL (texte)"),
  body("images").custom((value, { req }) => {
    const countExtras = Array.isArray(value) ? value.length : 0;
    const hasPrimary =
      typeof req.body.image === "string" && req.body.image.trim() !== "";
    const total = countExtras + (hasPrimary ? 1 : 0);
    if (total > 4) {
      throw new Error("Maximum 4 images autorisées (image principale incluse)");
    }
    return true;
  }),

  // Description required and enforced >= 20 chars (form requires this)
  body("description")
    .exists()
    .withMessage("Description requise")
    .isString()
    .isLength({ min: 20 })
    .withMessage("La description doit contenir au moins 20 caractères"),

  // Tag: required single select from predefined values
  body("tag")
    .exists()
    .withMessage("Catégorie requise")
    .isIn(DEAL_TAGS)
    .withMessage("Tag invalide"),

  // result check
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const dealUpdateValidation = [
  // Only validate fields that can come from the frontend forms / edits
  body("image").optional().isString(),
  body("title")
    .optional()
    .isString()
    .isLength({ min: 3 })
    .withMessage("Title too short"),
  body("startDate").optional().isISO8601().toDate(),
  body("endDate").optional().isISO8601().toDate(),

  body("location").optional().isObject(),
  body("location.address").optional().isString(),
  body("location.name").optional().isString(),
  body("location.zone").optional().isString(),

  body("accessConditions").optional().isObject(),
  body("accessConditions.type")
    .optional()
    .isIn(["free", "paid", "reservation", "reduction"])
    .withMessage("Invalid accessConditions.type"),
  body("accessConditions.price")
    .if(body("accessConditions.type").equals("paid"))
    .exists()
    .withMessage("Price required for paid access")
    .isFloat({ gt: 0 })
    .withMessage("Price must be a positive number"),

  body("website").optional().isURL().withMessage("Website must be a valid URL"),
  body("images").optional().isArray().withMessage("images must be an array"),
  body("images.*")
    .optional()
    .isString()
    .withMessage("each image must be a URL string"),
  body("images")
    .optional()
    .custom((value, { req }) => {
      const countExtras = Array.isArray(value) ? value.length : 0;
      const hasPrimary =
        typeof req.body.image === "string" && req.body.image.trim() !== "";
      const total = countExtras + (hasPrimary ? 1 : 0);
      if (total > 4) {
        throw new Error(
          "A maximum of 4 images is allowed (including primary image)"
        );
      }
      return true;
    }),
  body("description")
    .optional()
    .isString()
    .isLength({ min: 20 })
    .withMessage("Description must be at least 20 characters"),

  body("tag").optional().isIn(DEAL_TAGS).withMessage("Tag invalide"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
