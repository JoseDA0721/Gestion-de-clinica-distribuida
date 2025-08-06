import poolQuito from '../config/dbQuito.js';
import poolGuayaquil from '../config/dbGuayaquil.js';
import poolCuenca from '../config/dbCuenca.js';
import sql from 'mssql';

const dbPools = {
  quito: { pool: poolQuito, type: 'pg' },
  guayaquil: { pool: poolGuayaquil, type: 'pg' },
  cuenca: { pool: poolCuenca, type: 'sql' },
};

// --- Función Auxiliar para obtener conteos ---
const getCount = async (nodeName, tableName) => {
  const connection = dbPools[nodeName];
  const capitalizedNodeName = nodeName.charAt(0).toUpperCase() + nodeName.slice(1);
  const fullTableName = `${tableName}_${capitalizedNodeName}`;
  const query = `SELECT COUNT(*) as count FROM ${fullTableName}`;
  
  try {
    if (connection.type === 'pg') {
      const result = await connection.pool.query(query);
      return parseInt(result.rows[0].count);
    } else {
      const result = await connection.pool.request().query(query);
      return parseInt(result.recordset[0].count);
    }
  } catch (e) {
    // Si la tabla no existe en el nodo, devolvemos 0
    return 0;
  }
};

/**
 * Ejecuta la demostración de FRAGMENTACIÓN HORIZONTAL para múltiples tablas.
 */
