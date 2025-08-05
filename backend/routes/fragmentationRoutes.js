import express from 'express';
import {
  getHorizontalFragmentation,
  getVerticalFragmentation,
} from '../controllers/fragmentationController.js';

const router = express.Router();
router.get('/horizontal', getHorizontalFragmentation);
router.get('/vertical', getVerticalFragmentation);
export default router;