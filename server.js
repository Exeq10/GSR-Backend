// Importa los módulos necesarios
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { dbconnect } from "./src/config/database/db.js";

import reservasRoutes from './src/routes/reservas.js';
import authRoutes from './src/routes/auth.js';

// Configurar dotenv antes de usar variables de entorno
dotenv.config();

// Crear una instancia de Express
const app = express();

// Configuración de Swagger
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Sesiones y Usuarios",
      version: "1.0.0",
      description: "Documentación de la API para gestionar sesiones y usuarios",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Servidor local",
      },
    ],
  },
  apis: ["./src/controllers/*.js"],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Ruta para servir el JSON de Swagger
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDocs);
});

// Middleware
app.use(express.json());
app.use(cors());

// Middleware para registrar las solicitudes entrantes
app.use((req, res, next) => {
  console.log(`Solicitud ${req.method} a ${req.path}`);
  next();
});

// Ruta de prueba
app.use('/api/reservas', reservasRoutes);
app.use('/api/auth', authRoutes);

// Definir puerto
const PORT = process.env.PORT || 3000;

// Función para iniciar el servidor
const startServer = async () => {
  try {
    // Conectar a la base de datos
    await dbconnect();

    // Iniciar el servidor correctamente
    const server = app.listen(PORT, () => {
      console.log(`Servidor en ejecución en el puerto ${PORT}`);
      console.log(`Documentación de la API: http://localhost:${PORT}/api-docs`);
      console.log(`Swagger JSON: http://localhost:${PORT}/swagger.json`);
    });
  } catch (error) {
    console.error("Error al conectar a la base de datos:", error);
  }
};

// Iniciar el servidor
startServer();
