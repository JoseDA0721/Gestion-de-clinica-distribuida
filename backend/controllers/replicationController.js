import poolQuito from '../config/dbQuito.js';
import poolGuayaquil from '../config/dbGuayaquil.js';
import poolCuenca from '../config/dbCuenca.js';
import sql from 'mssql';

const dbPools = {
  quito: { pool: poolQuito, type: 'pg', dbms: 'PostgreSQL' },
  guayaquil: { pool: poolGuayaquil, type: 'pg', dbms: 'PostgreSQL' },
  cuenca: { pool: poolCuenca, type: 'sql', dbms: 'MS SQL Server' },
};

const getCount = async (nodeName, tableName) => {
  const connection = dbPools[nodeName];
  const query = `SELECT COUNT(*) as count FROM ${tableName}`;
  if (connection.type === 'pg') {
    const result = await connection.pool.query(query);
    return parseInt(result.rows[0].count);
  } else {
    const result = await connection.pool.request().query(query);
    return parseInt(result.recordset[0].count);
  }
};

export const executeUnidirectionalReplication = async (req, res) => {
    const logs = [];
    const tableName = 'Medicamentos';

    try {
        logs.push("Iniciando proceso de replicación unidireccional...");
        
        // 1. Obtener conteos iniciales
        const initialCountCuenca = await getCount('cuenca', tableName);
        const initialCountQuito = await getCount('quito', tableName);
        const initialCountGuayaquil = await getCount('guayaquil', tableName);
        logs.push(`> Estado inicial: Cuenca (${initialCountCuenca}), Quito (${initialCountQuito}), Guayaquil (${initialCountGuayaquil})`);

        // 2. Insertar 10 medicamentos en Cuenca
        logs.push("-> Paso 1: Insertando 10 registros en el nodo origen (Cuenca)...");
        const insertQuery = `INSERT INTO ${tableName} (MedicamentoID, NombreComercial, Fabricante, FechaCreacion) VALUES (@medId, @nombreComercial, 'Farmacéutica CUE', GETDATE());`;
        let insertPromises = [];
        for (let i = 1; i <= 10; i++) {
            const request = dbPools.cuenca.pool.request();
            request.input('medId', sql.Int, Date.now() + i);
            request.input('nombreComercial', sql.VarChar, `Medicamento Demo ${i}`);
            insertPromises.push(request.query(insertQuery));
        }
        await Promise.all(insertPromises);
        const postInsertCountCuenca = await getCount('cuenca', tableName);
        logs.push(`-> Paso 1 completado. Registros en Cuenca: ${postInsertCountCuenca}`);

        // 3. Sincronizar en Quito
        logs.push("-> Paso 2: Sincronizando datos hacia Quito...");
        const quitoResult = await dbPools.quito.pool.query('SELECT replicar_medicamentos();');
        logs.push(`-> Paso 2 completado. Nuevos registros en Quito: ${quitoResult.rows[0].replicar_medicamentos}`);
        
        // 4. Sincronizar en Guayaquil
        logs.push("-> Paso 3: Sincronizando datos hacia Guayaquil...");
        const guayaquilResult = await dbPools.guayaquil.pool.query('SELECT replicar_medicamentos();');
        logs.push(`-> Paso 3 completado. Nuevos registros en Guayaquil: ${guayaquilResult.rows[0].replicar_medicamentos}`);

        // 5. Obtener conteos finales
        const finalCountCuenca = await getCount('cuenca', tableName);
        const finalCountQuito = await getCount('quito', tableName);
        const finalCountGuayaquil = await getCount('guayaquil', tableName);
        logs.push(`> Estado final: Cuenca (${finalCountCuenca}), Quito (${finalCountQuito}), Guayaquil (${finalCountGuayaquil})`);
        logs.push("Proceso finalizado con éxito.");

        res.json({ logs });

    } catch (error) {
        logs.push(`ERROR: ${error.message}`);
        res.status(500).json({ logs, message: `Error en el proceso: ${error.message}` });
    }
};


