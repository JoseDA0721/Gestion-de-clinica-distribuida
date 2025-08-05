-- Simulaci�n de generaci�n de ID �nico con prefijo (ej. IC001)
DECLARE @nuevoValor INT;
UPDATE Secuencias
SET ValorActual = ValorActual + 1
OUTPUT 'IC' + RIGHT('000' + CAST(INSERTED.ValorActual AS VARCHAR), 3)
WHERE Nombre = 'inventario_cuenca';

-- Replicaci�n uniderreccional
-- Verificacion de tabla Medicamentos
-- Antes y despu�s de insertar
SELECT COUNT(*) FROM Medicamentos;

-- Insertar 10 medicamentos en Cuenca con ID incremental
DECLARE @i INT = 1;

WHILE @i <= 10
BEGIN
    INSERT INTO Medicamentos (MedicamentoID, NombreComercial, NombreGenerico, PrincipioActivo, Fabricante, FormaFarmaceutica, FechaCreacion)
    VALUES (
        @i + 100,  -- MedicamentoID �nico
        CONCAT('Medicamento_C', @i),
        'Gen�rico_' + CAST(@i AS VARCHAR),
        'Paracetamol',
        'Farmac�utica CUE',
        'Tableta',
        GETDATE()
    );

    SET @i = @i + 1;
END;

SELECT * FROM Medicamentos;

-- Replicaci�n bidireccional

--Verificacion de tabla NotasInformativas
-- Antes y despues de insertar
SELECT COUNT(*) FROM NotasInformativas;

-- Generar 10 notas desde Cuenca: NC001 - NC010
DECLARE @i INT = 1;
WHILE @i <= 10
BEGIN
    INSERT INTO NotasInformativas (
        NotaID, Titulo, Contenido, FechaCreacion, NodoOrigen
    )
    VALUES (
        CONCAT('NC', RIGHT('000' + CAST(@i AS VARCHAR), 3)),
        CONCAT('Nota desde Cuenca #', @i),
        CONCAT('Contenido generado en Cuenca #', @i),
        GETDATE(),
        'Cuenca'
    );
    SET @i = @i + 1;
END;

SELECT * FROM NotasInformativas


-- Replicacion unidereccional
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

INSERT INTO medicamentos
SELECT *
FROM medicamentos_remoto
ON CONFLICT (MedicamentoID) DO NOTHING;

-- Verificacion de tabla Medicamentos Replicación uniderreccional desde Cuenca
-- Antes y después de insertar
SELECT COUNT(*) FROM Medicamentos;

-- Replicacion Biderreccional

--Verificacion de tabla NotasInformativas
-- Antes y despues de insertar
SELECT COUNT(*) FROM NotasInformativas;

-- Insertar 10 notas automáticamente
DO $$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..10 LOOP
        INSERT INTO NotasInformativas (
            NotaID, Titulo, Contenido, NodoOrigen
        ) VALUES (
            'NG' || LPAD(nextval('seq_notas_guayaquil')::TEXT, 3, '0'),
            'Nota desde Guayaquil #' || i,
            'Contenido de la nota ' || i,
            'Guayaquil'
        );
    END LOOP;
END $$;

-- Replicacion hacia Cuenca

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

-- Funcion de replicacion
CREATE OR REPLACE FUNCTION replicar_notas_a_cuenca()
RETURNS void AS $$
BEGIN
  INSERT INTO notas_informativas_sqlserver (NotaID, Titulo, Contenido, FechaCreacion, NodoOrigen)
  SELECT n.NotaID, n.Titulo, n.Contenido, n.FechaCreacion, n.NodoOrigen
  FROM NotasInformativas n
  LEFT JOIN notas_informativas_sqlserver r ON n.NotaID = r.NotaID
  WHERE r.NotaID IS NULL;
END;
$$ LANGUAGE plpgsql;

SELECT replicar_notas_a_cuenca();

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

SELECT replicar_notas_desde_cuenca();

-- ========================================
-- 🪪 2. Crear el nodo pglogical en cada servidor
-- Cambia el nombre del nodo y la DSN según el host actual
-- ========================================

-- En Guayaquil:
SELECT pglogical.create_node(
    node_name := 'nodo_guayaquil',
    dsn := 'host=pg_guayaquil port=5432 dbname=clinica user=postgres password=postgres'
);

-- ========================================
-- 📦 3. Crear set de replicación (idéntico en ambos nodos)
-- ========================================
SELECT pglogical.create_replication_set('notas_set');

-- ========================================
-- 📋 4. Agregar tabla NotasInformativas al set
-- ========================================
SELECT pglogical.replication_set_add_table(
    set_name := 'notas_set',
    relation := 'NotasInformativas',
    synchronize_data := true
);

-- ========================================
-- 🔗 5. Crear suscripciones cruzadas para replicación bidireccional
-- ========================================

-- En Guayaquil (se suscribe a Quito):
SELECT pglogical.create_subscription(
    subscription_name := 'sub_desde_quito',
    provider_dsn := 'host=pg_quito port=5432 dbname=clinica user=postgres password=postgres',
    replication_sets := ARRAY['notas_set']
);

