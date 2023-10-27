import express from "express";

// controllers
import {
	calculatePageRank,
	indexLinks,
	search,
	updateLink,
} from "../controllers/links.js";

const router = express.Router();

// SEARCH
router.get("/fruits", (req, res) => {
	search(req, res, "fruits");
});

router.get("/personal", (req, res) => {
	search(req, res, "personal");
});

// UPDATE
router.put("/fruits", (req, res) => {
	updateLink(req, res, "fruits");
});

router.put("/personal", (req, res) => {
	updateLink(req, res, "personal");
});

// PAGERANK
router.patch("/fruits/pageRank", (req, res) => {
	calculatePageRank(req, res, "fruits");
});

router.patch("/personal/pageRank", (req, res) => {
	calculatePageRank(req, res, "personal");
});

// SCORE
router.patch("/fruits/score", (req, res) => {
	indexLinks(req, res, "fruits");
});

router.patch("/personal/score", (req, res) => {
	indexLinks(req, res, "personal");
});

export default router;
