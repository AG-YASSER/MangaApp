// searchRoutes.js
import express from "express";
import {
  globalSearch,
  getSearchSuggestions,
  advancedSearch,
  getGenresWithCounts,
} from "../controllers/searchController.js";

const router = express.Router();

// Public routes
router.get("/", globalSearch);                 // /api/search?q=naruto&type=manga&page=1
router.get("/suggestions", getSearchSuggestions); // /api/search/suggestions?q=nar
router.get("/advanced", advancedSearch);       // /api/search/advanced?title=one&genre=action&minRating=4
router.get("/genres", getGenresWithCounts);    // /api/search/genres

export default router;