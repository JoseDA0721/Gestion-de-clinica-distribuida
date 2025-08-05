import express from 'express';
import { handleReplication } from '../controllers/replicationController.js';

const router = express.Router();

// Una sola ruta para manejar todas las replicaciones (unidireccionales y bidireccionales)
// Ejemplo: POST /api/replication/quito/to/guayaquil
// Corresponde a los botones de "Réplica SOx a SOy" [cite: 107, 108, 110, 111, 112, 113]
router.post('/:sourceNode/to/:destinationNode', handleReplication);

export default router;