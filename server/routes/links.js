import express from "express";

// controllers
import {
	createLink,
	getPopular,
	populateIndex,
	searchLinks,
} from "../controllers/links.js";

const router = express.Router();

router.get("/", searchLinks);
router.get("/popular", getPopular);

router.post("/populate", populateIndex);
router.post("/", createLink);

export default router;
