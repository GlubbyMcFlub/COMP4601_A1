import express from "express";

// controllers
import { createLink, getPopular, searchLinks } from "../controllers/links.js";

const router = express.Router();

router.get("/", searchLinks);
router.get("/popular", getPopular);

router.post("/", createLink);

export default router;