-- ========================================
-- ✅ 6. Verificar estado de replicación
-- Ejecutar en el nodo proveedor (donde se crea la suscripción)
-- ========================================
SELECT * FROM pg_stat_replication;

-- ========================================
-- ❌ 7. Eliminar suscripciones y nodos (si es necesario)
-- ========================================
-- Eliminar suscripción:
-- SELECT pglogical.drop_subscription('sub_desde_quito');

-- Eliminar nodo pglogical:
-- SELECT pglogical.drop_node(node_name := 'nodo_guayaquil');

IMPORT FOREIGN SCHEMA dbo
  LIMIT TO (Medicamentos)
  FROM SERVER sqlserver_cuenca INTO public;


IMPORT FOREIGN SCHEMA dbo
  LIMIT TO (INFORMATION_SCHEMA.TABLES)
  FROM SERVER sqlserver_cuenca INTO public;

CREATE FOREIGN TABLE test_ping_sqlserver (
  resultado int
)
SERVER sqlserver_cuenca
OPTIONS (
  query 'SELECT 1 AS resultado'
);

SELECT * FROM test_ping_sqlserver;

-- Conexion hacia Guayauil
CREATE SERVER nodo_guayaquil
  FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (
    host 'pg_guayaquil',
    port '5432',
    dbname 'clinica'
  );

CREATE USER MAPPING FOR postgres
  SERVER nodo_guayaquil
  OPTIONS (
    user 'postgres',
    password 'postgres'
  );

-- Replicacion unidereccional
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

INSERT INTO medicamentos
SELECT *
FROM medicamentos_remoto
ON CONFLICT (MedicamentoID) DO NOTHING;

-- Verificacion de tabla Medicamentos (Replicación uniderreccional desde Cuenca)
-- Antes y después de insertar
SELECT COUNT(*) FROM Medicamentos;

-- Replicacion Biderreccional

--Verificacion de tabla NotasInformativas
-- Antes y despues de insertar
SELECT COUNT(*) FROM NotasInformativas;

-- Insertar 10 notas automáticamente
DO $$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..10 LOOP
        INSERT INTO NotasInformativas (
            NotaID, Titulo, Contenido, NodoOrigen
        ) VALUES (
            'NQ' || LPAD(nextval('seq_notas_quito')::TEXT, 3, '0'),
            'Nota desde Quito #' || i,
            'Contenido de la nota ' || i,
            'Quito'
        );
    END LOOP;
END $$;

-- Replicacion desde cuenca

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

-- Funcion de replicacion hacia Cuenca
CREATE OR REPLACE FUNCTION replicar_notas_a_cuenca()
RETURNS void AS $$
BEGIN
  INSERT INTO notas_informativas_sqlserver (NotaID, Titulo, Contenido, FechaCreacion, NodoOrigen)
  SELECT n.NotaID, n.Titulo, n.Contenido, n.FechaCreacion, n.NodoOrigen
  FROM NotasInformativas n
  LEFT JOIN notas_informativas_sqlserver r ON n.NotaID = r.NotaID
  WHERE r.NotaID IS NULL;
END;
$$ LANGUAGE plpgsql;

SELECT replicar_notas_a_cuenca();

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

SELECT replicar_notas_desde_cuenca();

-- ========================================
-- 🪪 2. Crear el nodo pglogical en cada servidor
-- Cambia el nombre del nodo y la DSN según el host actual
-- ========================================
-- En Quito:
SELECT pglogical.create_node(
    node_name := 'nodo_quito',
    dsn := 'host=pg_quito port=5432 dbname=clinica user=postgres password=postgres'
);

-- ========================================
-- 📦 3. Crear set de replicación (idéntico en ambos nodos)
-- ========================================
SELECT pglogical.create_replication_set('notas_set');

-- ========================================
-- 📋 4. Agregar tabla NotasInformativas al set
-- ========================================
SELECT pglogical.replication_set_add_table(
    set_name := 'notas_set',
    relation := 'NotasInformativas',
    synchronize_data := true
);

-- ========================================
-- 🔗 5. Crear suscripciones cruzadas para replicación bidireccional
-- ========================================
-- En Quito (se suscribe a Guayaquil):
SELECT pglogical.create_subscription(
    subscription_name := 'sub_desde_guayaquil',
    provider_dsn := 'host=pg_guayaquil port=5432 dbname=clinica user=postgres password=postgres',
    replication_sets := ARRAY['notas_set']
);

-- ========================================
-- ✅ 6. Verificar estado de replicación
-- Ejecutar en el nodo proveedor (donde se crea la suscripción)
-- ========================================
SELECT * FROM pg_stat_replication;

-- ========================================
-- ❌ 7. Eliminar suscripciones y nodos (si es necesario)
-- ========================================
-- Eliminar suscripción:
-- SELECT pglogical.drop_subscription('sub_desde_guayaquil');
-- Eliminar nodo pglogical:
-- SELECT pglogical.drop_node(node_name := 'nodo_quito');