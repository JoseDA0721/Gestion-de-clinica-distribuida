import poolQuito from '../config/dbQuito.js';
import poolGuayaquil from '../config/dbGuayaquil.js';
import poolCuenca from '../config/dbCuenca.js';
import fs from 'fs/promises';
import path from 'path';

// Mapeo de nombres de nodo a sus pools de conexión
const dbPools = {
  quito: { pool: poolQuito, type: 'pg' },
  guayaquil: { pool: poolGuayaquil, type: 'pg' },
  cuenca: { pool: poolCuenca, type: 'sql' },
};

export const handleReplication = async (req, res) => {
  const { sourceNode, destinationNode } = req.params;
  const table = 'tu_tabla_a_replicar'; // Especifica la tabla

  try {
    const sourceDB = dbPools[sourceNode];
    // const destinationDB = dbPools[destinationNode]; // Para verificación

    if (!sourceDB) {
      return res.status(400).json({ message: "Nodo de origen no válido." });
    }

    // 1. Leer el script para insertar 10 registros [cite: 59]
    const scriptSQL = await fs.readFile(path.resolve('scripts/sql/insert_10_records.sql'), 'utf-8');

    // 2. Ejecutar el script en el nodo de origen
    if (sourceDB.type === 'pg') {
      await sourceDB.pool.query(scriptSQL);
    } else if (sourceDB.type === 'sql') {
      await sourceDB.pool.request().query(scriptSQL);
    }
    
    // Aquí iría la lógica para obtener conteos antes/después y verificar la replicación [cite: 58, 60, 62]

    res.json({
      message: `Proceso de réplica de ${sourceNode} a ${destinationNode} iniciado.`,
      status: "Se insertaron 10 registros en el nodo de origen. Verifica la replicación en el nodo destino."
    });
  } catch (error) {
    res.status(500).json({ message: 'Error durante la replicación', error: error.message });
  }
};