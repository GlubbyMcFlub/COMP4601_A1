import express from "express";

// controllers
import { createLink, getLinks, getPopular } from "../controllers/links.js";

const router = express.Router();

router.get("/", getLinks);
router.get("/popular", getPopular);

router.post("/", createLink);
// router.put("/", updateLink);

export default router;
