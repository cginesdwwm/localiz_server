import { body, validationResult } from "express-validator";

export const listingCreateValidation = [
  // The client form posts: image (url), location.name (as title), type, description
  body("images").optional().isArray(),
  body("title")
    .optional()
    .isString()
    .isLength({ min: 3 })
    .withMessage("Title too short"),
  body("type")
    .exists()
    .withMessage("Type is required")
    .isIn(["donation", "swap"])
    .withMessage("Invalid type"),
  body("description")
    .exists()
    .withMessage("Description is required")
    .isString()
    .isLength({ min: 20 })
    .withMessage("Description must be at least 20 characters"),
  body("location").optional().isObject(),
  body("location.name").optional().isString(),
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
    .withMessage("Title too short"),
  body("type")
    .optional()
    .isIn(["donation", "swap"])
    .withMessage("Invalid type"),
  body("description")
    .optional()
    .isString()
    .isLength({ min: 20 })
    .withMessage("Description must be at least 20 characters"),
  body("location").optional().isObject(),
  body("location.name").optional().isString(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    next();
  },
];
