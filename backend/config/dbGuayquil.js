import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const poolGuayaquil = new Pool({
  user: process.env.GUAYAQUIL_PG_USER,
  host: process.env.GUAYAQUIL_PG_HOST,
  database: process.env.GUAYAQUIL_PG_DATABASE,
  password: process.env.GUAYAQUIL_PG_PASSWORD,
  port: process.env.GUAYAQUIL_PG_PORT,
});

// Verificar la conexión
poolGuayaquil.connect()
  .then(() => console.log("Conexión a PostgreSQL (Guayaquil) establecida."))
  .catch(err => console.error("Error al conectar a PostgreSQL (Guayaquil):", err));

export default poolGuayaquil;