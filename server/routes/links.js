import express from "express";

// controllers
import {
	calculatePageRank,
	indexLinks,
	search,
	updateLink,
} from "../controllers/links.js";

const router = express.Router();

// support functionality for personal and fruit
router.get("/", (req, res) => {
	search(req, res, "fruits");
});

// For /personal route
router.get("/", (req, res) => {
	search(req, res, "personal");
});

router.put("/", (req, res) => {
	updateLink(req, res, "fruits");
});

// For /personal route
router.put("/", (req, res) => {
	updateLink(req, res, "personal");
});

router.patch("/pageRank", calculatePageRank);
router.patch("/score", indexLinks);

export default router;
