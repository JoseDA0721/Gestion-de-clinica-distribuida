// /routes/replicationRoutes.js
import express from 'express';
import {
  replicateMedicamentos,
  replicateNotaInformativa,
  syncMedicamentosEnNodosPostgres,
  getReplicationStatusByNode,
  getTableDataByNode
} from '../controllers/replicationController.js';

const router = express.Router();

// Ruta para ver el estado de las réplicas en un nodo
router.get('/status/:nodeName', getReplicationStatusByNode);

// --- Rutas para Acciones de Replicación ---

// Replicación UNIDIRECCIONAL: Inserta 10 medicamentos en el nodo primario
router.post('/unidirectional/medicamentos', replicateMedicamentos);

// Replicación UNIDIRECCIONAL: Sincroniza medicamentos en nodos Postgres
router.post('/unidirectional/sync-medicamentos/:nodeName', syncMedicamentosEnNodosPostgres);

// Replicación BIDIRECCIONAL: Inserta UNA nota informativa desde un nodo de origen
router.post('/bidirectional/notas/:sourceNode', replicateNotaInformativa);

// Obtener datos de una tabla específica en un nodo
router.get('/table-data/:nodeName/:tableName', getTableDataByNode);

export default router;