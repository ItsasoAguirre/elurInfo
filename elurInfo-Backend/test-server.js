console.log('Iniciando test completo del servidor...');

const { setupDatabase } = require('./dist/utils/database');
const { setupScheduledTasks } = require('./dist/utils/scheduler');
const { logger } = require('./dist/utils/logger');
const express = require('express');

async function testServer() {
  try {
    const app = express();
    const PORT = process.env.PORT || 3000;
    
    console.log('Paso 1: Configurando base de datos...');
    await setupDatabase();
    logger.info('Database initialized successfully');
    
    console.log('Paso 2: Configurando tareas programadas...');
    setupScheduledTasks();
    logger.info('Scheduled tasks configured');
    
    console.log('Paso 3: Iniciando servidor...');
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      console.log(`Servidor funcionando en puerto ${PORT}`);
    });
    
    // Mantener el servidor activo por un momento
    setTimeout(() => {
      console.log('Cerrando servidor de prueba...');
      server.close();
    }, 5000);
    
  } catch (error) {
    console.error('Error en el test del servidor:', error);
    logger.error('Failed to start server:', error);
  }
}

testServer();