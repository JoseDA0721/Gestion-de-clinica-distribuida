// Este archivo de rutas ya es correcto y compatible con el controlador de arriba
import express from 'express';
import {
  getHorizontalFragmentsByNode,
  getVerticalFragmentsByNode,
} from '../controllers/fragmentationController.js';

const router = express.Router();
router.get('/horizontal/:nodeName', getHorizontalFragmentsByNode);
router.get('/vertical/:nodeName', getVerticalFragmentsByNode);
export default router;