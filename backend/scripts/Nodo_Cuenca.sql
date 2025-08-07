-- Scrip Nodo Cuenca (26.8.200.66)

-- Tabla de secuencias personalizada
CREATE TABLE Secuencias (
    Nombre VARCHAR(50) PRIMARY KEY,
    ValorActual INT NOT NULL
);

-- Inicializar valores para Cuenca
INSERT INTO Secuencias (Nombre, ValorActual) VALUES 
('inventario_cuenca', 0),
('cita_cuenca', 0),
('receta_cuenca', 0),
('historial_cuenca', 0);

-- Historial cl�nico fragmentado verticalmente
CREATE TABLE HistorialClinico_Base_Cuenca (
    HistorialID VARCHAR(10) PRIMARY KEY,
    CitaID VARCHAR(10),
    CedulaPaciente VARCHAR(15),
    Diagnostico TEXT,
    NotaEvolucion TEXT,
    FechaCreacion DATETIME NOT NULL
);

CREATE TABLE HistorialClinico_Detalle_Cuenca (
    HistorialID VARCHAR(10) PRIMARY KEY,
    ResultadosExamenes TEXT,
    PlanTratamiento TEXT
);

-- Pacientes
CREATE TABLE Pacientes_Cuenca (
    Cedula VARCHAR(15) PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL,
    Apellido VARCHAR(100) NOT NULL,
    FechaNacimiento DATE,
    Genero VARCHAR(20),
    DireccionCompleta TEXT,
    Telefono VARCHAR(50),
    Email VARCHAR(100),
    SedeRegistroID INT NOT NULL,
    NodoOrigen VARCHAR(50),
    FechaCreacion DATETIME NOT NULL,
    CONSTRAINT CHK_Paciente_Cuenca CHECK (SedeRegistroID = 3)
);

-- Doctores
CREATE TABLE Doctores_Cuenca (
    CedulaProfesional VARCHAR(20) PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL,
    Apellido VARCHAR(100) NOT NULL,
    Especialidad VARCHAR(100),
    TelefonoConsultorio VARCHAR(50),
    Email VARCHAR(100),
    SedePrincipalID INT NOT NULL,
    NodoOrigen VARCHAR(50),
    FechaCreacion DATETIME NOT NULL,
    CONSTRAINT CHK_Doctor_Cuenca CHECK (SedePrincipalID = 3)
);

-- Citas
CREATE TABLE Citas_Cuenca (
    CitaID VARCHAR(10) PRIMARY KEY,
    CedulaPaciente VARCHAR(15),
    CedulaProfesional VARCHAR(20),
    SedeID INT NOT NULL,
    FechaHoraCita DATETIME,
    MotivoConsulta TEXT,
    EstadoCita VARCHAR(50) NOT NULL,
    ConsultorioAsignado VARCHAR(50),
    NodoOrigen VARCHAR(50),
    FechaCreacion DATETIME NOT NULL,
    CONSTRAINT CHK_Cita_Cuenca CHECK (SedeID = 3)
);

-- Recetas
CREATE TABLE Recetas_Cuenca (
    RecetaID VARCHAR(10) PRIMARY KEY,
    CitaID VARCHAR(10),
    MedicamentoID INT,
    Dosis VARCHAR(50),
    Frecuencia VARCHAR(50),
    DuracionTratamiento VARCHAR(50),
    InstruccionesAdicionales TEXT,
    FechaCreacion DATETIME NOT NULL
);

-- Inventario de Medicamentos
CREATE TABLE InventarioMedicamentos_Cuenca (
    InventarioID VARCHAR(10) PRIMARY KEY,
    SedeID INT NOT NULL,
    MedicamentoID INT,
    CantidadStock INT NOT NULL,
    Lote VARCHAR(50),
    FechaCaducidad DATE,
    UbicacionAlmacen VARCHAR(100),
    FechaCreacion DATETIME NOT NULL,
    CONSTRAINT CHK_Inventario_Cuenca CHECK (SedeID = 3)
);

-- Tablas replicadas
CREATE TABLE Sedes (
    SedeID INT PRIMARY KEY,
    NombreSede VARCHAR(100) NOT NULL,
    Ciudad VARCHAR(100) NOT NULL,
    Direccion VARCHAR(200),
    Telefono VARCHAR(50),
    CedulaDirectorMedico VARCHAR(20),
    FechaCreacion DATETIME NOT NULL
);

CREATE TABLE Medicamentos (
    MedicamentoID INT PRIMARY KEY,
    NombreComercial VARCHAR(100) NOT NULL,
    NombreGenerico VARCHAR(100),
    PrincipioActivo VARCHAR(100),
    Fabricante VARCHAR(100),
    FormaFarmaceutica VARCHAR(100),
    FechaCreacion DATETIME NOT NULL
);


CREATE TABLE NotasInformativas (
    NotaID VARCHAR(10) PRIMARY KEY,
    Titulo VARCHAR(100) NOT NULL,
    Contenido TEXT,
    FechaCreacion DATETIME NOT NULL DEFAULT GETDATE(),
    NodoOrigen VARCHAR(50) NOT NULL
);

-- Configuracion de Conexion

-- Habilitar proveedor MSDASQL
EXEC master.dbo.sp_msset_oledb_prop
    N'MSDASQL', N'AllowInProcess', 1;

EXEC master.dbo.sp_msset_oledb_prop
    N'MSDASQL', N'DynamicParameters', 1;


-- Crear Linked Server para PostgreSQL Quito
EXEC sp_addlinkedserver
    @server = N'POSTGRES_QUITO',
    @srvproduct = N'PostgreSQL',
    @provider = N'MSDASQL',
    @datasrc = N'PostgresQuitoTest'; -- Nombre del DSN creado

-- Crear credenciales de acceso
EXEC sp_addlinkedsrvlogin
    @rmtsrvname = N'POSTGRES_QUITO',
    @useself = N'False',
    @locallogin = NULL,
    @rmtuser = 'postgres',
    @rmtpassword = 'P@ssw0rd';

-- Verificacion de conexion hacia Quito
SELECT * FROM OPENQUERY(POSTGRES_QUITO_TEST, 'SELECT 1 AS Conexion_Test');

-- Crear Linked Server para PostgreSQL Guayaquil
EXEC sp_addlinkedserver
    @server = N'POSTGRES_GUAYAQUIL',
    @srvproduct = N'PostgreSQL',
    @provider = N'MSDASQL',
    @datasrc = N'PostgresGuayaquilTest'; -- Nombre del DSN creado

-- Crear credenciales de acceso
EXEC sp_addlinkedsrvlogin
    @rmtsrvname = N'POSTGRES_GUAYAQUIL',
    @useself = N'False',
    @locallogin = NULL,
    @rmtuser = 'postgres',
    @rmtpassword = 'P@ssw0rd';

-- Verificacion de conexion hacia Guayaquil
SELECT * FROM OPENQUERY(POSTGRES_GUAYAQUIL_TEST, 'SELECT 1 AS Conexion_Test');



