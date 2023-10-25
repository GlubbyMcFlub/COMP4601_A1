import express from "express";

// controllers
import {
	createLink,
	getLinks,
	pageRank,
	score,
	getPopular,
	populateIndex,
	// searchLinks,
} from "../controllers/links.js";

const router = express.Router();

router.get("/", getLinks);

// router.get("/", searchLinks);
// router.get("/popular", getPopular);

router.post("/pageRank", pageRank);
router.post("/score", score);
router.post("/populate", populateIndex);
router.post("/", createLink);

export default router;
