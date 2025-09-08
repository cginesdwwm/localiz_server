import express from "express";
import { createBlog, getAllBlogs } from "../controllers/blog.controller.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", getAllBlogs);
// on passe par le middleware avant d'aller sur le controller
// si c'est valide, l'utilisateur est attaché à la requête
router.post("/", protect, createBlog);

export default router;
