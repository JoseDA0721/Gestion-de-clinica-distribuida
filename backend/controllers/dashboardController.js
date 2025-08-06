import poolQuito from '../config/dbQuito.js';
import poolGuayaquil from '../config/dbGuayaquil.js';
import poolCuenca from '../config/dbCuenca.js';

const dbPools = {
  quito: { pool: poolQuito, type: 'pg', dbms: 'PostgreSQL', ip: '26.44.192.25' },
  guayaquil: { pool: poolGuayaquil, type: 'pg', dbms: 'PostgreSQL', ip: '26.26.58.209' },
  cuenca: { pool: poolCuenca, type: 'sql', dbms: 'MS SQL Server', ip: '26.8.200.66' },
};

/**
 * Obtiene un resumen completo del estado de todos los nodos y los conteos globales.
 */
export const getDashboardSummary = async (req, res) => {
  const nodeStatusPromises = Object.keys(dbPools).map(async (nodeName) => {
    const nodeInfo = dbPools[nodeName];
    try {
      // Hacemos una consulta simple para verificar si el nodo está en línea
      if (nodeInfo.type === 'pg') {
        await nodeInfo.pool.query('SELECT 1');
      } else {
        await nodeInfo.pool.request().query('SELECT 1');
      }
      return {
        name: nodeName.charAt(0).toUpperCase() + nodeName.slice(1),
        dbms: nodeInfo.dbms,
        ip: nodeInfo.ip,
        status: 'En línea',
      };
    } catch (error) {
      return {
        name: nodeName.charAt(0).toUpperCase() + nodeName.slice(1),
        dbms: nodeInfo.dbms,
        ip: nodeInfo.ip,
        status: 'Fuera de línea',
      };
    }
  });

  // Función auxiliar para obtener conteos de una tabla en un nodo
  const getCount = async (nodeName, tableName) => {
      try {
        const connection = dbPools[nodeName];
        const query = `SELECT COUNT(*) as count FROM ${tableName}`;
        if (connection.type === 'pg') {
            const result = await connection.pool.query(query);
            return parseInt(result.rows[0].count);
        } else {
            const result = await connection.pool.request().query(query);
            return parseInt(result.recordset[0].count);
        }
      } catch (e) {
          return 0; // Si hay un error (ej. nodo caído), contamos como 0
      }
  };

  try {
    // Ejecutamos todas las promesas en paralelo
    const nodeStatuses = await Promise.all(nodeStatusPromises);
    
    // Calculamos los conteos globales
    const medicamentosCount = await getCount('cuenca', 'Medicamentos'); // Cuenca es la fuente de verdad
    const notasQuito = await getCount('quito', 'NotasInformativas');
    const notasGuayaquil = await getCount('guayaquil', 'NotasInformativas');
    const notasCuenca = await getCount('cuenca', 'NotasInformativas');
    // Sumamos para tener un total, aunque podrían no estar 100% sincronizadas
    const notasTotales = notasQuito + notasGuayaquil + notasCuenca;

    const summary = {
      nodes: nodeStatuses,
      globalSummary: {
        medicamentosCount: medicamentosCount,
        notasInformativasCount: notasTotales,
      },
    };

    res.json(summary);

  } catch (error) {
    res.status(500).json({ message: 'Error al generar el resumen del dashboard', error: error.message });
  }
};
