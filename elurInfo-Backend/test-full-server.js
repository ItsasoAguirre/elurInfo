console.log("Iniciando test del servidor paso a paso...");

try {
  // 1. Imports
  console.log("1. Cargando dependencias...");
  const express = require("express");
  const cors = require("cors");
  const helmet = require("helmet");
  const compression = require("compression");
  const morgan = require("morgan");
  const rateLimit = require("express-rate-limit");
  require("dotenv").config();
  
  const { setupDatabase } = require("./dist/utils/database");
  const { logger } = require("./dist/utils/logger");
  const { errorHandler } = require("./dist/utils/errorHandler");
  const { setupScheduledTasks } = require("./dist/utils/scheduler");
  
  const avalancheRoutes = require("./dist/routes/avalanche").default;
  const mountainRoutes = require("./dist/routes/mountain").default;
  const municipalRoutes = require("./dist/routes/municipal").default;
  const healthRoutes = require("./dist/routes/health").default;
  const snowScienceRoutes = require("./dist/routes/snow-science").default;
  
  console.log("✓ Dependencias cargadas");

  // 2. Configuración de Express
  console.log("2. Configurando Express...");
  const app = express();
  const PORT = process.env.PORT || 3000;
  
  app.set('trust proxy', 1);
  console.log("✓ Express configurado");

  // 3. Middlewares de seguridad
  console.log("3. Configurando middlewares de seguridad...");
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));
  console.log("✓ Helmet configurado");

  // 4. CORS
  console.log("4. Configurando CORS...");
  const corsOptions = {
    origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  };
  app.use(cors(corsOptions));
  console.log("✓ CORS configurado");

  // 5. Middlewares básicos
  console.log("5. Configurando middlewares básicos...");
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  console.log("✓ Middlewares básicos configurados");

  // 6. Rate limiting
  console.log("6. Configurando rate limiting...");
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);
  console.log("✓ Rate limiting configurado");

  // 7. Logging (solo en producción)
  if (process.env.NODE_ENV === 'production') {
    console.log("7. Configurando logging...");
    app.use(morgan('combined', {
      stream: { write: (message) => logger.info(message.trim()) }
    }));
    console.log("✓ Logging configurado");
  } else {
    console.log("7. Saltando logging (modo desarrollo)");
  }

  // 8. Rutas
  console.log("8. Configurando rutas...");
  app.use('/api/health', healthRoutes);
  app.use('/api/avalanche', avalancheRoutes);
  app.use('/api/mountain', mountainRoutes);
  app.use('/api/municipal', municipalRoutes);
  app.use('/api/snow-science', snowScienceRoutes);
  console.log("✓ Rutas configuradas");

  // 9. Error handler
  console.log("9. Configurando error handler...");
  app.use(errorHandler);
  console.log("✓ Error handler configurado");

  console.log("10. Iniciando configuración de base de datos...");
  setupDatabase()
    .then(() => {
      console.log("✓ Base de datos configurada");
      
      console.log("11. Iniciando scheduler...");
      setupScheduledTasks();
      console.log("✓ Scheduler iniciado");
      
      console.log("12. Iniciando servidor...");
      const server = app.listen(PORT, () => {
        console.log(`✓ ¡Servidor ejecutándose en puerto ${PORT}!`);
        console.log(`✓ Ambiente: ${process.env.NODE_ENV || 'development'}`);
        
        // Test básico del servidor
        setTimeout(() => {
          console.log("13. Realizando test básico...");
          const http = require('http');
          const options = {
            hostname: 'localhost',
            port: PORT,
            path: '/api/health',
            method: 'GET'
          };

          const req = http.request(options, (res) => {
            console.log(`✓ Status del health check: ${res.statusCode}`);
            console.log("🎉 ¡Servidor funcionando correctamente!");
            server.close(() => {
              console.log("✓ Servidor cerrado");
              process.exit(0);
            });
          });

          req.on('error', (err) => {
            console.error('❌ Error en health check:', err.message);
            server.close(() => {
              console.log("✓ Servidor cerrado");
              process.exit(1);
            });
          });

          req.end();
        }, 1000);
      });

      server.on('error', (err) => {
        console.error('❌ Error del servidor:', err.message);
      });
      
    })
    .catch((error) => {
      console.error("❌ Error configurando base de datos:", error.message);
      console.error("Stack:", error.stack);
    });

} catch (error) {
  console.error("❌ Error general:", error.message);
  console.error("Stack:", error.stack);
}