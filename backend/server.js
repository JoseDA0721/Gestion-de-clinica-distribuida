import express from 'express';
import dotenv from 'dotenv';
import fragmentationRoutes from './routes/fragmentationRoutes.js';
import replicationRoutes from './routes/replicationRoutes.js';
import fragmentationDemoRoutes from './routes/fragmentationDemoRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import cors from 'cors';

// Cargar variables de entorno del archivo .env
dotenv.config();

const app = express();

// Middleware para aceptar JSON
app.use(cors());
app.use(express.json());

// Ruta de bienvenida
app.get('/api', (req, res) => {
  res.json({ message: 'API del Proyecto de BDD funcionando.' });
});

// Registrar las rutas de la aplicación
app.use('/api/fragmentation', fragmentationRoutes);
app.use('/api/fragmentation-demo', fragmentationDemoRoutes);
app.use('/api/replication', replicationRoutes);
app.use('/api/dashboard', dashboardRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});