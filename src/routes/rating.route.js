import express from "express";
import {
  addOrUpdateRating,
  deleteRating,
} from "../controllers/rating.controller.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/:blogId", protect, addOrUpdateRating);
router.delete("/:blogId", protect, deleteRating);

export default router;