export const executeHorizontalDemo = async (req, res) => {
    const logs = [];
    const { nodeSource } = req.params;
    if (!nodeSource) {
      return res.status(400).json({ message: "Debe especificar el nodo de origen." });
    }
    const nodeName = nodeSource.toLowerCase();
    let demoData = {};
  
    // Elegir datos de demostración según el nodo
    if (nodeName === 'quito') {
        demoData = {
        Doctores: [
            {
            CedulaProfesional: '17001',
            Nombre: 'Gregory',
            Apellido: 'House',
            Especialidad: 'Diagnóstico',
            TelefonoConsultorio: '0222000001',
            Email: 'house@clinicaquito.com',
            SedePrincipalID: 1,
            NodoOrigen: 'Quito'
            },
            {
            CedulaProfesional: '09001',
            Nombre: 'Meredith',
            Apellido: 'Grey',
            Especialidad: 'Cirugía',
            TelefonoConsultorio: '0222000002',
            Email: 'grey@clinicaquito.com',
            SedePrincipalID: 2,
            NodoOrigen: 'Quito'
            }
        ],
        Pacientes: [
            {
            Cedula: '1700000001',
            Nombre: 'Ana',
            Apellido: 'Pérez',
            FechaNacimiento: '1980-05-10',
            Genero: 'Femenino',
            DireccionCompleta: 'Av. Naciones Unidas 100',
            Telefono: '0991234567',
            Email: 'ana.perez@mail.com',
            SedeRegistroID: 1,
            NodoOrigen: 'Quito'
            },
            {
            Cedula: '0900000001',
            Nombre: 'Carlos',
            Apellido: 'Díaz',
            FechaNacimiento: '1975-08-20',
            Genero: 'Masculino',
            DireccionCompleta: 'Calle 10 de Agosto 200',
            Telefono: '0997654321',
            Email: 'carlos.diaz@mail.com',
            SedeRegistroID: 2,
            NodoOrigen: 'Quito'
            },
            {
            Cedula: '0100000001',
            Nombre: 'Sofía',
            Apellido: 'López',
            FechaNacimiento: '1990-12-15',
            Genero: 'Femenino',
            DireccionCompleta: 'Av. Shyris 300',
            Telefono: '0991112223',
            Email: 'sofia.lopez@mail.com',
            SedeRegistroID: 3,
            NodoOrigen: 'Quito'
            }
        ],
        Citas: [
            {
            CitaID: 'CQ001',
            CedulaPaciente: '1700000001',
            CedulaProfesional: '17001',
            SedeID: 1,
            FechaHoraCita: '2025-08-10 10:00:00',
            MotivoConsulta: 'Chequeo general',
            EstadoCita: 'Confirmada',
            ConsultorioAsignado: 'Sala A',
            NodoOrigen: 'Quito'
            },
            {
            CitaID: 'CQ002',
            CedulaPaciente: '0100000001',
            CedulaProfesional: '09001',
            SedeID: 2,
            FechaHoraCita: '2025-08-11 11:30:00',
            MotivoConsulta: 'Dolor de cabeza',
            EstadoCita: 'Confirmada',
            ConsultorioAsignado: 'Sala B',
            NodoOrigen: 'Quito'
            }
        ],
        Recetas: [
            {
            RecetaID: 'RQ001',
            CitaID: 'CQ001',
            MedicamentoID: 101,
            Dosis: '1 tableta',
            Frecuencia: 'Cada 8 horas',
            DuracionTratamiento: '7 días',
            InstruccionesAdicionales: 'Tomar con alimentos'
            },
            {
            RecetaID: 'RQ002',
            CitaID: 'CQ002',
            MedicamentoID: 102,
            Dosis: '2 tabletas',
            Frecuencia: 'Cada 12 horas',
            DuracionTratamiento: '5 días',
            InstruccionesAdicionales: 'Evitar conducir'
            }
        ],
        InventarioMedicamentos: [
            {
            InventarioID: 'IQ001',
            SedeID: 3,
            MedicamentoID: 101,
            CantidadStock: 50,
            Lote: 'L001',
            FechaCaducidad: '2026-01-31',
            UbicacionAlmacen: 'Bodega A'
            },
            {
            InventarioID: 'IQ002',
            SedeID: 1,
            MedicamentoID: 103,
            CantidadStock: 30,
            Lote: 'L002',
            FechaCaducidad: '2025-12-15',
            UbicacionAlmacen: 'Bodega B'
            }
        ]
        };

    } else if (nodeName === 'guayaquil') {
        demoData = {
        Doctores: [
            {
            CedulaProfesional: '17002',
            Nombre: 'John',
            Apellido: 'Watson',
            Especialidad: 'Medicina General',
            TelefonoConsultorio: '0426000001',
            Email: 'watson@clinicaguayaquil.com',
            SedePrincipalID: 1,
            NodoOrigen: 'Guayaquil'
            },
            {
            CedulaProfesional: '09002',
            Nombre: 'María',
            Apellido: 'Torres',
            Especialidad: 'Pediatría',
            TelefonoConsultorio: '0426000002',
            Email: 'torres@clinicaguayaquil.com',
            SedePrincipalID: 2,
            NodoOrigen: 'Guayaquil'
            }
        ],
        Pacientes: [
            {
            Cedula: '1700000002',
            Nombre: 'Luis',
            Apellido: 'Gómez',
            FechaNacimiento: '1982-03-22',
            Genero: 'Masculino',
            DireccionCompleta: 'Av. Francisco de Orellana 150',
            Telefono: '0992223334',
            Email: 'luis.gomez@mail.com',
            SedeRegistroID: 1,
            NodoOrigen: 'Guayaquil'
            },
            {
            Cedula: '0900000002',
            Nombre: 'María',
            Apellido: 'Muñoz',
            FechaNacimiento: '1978-07-11',
            Genero: 'Femenino',
            DireccionCompleta: 'Calle 5 de Junio 45',
            Telefono: '0994445556',
            Email: 'maria.munoz@mail.com',
            SedeRegistroID: 2,
            NodoOrigen: 'Guayaquil'
            },
            {
            Cedula: '0100000002',
            Nombre: 'Pedro',
            Apellido: 'Vega',
            FechaNacimiento: '1992-11-05',
            Genero: 'Masculino',
            DireccionCompleta: 'Av. Las Américas 250',
            Telefono: '0996667778',
            Email: 'pedro.vega@mail.com',
            SedeRegistroID: 3,
            NodoOrigen: 'Guayaquil'
            }
        ],
        Citas: [
            {
            CitaID: 'CG001',
            CedulaPaciente: '1700000002',
            CedulaProfesional: '17002',
            SedeID: 1,
            FechaHoraCita: '2025-08-12 09:30:00',
            MotivoConsulta: 'Control de presión',
            EstadoCita: 'Confirmada',
            ConsultorioAsignado: 'Consultorio 1',
            NodoOrigen: 'Guayaquil'
            },
            {
            CitaID: 'CG002',
            CedulaPaciente: '0900000002',
            CedulaProfesional: '09002',
            SedeID: 2,
            FechaHoraCita: '2025-08-13 14:00:00',
            MotivoConsulta: 'Vacunación',
            EstadoCita: 'Confirmada',
            ConsultorioAsignado: 'Consultorio 2',
            NodoOrigen: 'Guayaquil'
            }
        ],
        Recetas: [
            {
            RecetaID: 'RG001',
            CitaID: 'CG001',
            MedicamentoID: 201,
            Dosis: '1 ml',
            Frecuencia: 'Una vez',
            DuracionTratamiento: '1 dosis',
            InstruccionesAdicionales: 'Inyectar intramuscular'
            },
            {
            RecetaID: 'RG002',
            CitaID: 'CG002',
            MedicamentoID: 202,
            Dosis: '5 ml',
            Frecuencia: 'Cada 6 horas',
            DuracionTratamiento: '3 días',
            InstruccionesAdicionales: 'Refrigerar'
            }
        ],
        InventarioMedicamentos: [
            {
            InventarioID: 'IG001',
            SedeID: 3,
            MedicamentoID: 201,
            CantidadStock: 80,
            Lote: 'G001',
            FechaCaducidad: '2026-03-30',
            UbicacionAlmacen: 'Depósito A'
            },
            {
            InventarioID: 'IG002',
            SedeID: 2,
            MedicamentoID: 203,
            CantidadStock: 45,
            Lote: 'G002',
            FechaCaducidad: '2025-11-20',
            UbicacionAlmacen: 'Depósito B'
            }
        ]
        };

    } else if (nodeName === 'cuenca') {
        demoData = {
        Doctores: [
            {
            CedulaProfesional: '17003',
            Nombre: 'Stephen',
            Apellido: 'Strange',
            Especialidad: 'Neurología',
            TelefonoConsultorio: '0728000001',
            Email: 'strange@clinicacuenca.com',
            SedePrincipalID: 1,
            NodoOrigen: 'Cuenca'
            },
            {
            CedulaProfesional: '09003',
            Nombre: 'Bruce',
            Apellido: 'Banner',
            Especialidad: 'Medicina Interna',
            TelefonoConsultorio: '0728000002',
            Email: 'banner@clinicacuenca.com',
            SedePrincipalID: 2,
            NodoOrigen: 'Cuenca'
            }
        ],
        Pacientes: [
            {
            Cedula: '1700000003',
            Nombre: 'Julia',
            Apellido: 'Ramírez',
            FechaNacimiento: '1985-02-14',
            Genero: 'Femenino',
            DireccionCompleta: 'Av. Remigio Crespo 400',
            Telefono: '0998889990',
            Email: 'julia.ramirez@mail.com',
            SedeRegistroID: 1,
            NodoOrigen: 'Cuenca'
            },
            {
            Cedula: '0900000003',
            Nombre: 'Andrés',
            Apellido: 'Suárez',
            FechaNacimiento: '1979-09-09',
            Genero: 'Masculino',
            DireccionCompleta: 'Calle Larga 120',
            Telefono: '0997776665',
            Email: 'andres.suarez@mail.com',
            SedeRegistroID: 2,
            NodoOrigen: 'Cuenca'
            },
            {
            Cedula: '0100000003',
            Nombre: 'Laura',
            Apellido: 'Gómez',
            FechaNacimiento: '1993-06-18',
            Genero: 'Femenino',
            DireccionCompleta: 'Av. 12 de Abril 250',
            Telefono: '0995554443',
            Email: 'laura.gomez@mail.com',
            SedeRegistroID: 3,
            NodoOrigen: 'Cuenca'
            }
        ],
        Citas: [
            {
            CitaID: 'CC001',
            CedulaPaciente: '1700000003',
            CedulaProfesional: '17003',
            SedeID: 1,
            FechaHoraCita: '2025-08-14 08:45:00',
            MotivoConsulta: 'Migraña crónica',
            EstadoCita: 'Confirmada',
            ConsultorioAsignado: 'Aula Médica',
            NodoOrigen: 'Cuenca'
            },
            {
            CitaID: 'CC002',
            CedulaPaciente: '0900000003',
            CedulaProfesional: '09003',
            SedeID: 2,
            FechaHoraCita: '2025-08-15 13:15:00',
            MotivoConsulta: 'Chequeo anual',
            EstadoCita: 'Confirmada',
            ConsultorioAsignado: 'Consultorio Central',
            NodoOrigen: 'Cuenca'
            }
        ],
        Recetas: [
            {
            RecetaID: 'RC001',
            CitaID: 'CC001',
            MedicamentoID: 301,
            Dosis: '10 mg',
            Frecuencia: 'Cada 24 horas',
            DuracionTratamiento: '14 días',
            InstruccionesAdicionales: 'Evitar lácteos'
            },
            {
            RecetaID: 'RC002',
            CitaID: 'CC002',
            MedicamentoID: 302,
            Dosis: '20 mg',
            Frecuencia: 'Cada 6 horas',
            DuracionTratamiento: '10 días',
            InstruccionesAdicionales: 'Tomar con agua'
            }
        ],
        InventarioMedicamentos: [
            {
            InventarioID: 'IC001',
            SedeID: 3,
            MedicamentoID: 301,
            CantidadStock: 60,
            Lote: 'C001',
            FechaCaducidad: '2026-05-25',
            UbicacionAlmacen: 'Área Secundaria'
            },
            {
            InventarioID: 'IC002',
            SedeID: 1,
            MedicamentoID: 303,
            CantidadStock: 25,
            Lote: 'C002',
            FechaCaducidad: '2025-10-10',
            UbicacionAlmacen: 'Área Principal'
            }
        ]
        };

    } else {
        return res.status(400).json({ message: "Nodo de origen no válido." });
    }
  
    try {
      logs.push(`Iniciando demostración de Fragmentación Horizontal desde Nodo ${nodeName}...`);
  
      // Estado inicial
      const tablesToLog = ['Pacientes', 'Doctores', 'Citas', 'Recetas', 'InventarioMedicamentos'];
      for (const table of tablesToLog) {
        const cQ = await getCount('quito', table);
        const cG = await getCount('guayaquil', table);
        const cC = await getCount('cuenca', table);
        logs.push(`> Estado inicial ${table}: Quito (${cQ}), Guayaquil (${cG}), Cuenca (${cC})`);
      }
  
      const getTargetNodeName = sedeId => {
        if (sedeId === 1) return 'quito';
        if (sedeId === 2) return 'guayaquil';
        if (sedeId === 3) return 'cuenca';
        return null;
      };
  
      for (const type of tablesToLog) {
        if (!demoData[type]) continue;
        for (const record of demoData[type]) {
          // Determinar el nodo destino
          let sedeId, targetNode;
          if (type === 'Recetas') {
            const parent = demoData.Citas.find(c => c.CitaID === record.CitaID);
            if (!parent) continue;
            sedeId = parent.SedeID;
          } else {
            sedeId = record.SedeRegistroID || record.SedePrincipalID || record.SedeID;
          }
          targetNode = getTargetNodeName(sedeId);
          if (!targetNode) continue;
  
          logs.push(`--> Insertando ${type.slice(0, -1)} '${(record.CitaID||record.RecetaID||record.Cedula||record.InventarioID||record.CedulaProfesional)}' en nodo ${targetNode}...`);
          const conn = dbPools[targetNode];
          const cap = targetNode[0].toUpperCase() + targetNode.slice(1);
          const tableName = `${type}_${cap}`;
  
          if (conn.type === 'pg') {
            let query, values;
            switch (type) {
              case 'Pacientes':
                query = `
                  INSERT INTO ${tableName}
                    (Cedula, Nombre, Apellido, FechaNacimiento, Genero,
                     DireccionCompleta, Telefono, Email, SedeRegistroID, FechaCreacion)
                  VALUES
                    ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
                `;
                values = [
                  record.Cedula,
                  record.Nombre,
                  record.Apellido,
                  record.FechaNacimiento,
                  record.Genero,
                  record.DireccionCompleta,
                  record.Telefono,
                  record.Email,
                  record.SedeRegistroID
                ];
                break;
          
              case 'Doctores':
                query = `
                  INSERT INTO ${tableName}
                    (CedulaProfesional, Nombre, Apellido, Especialidad,
                     TelefonoConsultorio, Email, SedePrincipalID, FechaCreacion)
                  VALUES
                    ($1, $2, $3, $4, $5, $6, $7, NOW())
                `;
                values = [
                  record.CedulaProfesional,
                  record.Nombre,
                  record.Apellido,
                  record.Especialidad,
                  record.TelefonoConsultorio,
                  record.Email,
                  record.SedePrincipalID
                ];
                break;
          
              case 'Citas':
                query = `
                  INSERT INTO ${tableName}
                    (CitaID, CedulaPaciente, CedulaProfesional, SedeID,
                     FechaHoraCita, MotivoConsulta, EstadoCita,
                     ConsultorioAsignado, FechaCreacion)
                  VALUES
                    ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
                `;
                values = [
                  record.CitaID,
                  record.CedulaPaciente,
                  record.CedulaProfesional,
                  record.SedeID,
                  record.FechaHoraCita,
                  record.MotivoConsulta,
                  record.EstadoCita,
                  record.ConsultorioAsignado
                ];
                break;
          
              case 'Recetas':
                query = `
                  INSERT INTO ${tableName}
                    (RecetaID, CitaID, MedicamentoID,
                     Dosis, Frecuencia, DuracionTratamiento,
                     InstruccionesAdicionales, FechaCreacion)
                  VALUES
                    ($1, $2, $3, $4, $5, $6, $7, NOW())
                `;
                values = [
                  record.RecetaID,
                  record.CitaID,
                  record.MedicamentoID,
                  record.Dosis,
                  record.Frecuencia,
                  record.DuracionTratamiento,
                  record.InstruccionesAdicionales
                ];
                break;
          
              case 'InventarioMedicamentos':
                query = `
                  INSERT INTO ${tableName}
                    (InventarioID, SedeID, MedicamentoID,
                     CantidadStock, Lote, FechaCaducidad,
                     UbicacionAlmacen, FechaCreacion)
                  VALUES
                    ($1, $2, $3, $4, $5, $6, $7, NOW())
                `;
                values = [
                  record.InventarioID,
                  record.SedeID,
                  record.MedicamentoID,
                  record.CantidadStock,
                  record.Lote,
                  record.FechaCaducidad,
                  record.UbicacionAlmacen
                ];
                break;
            }
          
            if (query) await conn.pool.query(query, values);
          
          } else { // SQL Server (cuenca)
          
            const rq = conn.pool.request();
            let query;
            switch (type) {
              case 'Pacientes':
                query = `
                  INSERT INTO ${tableName}
                    (Cedula, Nombre, Apellido, FechaNacimiento, Genero,
                     DireccionCompleta, Telefono, Email, SedeRegistroID, FechaCreacion)
                  VALUES
                    (@p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8, @p9, GETDATE())
                `;
                rq
                  .input('p1', sql.VarChar, record.Cedula)
                  .input('p2', sql.VarChar, record.Nombre)
                  .input('p3', sql.VarChar, record.Apellido)
                  .input('p4', sql.Date,    record.FechaNacimiento)
                  .input('p5', sql.VarChar, record.Genero)
                  .input('p6', sql.VarChar, record.DireccionCompleta)
                  .input('p7', sql.VarChar, record.Telefono)
                  .input('p8', sql.VarChar, record.Email)
                  .input('p9', sql.Int,    record.SedeRegistroID);
                break;
          
              case 'Doctores':
                query = `
                  INSERT INTO ${tableName}
                    (CedulaProfesional, Nombre, Apellido, Especialidad,
                     TelefonoConsultorio, Email, SedePrincipalID, FechaCreacion)
                  VALUES
                    (@p1, @p2, @p3, @p4, @p5, @p6, @p7, GETDATE())
                `;
                rq
                  .input('p1', sql.VarChar, record.CedulaProfesional)
                  .input('p2', sql.VarChar, record.Nombre)
                  .input('p3', sql.VarChar, record.Apellido)
                  .input('p4', sql.VarChar, record.Especialidad)
                  .input('p5', sql.VarChar, record.TelefonoConsultorio)
                  .input('p6', sql.VarChar, record.Email)
                  .input('p7', sql.Int,    record.SedePrincipalID);
                break;
          
              case 'Citas':
                query = `
                  INSERT INTO ${tableName}
                    (CitaID, CedulaPaciente, CedulaProfesional, SedeID,
                     FechaHoraCita, MotivoConsulta, EstadoCita,
                     ConsultorioAsignado, FechaCreacion)
                  VALUES
                    (@p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8, GETDATE())
                `;
                rq
                  .input('p1', sql.VarChar, record.CitaID)
                  .input('p2', sql.VarChar, record.CedulaPaciente)
                  .input('p3', sql.VarChar, record.CedulaProfesional)
                  .input('p4', sql.Int,     record.SedeID)
                  .input('p5', sql.DateTime,record.FechaHoraCita)
                  .input('p6', sql.VarChar, record.MotivoConsulta)
                  .input('p7', sql.VarChar, record.EstadoCita)
                  .input('p8', sql.VarChar, record.ConsultorioAsignado);
                break;
          
              case 'Recetas':
                query = `
                  INSERT INTO ${tableName}
                    (RecetaID, CitaID, MedicamentoID,
                     Dosis, Frecuencia, DuracionTratamiento,
                     InstruccionesAdicionales, FechaCreacion)
                  VALUES
                    (@p1, @p2, @p3, @p4, @p5, @p6, @p7, GETDATE())
                `;
                rq
                  .input('p1', sql.VarChar, record.RecetaID)
                  .input('p2', sql.VarChar, record.CitaID)
                  .input('p3', sql.Int,     record.MedicamentoID)
                  .input('p4', sql.VarChar, record.Dosis)
                  .input('p5', sql.VarChar, record.Frecuencia)
                  .input('p6', sql.VarChar, record.DuracionTratamiento)
                  .input('p7', sql.VarChar, record.InstruccionesAdicionales);
                break;
          
              case 'InventarioMedicamentos':
                query = `
                  INSERT INTO ${tableName}
                    (InventarioID, SedeID, MedicamentoID,
                     CantidadStock, Lote, FechaCaducidad,
                     UbicacionAlmacen, FechaCreacion)
                  VALUES
                    (@p1, @p2, @p3, @p4, @p5, @p6, @p7, GETDATE())
                `;
                rq
                  .input('p1', sql.VarChar, record.InventarioID)
                  .input('p2', sql.Int,     record.SedeID)
                  .input('p3', sql.Int,     record.MedicamentoID)
                  .input('p4', sql.Int,     record.CantidadStock)
                  .input('p5', sql.VarChar, record.Lote)
                  .input('p6', sql.Date,    record.FechaCaducidad)
                  .input('p7', sql.VarChar, record.UbicacionAlmacen);
                break;
            }
          
            if (query) await rq.query(query);
          }
        }
      }
  
      logs.push("Proceso de inserción completado.");
  
      // Estado final
      for (const table of tablesToLog) {
        const cQ = await getCount('quito', table);
        const cG = await getCount('guayaquil', table);
        const cC = await getCount('cuenca', table);
        logs.push(`> Estado final ${table}: Quito (${cQ}), Guayaquil (${cG}), Cuenca (${cC})`);
      }
      logs.push("¡Distribución exitosa!");
  
      res.json({ logs });
  
    } catch (error) {
      logs.push(`ERROR: ${error.message}`);
      res.status(500).json({ logs, message: `Error en el proceso: ${error.message}` });
    }
  };
  

