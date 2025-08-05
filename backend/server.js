import express from 'express';
import dotenv from 'dotenv';
import fragmentationRoutes from './routes/fragmentationRoutes.js';
import replicationRoutes from './routes/replicationRoutes.js';

// Cargar variables de entorno del archivo .env
dotenv.config();

const app = express();

// Middleware para aceptar JSON
app.use(express.json());

// Ruta de bienvenida
app.get('/api', (req, res) => {
  res.json({ message: 'API del Proyecto de BDD funcionando.' });
});

// Registrar las rutas de la aplicación
app.use('/api/fragmentation', fragmentationRoutes);
app.use('/api/replication', replicationRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});