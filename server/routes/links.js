import express from "express";

// controllers
import {
	getLinks,
	createLink,
	getPopular,
	populateIndex,
	searchLinks,
} from "../controllers/links.js";

const router = express.Router();

// support functionality for personal and fruit
router.get("/", getLinks);
router.get("/popular", getPopular);

router.post("/populate", populateIndex);
router.post("/", createLink);

export default router;
