import express from "express";
import {
  getListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
} from "../controllers/listing.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  listingCreateValidation,
  listingUpdateValidation,
} from "../middlewares/listingValidation.js";

const router = express.Router();

router.get("/", getListings);
router.get("/:id", getListingById);
router.post("/", authMiddleware, listingCreateValidation, createListing);
router.patch("/:id", authMiddleware, listingUpdateValidation, updateListing);
router.delete("/:id", authMiddleware, deleteListing);

export default router;
