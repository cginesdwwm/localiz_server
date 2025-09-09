import express from "express";
import {
  getDeals,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal,
} from "../controllers/deal.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  dealCreateValidation,
  dealUpdateValidation,
} from "../middlewares/dealValidation.js";

const router = express.Router();

router.get("/", getDeals);
router.get("/:id", getDealById);
router.post("/", authMiddleware, dealCreateValidation, createDeal);
router.patch("/:id", authMiddleware, dealUpdateValidation, updateDeal);
router.delete("/:id", authMiddleware, deleteDeal);

export default router;