export const executeVerticalDemo = async (req, res) => {
    const { nodeName } = req.params; // El nodo se recibe desde la URL
    const logs = [];
    
    const connection = dbPools[nodeName];
    if (!connection) {
        return res.status(404).json({ message: 'Nodo no encontrado' });
    }

    const capitalizedNodeName = nodeName.charAt(0).toUpperCase() + nodeName.slice(1);
    const baseTable = `HistorialClinico_Base_${capitalizedNodeName}`;
    const detalleTable = `HistorialClinico_Detalle_${capitalizedNodeName}`;

    // Datos de ejemplo dinámicos y coherentes
    const demoHistorialMap = {
        quito: { HistorialID: 'HCQ001', CitaID: 'CQ001', CedulaPaciente: '1700000001' },
        guayaquil: { HistorialID: 'HCG001', CitaID: 'CG001', CedulaPaciente: '0900000001' },
        cuenca: { HistorialID: 'HCC001', CitaID: 'CC001', CedulaPaciente: '0100000001' }
    };

    const nuevoHistorial = {
        ...demoHistorialMap[nodeName],
        Diagnostico: `Diagnóstico de prueba en ${capitalizedNodeName}`,
        ResultadosExamenes: `Resultados de exámenes de ${capitalizedNodeName}`,
        PlanTratamiento: `Plan de tratamiento de ${capitalizedNodeName}`
    };

    try {
        logs.push(`Iniciando demostración de Fragmentación Vertical en ${capitalizedNodeName}...`);
        
        const getVCount = async (table) => {
            const q = `SELECT COUNT(*) as count FROM ${table}`;
            if (connection.type === 'pg') {
                const result = await connection.pool.query(q);
                return result.rows[0].count;
            } else {
                const result = await connection.pool.request().query(q);
                return result.recordset[0].count;
            }
        };
        
        const initialCount = `> Estado inicial: ${baseTable} (${await getVCount(baseTable)}), ${detalleTable} (${await getVCount(detalleTable)})`;
        logs.push(initialCount);

        logs.push(`-> Creando nuevo Historial Clínico ${nuevoHistorial.HistorialID} para la Cita ${nuevoHistorial.CitaID}...`);
        
        let reconstructedData;

        if (connection.type === 'pg') {
            const baseQuery = `INSERT INTO ${baseTable} (HistorialID, CitaID, CedulaPaciente, Diagnostico, FechaCreacion) VALUES ($1, $2, $3, $4, NOW())`;
            await connection.pool.query(baseQuery, [nuevoHistorial.HistorialID, nuevoHistorial.CitaID, nuevoHistorial.CedulaPaciente, nuevoHistorial.Diagnostico]);
            logs.push("--> Datos base insertados con éxito.");

            const detalleQuery = `INSERT INTO ${detalleTable} (HistorialID, ResultadosExamenes, PlanTratamiento) VALUES ($1, $2, $3)`;
            await connection.pool.query(detalleQuery, [nuevoHistorial.HistorialID, nuevoHistorial.ResultadosExamenes, nuevoHistorial.PlanTratamiento]);
            logs.push("--> Datos de detalle insertados con éxito.");

            const joinQuery = `SELECT b.*, d.ResultadosExamenes, d.PlanTratamiento FROM ${baseTable} b JOIN ${detalleTable} d ON b.HistorialID = d.HistorialID WHERE b.HistorialID = $1`;
            const result = await connection.pool.query(joinQuery, [nuevoHistorial.HistorialID]);
            reconstructedData = result.rows[0];

        } else { // sql
            const baseQuery = `INSERT INTO ${baseTable} (HistorialID, CitaID, CedulaPaciente, Diagnostico, FechaCreacion) VALUES (@p1, @p2, @p3, @p4, GETDATE())`;
            const baseRequest = connection.pool.request();
            baseRequest.input('p1', sql.VarChar, nuevoHistorial.HistorialID);
            baseRequest.input('p2', sql.VarChar, nuevoHistorial.CitaID);
            baseRequest.input('p3', sql.VarChar, nuevoHistorial.CedulaPaciente);
            baseRequest.input('p4', sql.Text, nuevoHistorial.Diagnostico);
            await baseRequest.query(baseQuery);
            logs.push("--> Datos base insertados con éxito.");

            const detalleQuery = `INSERT INTO ${detalleTable} (HistorialID, ResultadosExamenes, PlanTratamiento) VALUES (@p1, @p2, @p3)`;
            const detalleRequest = connection.pool.request();
            detalleRequest.input('p1', sql.VarChar, nuevoHistorial.HistorialID);
            detalleRequest.input('p2', sql.Text, nuevoHistorial.ResultadosExamenes);
            detalleRequest.input('p3', sql.Text, nuevoHistorial.PlanTratamiento);
            await detalleRequest.query(detalleQuery);
            logs.push("--> Datos de detalle insertados con éxito.");

            const joinQuery = `SELECT b.*, d.ResultadosExamenes, d.PlanTratamiento FROM ${baseTable} b JOIN ${detalleTable} d ON b.HistorialID = d.HistorialID WHERE b.HistorialID = @p1`;
            const joinRequest = connection.pool.request();
            joinRequest.input('p1', sql.VarChar, nuevoHistorial.HistorialID);
            const result = await joinRequest.query(joinQuery);
            reconstructedData = result.recordset[0];
        }
        
        const finalCount = `> Estado final: ${baseTable} (${await getVCount(baseTable)}), ${detalleTable} (${await getVCount(detalleTable)})`;
        logs.push(finalCount);
        logs.push("-> Reconstruyendo la vista completa del registro...");
        logs.push("¡Demostración completada con éxito!");
        
        res.json({ logs, reconstructedData });

    } catch (error) {
        logs.push(`ERROR: ${error.message}`);
        res.status(500).json({ logs, message: `Error en el proceso: ${error.message}` });
    }
};
