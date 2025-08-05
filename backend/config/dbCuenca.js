import sql from 'mssql';
import dotenv from 'dotenv';
dotenv.config();

const sqlConfig = {
  user: process.env.CUENCA_SQL_USER,
  password: process.env.CUENCA_SQL_PASSWORD,
  server: process.env.CUENCA_SQL_SERVER,
  database: process.env.CUENCA_SQL_DATABASE,
  options: {
    trustServerCertificate: true,
  },
};

let poolCuenca;
try {
  poolCuenca = await sql.connect(sqlConfig);
  console.log("Conexión a SQL Server (Cuenca) establecida.");
} catch (err) {
  console.error("Error al conectar a SQL Server (Cuenca):", err);
}

export default poolCuenca;