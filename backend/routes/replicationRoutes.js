// /routes/replicationRoutes.js
import express from 'express';
import {
  executeUnidirectionalReplication,
  executeBidirectionalReplication,
  getReplicationStatusByNode,
  getTableDataByNode
} from '../controllers/replicationController.js';

const router = express.Router();

// --- RUTAS PARA VER ESTADO Y DATOS (sin cambios) ---
router.get('/status/:nodeName', getReplicationStatusByNode);
router.get('/table-data/:nodeName/:tableName', getTableDataByNode);


// --- RUTAS PARA PROCESOS COMPLETOS DE REPLICACIÓN ---

// Ejecuta el proceso COMPLETO de replicación unidireccional
// Inserta en Cuenca y luego sincroniza en los nodos de Postgres.
router.post('/unidirectional/execute-full-process', executeUnidirectionalReplication);

// Ejecuta el proceso COMPLETO de replicación bidireccional
// Inserta 10 notas en el nodo de origen y luego invoca el mecanismo de réplica.
router.post('/bidirectional/execute-full-process/:sourceNode', executeBidirectionalReplication);


export default router;
