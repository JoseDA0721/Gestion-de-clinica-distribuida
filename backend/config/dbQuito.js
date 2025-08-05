import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const poolQuito = new Pool({
  user: process.env.QUITO_PG_USER,
  host: process.env.QUITO_PG_HOST,
  database: process.env.QUITO_PG_DATABASE,
  password: process.env.QUITO_PG_PASSWORD,
  port: process.env.QUITO_PG_PORT,
});

// Verificar la conexión
poolQuito.connect()
  .then(() => console.log("Conexión a PostgreSQL (Quito) establecida."))
  .catch(err => console.error("Error al conectar a PostgreSQL (Quito):", err));

export default poolQuito;