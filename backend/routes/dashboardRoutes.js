import express from 'express';
import { getDashboardSummary } from '../controllers/dashboardController.js';

const router = express.Router();

// Endpoint para obtener el estado de todos los nodos y el resumen global
router.get('/summary', getDashboardSummary);

export default router;
