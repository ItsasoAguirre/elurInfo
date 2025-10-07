console.log('Iniciando test de base de datos...');

// Importar las funciones necesarias
const { setupDatabase } = require('./dist/utils/database');
const { logger } = require('./dist/utils/logger');

async function testDatabase() {
  try {
    console.log('Intentando conectar a la base de datos...');
    const db = await setupDatabase();
    console.log('Base de datos conectada exitosamente');
    
    console.log('Probando query simple...');
    const result = await db.get('SELECT 1 as test');
    console.log('Query result:', result);
    
    await db.close();
    console.log('Conexión cerrada');
  } catch (error) {
    console.error('Error en test de base de datos:', error);
  }
}

testDatabase();