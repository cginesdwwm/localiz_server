import { body, validationResult } from "express-validator";

export const dealCreateValidation = [
  // Fields sent by the AddDealForm
  body("image").exists().withMessage("Image is required").isString(),
  body("title")
    .exists()
    .withMessage("Title is required")
    .isString()
    .isLength({ min: 3 })
    .withMessage("Title too short"),
  body("startDate")
    .exists()
    .withMessage("startDate is required")
    .isISO8601()
    .toDate(),
  body("endDate").optional({ nullable: true }).isISO8601().toDate(),

  // Location: form provides locationName, address, zone -> server receives location.address at minimum (form requires address)
  body("location").exists().withMessage("Location object required").isObject(),
  body("location.address")
    .exists()
    .withMessage("Address is required")
    .isString(),
  body("location.name").optional().isString(),
  body("location.zone").optional().isString(),

  // Access conditions come as an object with a 'type' (required) and optional price when type === 'paid'
  body("accessConditions")
    .exists()
    .withMessage("accessConditions required")
    .isObject(),
  body("accessConditions.type")
    .exists()
    .withMessage("accessConditions.type required")
    .isIn(["free", "paid", "reservation", "reduction"])
    .withMessage("Invalid accessConditions.type"),
  body("accessConditions.price")
    .if(body("accessConditions.type").equals("paid"))
    .exists()
    .withMessage("Price required for paid access")
    .isFloat({ gt: 0 })
    .withMessage("Price must be a positive number"),

  // Website optional
  body("website").optional().isURL().withMessage("Website must be a valid URL"),

  // Description required and enforced >= 20 chars (form requires this)
  body("description")
    .exists()
    .withMessage("Description is required")
    .isString()
    .isLength({ min: 20 })
    .withMessage("Description must be at least 20 characters"),

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
  body("description")
    .optional()
    .isString()
    .isLength({ min: 20 })
    .withMessage("Description must be at least 20 characters"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
