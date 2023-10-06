import express from 'express';  

// controllers
import { getLinks, getPopular, createLink } from '../controllers/links.js';

const router = express.Router();

router.get('/', getLinks);
router.get('/popular', getPopular);

router.post('/', createLink);

export default router;