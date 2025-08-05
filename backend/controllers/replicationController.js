import poolQuito from '../config/dbQuito.js';
import poolGuayaquil from '../config/dbGuayaquil.js';
import poolCuenca from '../config/dbCuenca.js';
import sql from 'mssql';

const dbPools = {
  quito: { pool: poolQuito, type: 'pg', dbms: 'PostgreSQL' },
  guayaquil: { pool: poolGuayaquil, type: 'pg', dbms: 'PostgreSQL' },
  cuenca: { pool: poolCuenca, type: 'sql', dbms: 'MS SQL Server' },
};

// --- Función Auxiliar para obtener conteos ---
const getCount = async (connection, tableName) => {
  const query = `SELECT COUNT(*) as count FROM ${tableName}`;
  if (connection.type === 'pg') {
    const result = await connection.pool.query(query);
    return parseInt(result.rows[0].count);
  } else {
    const result = await connection.pool.request().query(query);
    return parseInt(result.recordset[0].count);
  }
};

// --- CONTROLADORES ---

/**
 * REPLICACIÓN UNIDIRECCIONAL: Inserta 10 medicamentos en Cuenca (SQL Server)
 */
export const replicateMedicamentos = async (req, res) => {
  const sourceNode = 'cuenca';
  const sourceDB = dbPools[sourceNode];
  const tableName = 'Medicamentos';

  if (!sourceDB) {
    return res.status(400).json({ message: "El nodo 'cuenca' no está configurado." });
  }

  try {
    const initialCount = await getCount(sourceDB, tableName);
    
    const query = `
      INSERT INTO ${tableName} (
        MedicamentoID, NombreComercial, NombreGenerico, PrincipioActivo, 
        Fabricante, FormaFarmaceutica, FechaCreacion
      ) VALUES (
        @medId, @nombreComercial, @nombreGenerico, @principioActivo, 
        @fabricante, @forma, GETDATE()
      );
    `;

    // 3. Ejecutamos la inserción 10 veces, cada una con sus propios datos
    let insertPromises = [];
    for (let i = 1; i <= 10; i++) {
      const request = sourceDB.pool.request();

      // Asignamos un valor a cada parámetro de la consulta
      request.input('medId', sql.Int, i);
      request.input('nombreComercial', sql.VarChar, `Medicamento_C${i}`);
      request.input('nombreGenerico', sql.VarChar, `Genérico_${i}`);
      request.input('principioActivo', sql.VarChar, 'Paracetamol');
      request.input('fabricante', sql.VarChar, 'Farmacéutica CUE');
      request.input('forma', sql.VarChar, 'Tableta');

      // Añadimos la promesa de la ejecución a nuestro arreglo
      insertPromises.push(request.query(query));
    }

    // Esperamos a que todas las 10 inserciones se completen
    await Promise.all(insertPromises);

    // 4. Obtenemos el conteo final para la demostración
    const finalCount = await getCount(sourceDB, tableName);

    res.json({
      message: `Replicación unidireccional para ${tableName} iniciada desde ${sourceNode}.`,
      table: tableName,
      initialCount,
      insertedRecords: 10,
      finalCount,
      status: `Se insertaron 10 registros en ${sourceNode}. Por favor, verifica la replicación en los nodos secundarios.`
    });

  } catch (error) {
    res.status(500).json({ message: `Error durante la replicación de ${tableName}`, error: error.message });
  }
};

/**
 * ACCIÓN 2: Sincroniza los medicamentos desde un nodo PostgreSQL.
 * Esta función llama a la lógica que usa tu Foreign Table.
 */
export const syncMedicamentosEnNodosPostgres = async (req, res) => {
  const { nodeName } = req.params; // 'quito' o 'guayaquil'
  const targetDB = dbPools[nodeName];

  if (targetDB?.type !== 'pg') {
    return res.status(400).json({ message: "Esta acción solo puede ejecutarse desde un nodo PostgreSQL." });
  }

  try {
    // Esta consulta es la implementación de tu lógica de replicación unidireccional
    const syncQuery = `
      INSERT INTO Medicamentos (MedicamentoID, NombreComercial, NombreGenerico, PrincipioActivo, Fabricante, FormaFarmaceutica, FechaCreacion)
      SELECT r.MedicamentoID, r.NombreComercial, r.NombreGenerico, r.PrincipioActivo, r.Fabricante, r.FormaFarmaceutica, r.FechaCreacion
      FROM medicamentos_remoto r
      LEFT JOIN Medicamentos l ON r.MedicamentoID = l.MedicamentoID
      WHERE l.MedicamentoID IS NULL;
    `;
    
    const result = await targetDB.pool.query(syncQuery);

    res.json({
      message: `Sincronización completada en el nodo ${nodeName}.`,
      newRecordsSynced: result.rowCount // Número de filas nuevas insertadas
    });

  } catch (error) {
    res.status(500).json({ message: `Error durante la sincronización de medicamentos`, error: error.message });
  }
};

/**
 * Inserta 10 notas informativas en un nodo de origen.
 */
