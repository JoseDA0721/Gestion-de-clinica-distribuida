import poolQuito from '../config/dbQuito.js';
import poolGuayaquil from '../config/dbGuayaquil.js';
import poolCuenca from '../config/dbCuenca.js';

// Mapeo de nodos para facilitar el acceso
const nodeConnections = {
  quito: { pool: poolQuito, type: 'pg', dbms: 'PostgreSQL' },
  guayaquil: { pool: poolGuayaquil, type: 'pg', dbms: 'PostgreSQL' },
  cuenca: { pool: poolCuenca, type: 'sql', dbms: 'MS SQL Server' },
};

// --- FUNCIÓN AUXILIAR ---
// Para no repetir el código que diferencia entre PostgreSQL y SQL Server
const executeQuery = async (connection, query) => {
  if (connection.type === 'pg') {
    const result = await connection.pool.query(query);
    return result.rows;
  } else { // 'sql'
    const result = await connection.pool.request().query(query);
    return result.recordset;
  }
};


// --- CONTROLADORES EXPORTADOS ---

/**
 * Obtiene solo los fragmentos horizontales y derivados de un único nodo.
 */
export const getHorizontalFragmentsByNode = async (req, res) => {
  const { nodeName } = req.params;
  const connection = nodeConnections[nodeName];

  if (!connection) {
    return res.status(404).json({ message: 'Nodo no encontrado' });
  }

  const capitalizedNodeName = nodeName.charAt(0).toUpperCase() + nodeName.slice(1);
  let fragments = [];

  try {
    const horizontalTables = ['Pacientes', 'Doctores', 'InventarioMedicamentos', 'Citas', 'Recetas'];

    for (const tableName of horizontalTables) {
      // 1. Construimos el nombre completo de la tabla en JavaScript (Forma CORRECTA)
      const fullTableName = `${tableName}_${capitalizedNodeName}`;
      // 2. Ejecutamos la consulta usando la función auxiliar
      const data = await executeQuery(connection, `SELECT * FROM ${fullTableName}`);
      fragments.push({ fragmentName: `${fullTableName} (Horizontal/Derivada)`, data });
    }

    res.json({
      node: nodeName,
      dbms: connection.dbms,
      fragments: fragments,
    });

  } catch (error) {
    res.status(500).json({ message: `Error al obtener fragmentos horizontales de ${nodeName}`, error: error.message });
  }
};

/**
 * Obtiene solo los fragmentos verticales de un único nodo.
 */
export const getVerticalFragmentsByNode = async (req, res) => {
  const { nodeName } = req.params;
  const connection = nodeConnections[nodeName];

  if (!connection) {
    return res.status(404).json({ message: 'Nodo no encontrado' });
  }
  
  const capitalizedNodeName = nodeName.charAt(0).toUpperCase() + nodeName.slice(1);
  let fragments = [];

  try {
    // 1. Construimos los nombres de las tablas verticales (Forma CORRECTA)
    const baseTableName = `HistorialClinico_Base_${capitalizedNodeName}`;
    const detalleTableName = `HistorialClinico_Detalle_${capitalizedNodeName}`;

    // 2. Ejecutamos las consultas usando la función auxiliar
    const baseData = await executeQuery(connection, `SELECT * FROM ${baseTableName}`);
    fragments.push({ fragmentName: `${baseTableName} (Vertical)`, data: baseData });

    const detalleData = await executeQuery(connection, `SELECT * FROM ${detalleTableName}`);
    fragments.push({ fragmentName: `${detalleTableName} (Vertical)`, data: detalleData });

    res.json({
      node: nodeName,
      dbms: connection.dbms,
      fragments: fragments,
    });

  } catch (error) {
    res.status(500).json({ message: `Error al obtener fragmentos verticales de ${nodeName}`, error: error.message });
  }
};