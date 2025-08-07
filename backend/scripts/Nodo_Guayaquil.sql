-- Script Nodo Guayaquil (26.26.58.209)

-- Secuencias para IDs serializables con prefijo
CREATE SEQUENCE seq_inventario_Guayaquil START 1;
CREATE SEQUENCE seq_cita_Guayaquil START 1;
CREATE SEQUENCE seq_receta_Guayaquil START 1;
CREATE SEQUENCE seq_historial_Guayaquil START 1;
CREATE SEQUENCE seq_notas_Guayaquil START 1;

-- Historial clínico (fragmentación vertical derivada)
CREATE TABLE HistorialClinico_Base_Guayaquil (
    HistorialID VARCHAR PRIMARY KEY DEFAULT ('HCQ' || LPAD(nextval('seq_historial_Guayaquil')::TEXT, 3, '0')),
    CitaID VARCHAR,
    CedulaPaciente VARCHAR,
    Diagnostico TEXT,
    NotaEvolucion TEXT,
    FechaCreacion TIMESTAMP NOT NULL
);

CREATE TABLE HistorialClinico_Detalle_Guayaquil  (
    HistorialID VARCHAR PRIMARY KEY,
    ResultadosExamenes TEXT,
    PlanTratamiento TEXT
);

-- Pacientes
CREATE TABLE Pacientes_Guayaquil  (
    Cedula VARCHAR PRIMARY KEY,
    Nombre VARCHAR NOT NULL,
    Apellido VARCHAR NOT NULL,
    FechaNacimiento DATE,
    Genero VARCHAR(20),
    DireccionCompleta TEXT,
    Telefono VARCHAR,
    Email VARCHAR,
    SedeRegistroID INT,
    NodoOrigen VARCHAR(50),
    FechaCreacion TIMESTAMP NOT NULL,
    CHECK (SedeRegistroID = 2)
);

-- Doctores
CREATE TABLE Doctores_Guayaquil  (
    CedulaProfesional VARCHAR PRIMARY KEY,
    Nombre VARCHAR NOT NULL,
    Apellido VARCHAR NOT NULL,
    Especialidad VARCHAR,
    TelefonoConsultorio VARCHAR,
    Email VARCHAR,
    SedePrincipalID INT,
    NodoOrigen VARCHAR(50),
    FechaCreacion TIMESTAMP NOT NULL,
    CHECK (SedePrincipalID = 2)
);

-- Citas
CREATE TABLE Citas_Guayaquil  (
    CitaID VARCHAR PRIMARY KEY DEFAULT ('CQ' || LPAD(nextval('seq_cita_Guayaquil')::TEXT, 3, '0')),
    CedulaPaciente VARCHAR,
    CedulaProfesional VARCHAR,
    SedeID INT,
    FechaHoraCita TIMESTAMP,
    MotivoConsulta TEXT,
    EstadoCita VARCHAR NOT NULL,
    ConsultorioAsignado VARCHAR,
    NodoOrigen VARCHAR(50),
    FechaCreacion TIMESTAMP NOT NULL,
    CHECK (SedeID = 2)
);

-- Recetas
CREATE TABLE Recetas_Guayaquil  (
    RecetaID VARCHAR PRIMARY KEY DEFAULT ('RQ' || LPAD(nextval('seq_receta_Guayaquil')::TEXT, 3, '0')),
    CitaID VARCHAR,
    MedicamentoID INT,
    Dosis VARCHAR,
    Frecuencia VARCHAR,
    DuracionTratamiento VARCHAR,
    InstruccionesAdicionales TEXT,
    FechaCreacion TIMESTAMP NOT NULL
);

-- Inventario de Medicamentos
CREATE TABLE InventarioMedicamentos_Guayaquil  (
    InventarioID VARCHAR PRIMARY KEY DEFAULT ('IQ' || LPAD(nextval('seq_inventario_Guayaquil')::TEXT, 3, '0')),
    SedeID INT,
    MedicamentoID INT,
    CantidadStock INT NOT NULL,
    Lote VARCHAR,
    FechaCaducidad DATE,
    UbicacionAlmacen VARCHAR,
    FechaCreacion TIMESTAMP NOT NULL,
    CHECK (SedeID = 2)
);

-- Sedes (replicada)
CREATE TABLE Sedes (
    SedeID INT PRIMARY KEY,
    NombreSede VARCHAR NOT NULL,
    Ciudad VARCHAR NOT NULL,
    Direccion VARCHAR,
    Telefono VARCHAR,
    CedulaDirectorMedico VARCHAR,
    FechaCreacion TIMESTAMP NOT NULL
);