export const replicateNotaInformativa = async (req, res) => {
  const { sourceNode } = req.params;
  const sourceDB = dbPools[sourceNode];
  const tableName = 'NotasInformativas';

  if (!sourceDB) {
      return res.status(400).json({ message: "Nodo de origen no válido." });
  }

  try {
      if (sourceNode === 'cuenca') {
          // --- Lógica para SQL Server (Cuenca) ---
          const query = `
              INSERT INTO ${tableName} (NotaID, Titulo, Contenido, FechaCreacion, NodoOrigen)
              VALUES (@notaId, @titulo, @contenido, GETDATE(), 'Cuenca');
          `;
          let insertPromises = [];
          for (let i = 1; i <= 10; i++) {
              const request = sourceDB.pool.request();
              const notaId = 'NC' + String(i).padStart(3, '0');
              request.input('notaId', sql.VarChar, notaId);
              request.input('titulo', sql.VarChar, `Nota desde Cuenca #${i}`);
              request.input('contenido', sql.VarChar, `Contenido generado en Cuenca #${i}`);
              insertPromises.push(request.query(query));
          }
          // Ejecutamos todas las inserciones en paralelo
          await Promise.all(insertPromises);
          // Llamada a la funcion para sincronizar notas desde Cuenca a Guayaquil
          const auxiliaryRemoteDB = dbPools['guayaquil'];
          auxiliaryRemoteDB.pool.query('SELECT replicar_notas_desde_cuenca()');

      } else if (sourceNode === 'quito' || sourceNode === 'guayaquil') {
          // --- Lógica para PostgreSQL (Quito y Guayaquil) ---
          const sequenceName = `seq_notas_${sourceNode}`;
          const idPrefix = sourceNode === 'quito' ? 'NQ' : 'NG';
          const nodeOriginName = sourceNode.charAt(0).toUpperCase() + sourceNode.slice(1);

          // Se ejecuta el bloque DO para insertar los 10 registros.
          const query = `
              DO $$
              DECLARE i INT;
              BEGIN
                  FOR i IN 1..10 LOOP
                      INSERT INTO ${tableName} (NotaID, Titulo, Contenido, NodoOrigen)
                      VALUES (
                          '${idPrefix}' || LPAD(nextval('${sequenceName}')::TEXT, 3, '0'),
                          'Nota desde ${nodeOriginName} #' || i,
                          'Contenido de la nota ' || i,
                          '${nodeOriginName}'
                      );
                  END LOOP;
              END $$;
          `;
          await sourceDB.pool.query(query);

          // Después de insertar en lote, se ejecuta el JOB en SQL Server para que "jale" los datos.
          // Se asume que el job se llama 'ReplicarNotasDesde[NombreDelNodo]'
          const jobName = `ReplicarNotasDesdePostgres`;
          console.log(`Executing job: ${jobName} on SQL Server.`);
          // Usamos la conexión de Cuenca para ejecutar un procedimiento almacenado del sistema.
          await dbPools.cuenca.pool.request()
              .input('job_name', sql.VarChar, jobName)
              .execute('msdb.dbo.sp_start_job');

      } else {
          return res.status(400).json({ message: "Lógica de inserción no definida para este nodo." });
      }

      res.status(201).json({
          message: `Se insertaron 10 notas informativas en ${sourceNode} y se inició el proceso de replicación.`
      });

  } catch (error) {
      res.status(500).json({ message: `Error durante la inserción masiva de notas en ${sourceNode}`, error: error.message });
  }
};

// (Aquí iría la función getReplicationStatusByNode que ya creamos para ver el estado)
export const getReplicationStatusByNode = async (req, res) => {
  const { nodeName } = req.params;
  const dbPool = dbPools[nodeName.toLowerCase()];

  if (!dbPool) {
    return res.status(400).json({ message: `El nodo '${nodeName}' no está configurado.` });
  }

  try {
    const medicamentosCount = await getCount(dbPool, 'Medicamentos');
    const notasCount = await getCount(dbPool, 'NotasInformativas');

    res.json({
      node: nodeName,
      status: 'OK',
      counts: {
        Medicamentos: medicamentosCount,
        NotasInformativas: notasCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: `Error al obtener el estado del nodo ${nodeName}`, error: error.message });
  }
};

/**
 * Obtener datos de tablas específicas en un nodo dado.
 * Permite verificar los datos replicados.
 */

export const getTableDataByNode = async (req, res) => {
  const { nodeName, tableName } = req.params;
  const dbPool = dbPools[nodeName.toLowerCase()];

  if (!dbPool) {
    return res.status(400).json({ message: `El nodo '${nodeName}' no está configurado.` });
  }

  const validTables = ['Medicamentos', 'NotasInformativas'];
  // Compara ambos en mayúsculas para que no importe el caso
  if (!validTables.map(t => t.toUpperCase()).includes(tableName.toUpperCase())) {
    return res.status(400).json({ message: `La tabla '${tableName}' no es válida.` });
  }

  try {
    let query = `SELECT * FROM ${tableName} ORDER BY FechaCreacion DESC`;
    if (dbPool.type === 'pg') {
      query += ' LIMIT 30'; // Limitar resultados en PostgreSQL
      const result = await dbPool.pool.query(query);
      return res.json({ data: result.rows });
    } else {
      query += ' OFFSET 0 ROWS FETCH NEXT 30 ROWS ONLY'; // Limitar resultados en SQL Server
      const result = await dbPool.pool.request().query(query);
      return res.json({ data: result.recordset });
    }
  } catch (error) {
    res.status(500).json({ message: `Error al obtener datos de la tabla ${tableName} en el nodo ${nodeName}`, error: error.message });
  }
};