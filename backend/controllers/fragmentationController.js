import poolQuito from '../config/dbQuito.js';
import poolGuayaquil from '../config/dbGuayaquil.js';
import poolCuenca from '../config/dbCuenca.js';

// Mapeo de nodos para facilitar el acceso
const nodeConnections = {
  quito: { pool: poolQuito, type: 'pg', dbms: 'PostgreSQL' },
  guayaquil: { pool: poolGuayaquil, type: 'pg', dbms: 'PostgreSQL' },
  cuenca: { pool: poolCuenca, type: 'sql', dbms: 'MS SQL Server' },
};

/**
 * Endpoint para la vista de NODO INDIVIDUAL.
 * Obtiene todos los fragmentos que residen en un único nodo especificado.
 */
export const getFragmentsByNode = async (req, res) => {
  const { nodeName } = req.params;
  const connection = nodeConnections[nodeName];

  if (!connection) {
    return res.status(404).json({ message: 'Nodo no encontrado' });
  }

  try {
    let fragments = [];
    // Las consultas deben ser adaptadas a los nombres de tabla de cada nodo
    // Ejemplo para GUAYAQUIL basado en tu script:
    if (nodeName === 'guayaquil') {
      const pacientesFrag = await connection.pool.query('SELECT * FROM Pacientes_Guayaquil');
      fragments.push({ fragmentName: 'Pacientes_Guayaquil (Horizontal)', data: pacientesFrag.rows });

      const historialBaseFrag = await connection.pool.query('SELECT * FROM HistorialClinico_Base_Guayaquil');
      fragments.push({ fragmentName: 'HistorialClinico_Base_Guayaquil (Vertical)', data: historialBaseFrag.rows });

      const historialDetalleFrag = await connection.pool.query('SELECT * FROM HistorialClinico_Detalle_Guayaquil');
      fragments.push({ fragmentName: 'HistorialClinico_Detalle_Guayaquil (Vertical)', data: historialDetalleFrag.rows });
    }
    // AÑADIR LÓGICA PARA 'quito' y 'cuenca' DE FORMA SIMILAR

    res.json({
      node: nodeName,
      dbms: connection.dbms,
      fragments: fragments,
    });

  } catch (error) {
    res.status(500).json({ message: `Error al obtener fragmentos de ${nodeName}`, error: error.message });
  }
};


/**
 * Endpoint para la vista GLOBAL de FRAGMENTACIÓN HORIZONTAL en un Nodo.
 * Muestra el contenido de cada fragmento horizontal por separado.
 */
export const getHorizontalFragmentation = async (req, res) => {
    try {
        const response = {
            description: "Mostrando fragmentos horizontales de la tabla 'Pacientes'",
            fragments: []
        };

        // Suponemos que los pacientes de Quito están en el nodo 'quito'
        const quitoConnection = nodeConnections.quito;
        const pacientesQuito = await quitoConnection.pool.query('SELECT * FROM Pacientes_Quito');
        response.fragments.push({
            node: 'quito',
            fragmentName: 'Pacientes_Quito',
            data: pacientesQuito.rows
        });

        // Suponemos que los pacientes de Guayaquil están en el nodo 'guayaquil'
        const guayaquilConnection = nodeConnections.guayaquil;
        const pacientesGuayaquil = await guayaquilConnection.pool.query('SELECT * FROM Pacientes_Guayaquil');
        response.fragments.push({
            node: 'guayaquil',
            fragmentName: 'Pacientes_Guayaquil',
            data: pacientesGuayaquil.rows
        });

        // Añadir más fragmentos si existen en otros nodos (ej. Cuenca)

        res.json(response);

    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la fragmentación horizontal global', error: error.message });
    }
};

/**
 * Endpoint para la vista GLOBAL de FRAGMENTACIÓN VERTICAL.
 * Muestra el contenido de cada fragmento vertical por separado.
 */
export const getVerticalFragmentation = async (req, res) => {
    try {
        const response = {
            description: "Mostrando fragmentos verticales de la tabla 'HistorialClinico'",
            fragments: []
        };

        // Suponemos que la parte 'Base' y 'Detalle' del historial está en Guayaquil
        const guayaquilConnection = nodeConnections.guayaquil;
        const historialBase = await guayaquilConnection.pool.query('SELECT * FROM HistorialClinico_Base_Guayaquil');
        response.fragments.push({
            node: 'guayaquil',
            fragmentName: 'HistorialClinico_Base_Guayaquil',
            data: historialBase.rows
        });

        const historialDetalle = await guayaquilConnection.pool.query('SELECT * FROM HistorialClinico_Detalle_Guayaquil');
        response.fragments.push({
            node: 'guayaquil',
            fragmentName: 'HistorialClinico_Detalle_Guayaquil',
            data: historialDetalle.rows
        });
        
        // Si otro fragmento vertical estuviera en otro nodo (ej. Quito), se añadiría aquí
        // const quitoConnection = nodeConnections.quito;
        // const otroFragmento = await quitoConnection.pool.query('SELECT * FROM HistorialClinico_Otro_Quito');
        // response.fragments.push({ node: 'quito', fragmentName: 'HistorialClinico_Otro_Quito', data: otroFragmento.rows });

        res.json(response);

    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la fragmentación vertical global', error: error.message });
    }
};