-- Medicamentos (replicada unibidirreccional)
CREATE TABLE Medicamentos (
    MedicamentoID INT PRIMARY KEY,
    NombreComercial VARCHAR NOT NULL,
    NombreGenerico VARCHAR,
    PrincipioActivo VARCHAR,
    Fabricante VARCHAR,
    FormaFarmaceutica VARCHAR,
    FechaCreacion TIMESTAMP NOT NULL
);

-- Notificaciones (replicada bidirreccional)
CREATE TABLE NotasInformativas (
    NotaID VARCHAR PRIMARY KEY,
    Titulo VARCHAR(100) NOT NULL,
    Contenido TEXT,
    FechaCreacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    NodoOrigen VARCHAR(50) NOT NULL
);

-- Configuracion de conexiones

-- Extensiones de conexion
-- Extension para conectar Postgres -> SQL Server
CREATE EXTENSION IF NOT EXISTS tds_fdw;
-- Extension para conectar Postgres -> Postgres
CREATE EXTENSION IF NOT EXISTS postgres_fdw;
-- Extension para replicacion bidireccional
CREATE EXTENSION IF NOT EXISTS pglogical;

-- Crear el servidor SQL Server Cuenca
CREATE SERVER sqlserver_cuenca
  FOREIGN DATA WRAPPER tds_fdw
  OPTIONS (
    servername '26.8.200.66',  -- IP del host Windows
    port '1433',
    database 'clincia_cuenca',
    msg_handler 'notice'
  );

CREATE USER MAPPING FOR postgres
  SERVER sqlserver_cuenca
  OPTIONS (
    username 'sa',
    password 'P@ssw0rd'
  );

CREATE FOREIGN TABLE test_ping_sqlserver (
  resultado int
)
SERVER sqlserver_cuenca
OPTIONS (
  query 'SELECT 1 AS resultado'
);

SELECT * FROM test_ping_sqlserver;

-- Conexion hacia Guayaquil
CREATE SERVER nodo_quito
  FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (
    host '26.44.192.25',
    port '5432',
    dbname 'clinica_quito',
  );

CREATE USER MAPPING FOR postgres
  SERVER nodo_guayaquil
  OPTIONS (
    user 'postgres',
    password 'P@ssw0rd'
  );

-- Crear nodo Guayaquil para replicación
SELECT pglogical.create_node(
    node_name := 'nodo_guayaquil',
    dsn := 'host=26.26.58.209 port=5432 dbname=clninica_guayaquil user=postgres password=P@ssw0rd'
);
-- Crear set de replicación +
SELECT pglogical.create_replication_set('notas_set');

-- Agregar tabla NotasInformativas al set
SELECT pglogical.replication_set_add_table(
    set_name := 'notas_set',
    relation := 'NotasInformativas',
    synchronize_data := true
);

-- Crear suscripcion
SELECT pglogical.create_subscription(
    subscription_name := 'sub_desde_guayaquil',
    provider_dsn := 'host=26.44.192.25 port=5432 dbname=clinica_quito user=postgres password=P@ssw0rd',
    replication_sets := ARRAY['notas_set']
);

-- Verificar estado de replicación
SELECT * FROM pg_stat_replication;


CREATE FOREIGN TABLE medicamentos_remoto (
    MedicamentoID INT,
    NombreComercial VARCHAR,
    NombreGenerico VARCHAR,
    PrincipioActivo VARCHAR,
    Fabricante VARCHAR,
    FormaFarmaceutica VARCHAR,
    FechaCreacion TIMESTAMP
)
SERVER sqlserver_cuenca
OPTIONS (
    schema_name 'dbo',
    table_name 'Medicamentos'
);

CREATE OR REPLACE FUNCTION replicar_medicamentos()
RETURNS void AS $$
BEGIN
    INSERT INTO medicamentos
    SELECT *
    FROM medicamentos_remoto
    ON CONFLICT (MedicamentoID) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Foreing Table
CREATE FOREIGN TABLE notas_informativas_sqlserver (
    NotaID VARCHAR(10),
    Titulo VARCHAR(100),
    Contenido TEXT,
    FechaCreacion TIMESTAMP,
    NodoOrigen VARCHAR(50)
)
SERVER sqlserver_cuenca
OPTIONS (
    schema_name 'dbo',
    table_name 'NotasInformativas'
);

-- Funcion de replicacion desde cuenca
CREATE OR REPLACE FUNCTION replicar_notas_desde_cuenca()
RETURNS void AS $$
BEGIN
  INSERT INTO NotasInformativas (NotaID, Titulo, Contenido, FechaCreacion, NodoOrigen)
  SELECT r.NotaID, r.Titulo, r.Contenido, r.FechaCreacion, r.NodoOrigen
  FROM notas_informativas_sqlserver r
  LEFT JOIN NotasInformativas n ON n.NotaID = r.NotaID
  WHERE n.NotaID IS NULL;
END;
$$ LANGUAGE plpgsql;
