import express from "express";

// controllers
import { search, updateLink } from "../controllers/links.js";

const router = express.Router();

// support functionality for personal and fruit
router.get("/", search);

// router.post("/", createLink);
router.post("/", updateLink);

export default router;