export const executeBidirectionalReplication = async (req, res) => {
    const { sourceNode } = req.params;
    const logs = [];
    const tableName = 'NotasInformativas';

    if (!dbPools[sourceNode]) {
        return res.status(400).json({ message: "Nodo de origen no válido." });
    }

    try {
        logs.push(`Iniciando proceso de replicación bidireccional desde ${sourceNode}...`);
        
        // 1. Obtener conteos iniciales
        const initialCounts = {
            quito: await getCount('quito', tableName),
            guayaquil: await getCount('guayaquil', tableName),
            cuenca: await getCount('cuenca', tableName),
        };
        logs.push(`> Estado inicial: Quito (${initialCounts.quito}), Guayaquil (${initialCounts.guayaquil}), Cuenca (${initialCounts.cuenca})`);

        // 2. Insertar 10 notas en el nodo de origen
        logs.push(`-> Paso 1: Insertando 10 notas en ${sourceNode}...`);
        if (sourceNode === 'cuenca') {
            const query = `INSERT INTO ${tableName} (NotaID, Titulo, Contenido, NodoOrigen) VALUES (@notaId, @titulo, @contenido, 'Cuenca');`;
            let promises = [];
            for (let i = 1; i <= 10; i++) {
                const request = dbPools.cuenca.pool.request();
                request.input('notaId', sql.VarChar, `NC-${Date.now() + i}`);
                request.input('titulo', sql.VarChar, `Nota desde Cuenca #${i}`);
                request.input('contenido', sql.VarChar, `Contenido de prueba`);
                promises.push(request.query(query));
            }
            await Promise.all(promises);
        } else { // quito o guayaquil
            const sequenceName = `seq_notas_${sourceNode}`;
            const idPrefix = sourceNode === 'quito' ? 'NQ' : 'NG';
            const nodeOriginName = sourceNode.charAt(0).toUpperCase() + sourceNode.slice(1);
            const query = `DO $$ BEGIN FOR i IN 1..10 LOOP INSERT INTO ${tableName} (NotaID, Titulo, Contenido, NodoOrigen) VALUES ('${idPrefix}' || LPAD(nextval('${sequenceName}')::TEXT, 3, '0'), 'Nota desde ${nodeOriginName} #' || i, 'Contenido de prueba', '${nodeOriginName}'); END LOOP; END $$;`;
            await dbPools[sourceNode].pool.query(query);
        }
        logs.push(`-> Paso 1 completado. 10 notas insertadas en ${sourceNode}.`);

        // 3. Invocar mecanismo de replicación
        logs.push("-> Paso 2: Invocando mecanismo de sincronización...");
        if (sourceNode === 'cuenca') {
            await dbPools.quito.pool.query('SELECT replicar_notas_desde_cuenca();');
            await dbPools.guayaquil.pool.query('SELECT replicar_notas_desde_cuenca();');
            logs.push("-> Paso 2 completado. Funciones de replicación ejecutadas en Quito y Guayaquil.");
        } else { // quito o guayaquil
            const jobName = `ReplicarNotasDesdePostgres`;
            await dbPools.cuenca.pool.request().input('job_name', sql.VarChar, jobName).execute('msdb.dbo.sp_start_job');
            logs.push(`-> Paso 2 completado. Job '${jobName}' ejecutado en SQL Server.`);
        }

        // 4. Obtener conteos finales
        const finalCounts = {
            quito: await getCount('quito', tableName),
            guayaquil: await getCount('guayaquil', tableName),
            cuenca: await getCount('cuenca', tableName),
        };
        logs.push(`> Estado final: Quito (${finalCounts.quito}), Guayaquil (${finalCounts.guayaquil}), Cuenca (${finalCounts.cuenca})`);
        logs.push("Proceso finalizado con éxito.");

        res.json({ logs });

    } catch (error) {
        logs.push(`ERROR: ${error.message}`);
        res.status(500).json({ logs, message: `Error en el proceso: ${error.message}` });
    }
};

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
      query += ' LIMIT 30';
      const result = await dbPool.pool.query(query);
      return res.json({ data: result.rows });
    } else {
      query += ' OFFSET 0 ROWS FETCH NEXT 30 ROWS ONLY';
      const result = await dbPool.pool.request().query(query);
      return res.json({ data: result.recordset });
    }
  } catch (error) {
    res.status(500).json({ message: `Error al obtener datos de la tabla ${tableName} en el nodo ${nodeName}`, error: error.message });
  }
};