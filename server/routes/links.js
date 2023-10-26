import express from "express";

// controllers
import {
  search,
  updateLink,
  calculatePageRank,
  indexLinks,
} from "../controllers/links.js";

const router = express.Router();

// support functionality for personal and fruit
router.get("/", search);

// router.post("/", createLink);
router.put("/", updateLink);

router.patch("/pageRank", calculatePageRank);
router.patch("/score", indexLinks);

export default router;
