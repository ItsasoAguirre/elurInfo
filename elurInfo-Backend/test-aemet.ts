import dotenv from 'dotenv';
import { aemetService } from './src/services/aemet.service';
import { logger } from './src/utils/logger';

// Cargar variables de entorno
dotenv.config();

async function testAemetConnection() {
  logger.info('=== Test de conexión con AEMET ===');

  try {
    // Test 1: Verificar health de la API
    logger.info('1. Verificando conectividad con AEMET...');
    const isHealthy = await aemetService.checkApiHealth();
    logger.info(`Estado de la API: ${isHealthy ? 'OK' : 'ERROR'}`);

    if (!isHealthy) {
      logger.error('La API de AEMET no está disponible');
      return;
    }

    // Test 2: Obtener datos nivológicos para Pirineo Catalán (área 0)
    logger.info('2. Obteniendo datos nivológicos para Pirineo Catalán (área 0)...');
    const dataCatalan = await aemetService.getNivologicalData(0);
    
    if (dataCatalan) {
      logger.info('✅ Datos nivológicos del Pirineo Catalán obtenidos correctamente');
      logger.info(`Área: ${dataCatalan.area}`);
      logger.info(`Fecha: ${dataCatalan.fecha}`);
      logger.info(`Datos presentes: ${dataCatalan.datos ? 'Sí' : 'No'}`);
    } else {
      logger.warn('⚠️ No se obtuvieron datos para el Pirineo Catalán');
    }

    // Test 3: Obtener datos nivológicos para Pirineo Navarro y Aragonés (área 1)
    logger.info('3. Obteniendo datos nivológicos para Pirineo Navarro y Aragonés (área 1)...');
    const dataAragon = await aemetService.getNivologicalData(1);
    
    if (dataAragon) {
      logger.info('✅ Datos nivológicos del Pirineo Navarro y Aragonés obtenidos correctamente');
      logger.info(`Área: ${dataAragon.area}`);
      logger.info(`Fecha: ${dataAragon.fecha}`);
      logger.info(`Datos presentes: ${dataAragon.datos ? 'Sí' : 'No'}`);
    } else {
      logger.warn('⚠️ No se obtuvieron datos para el Pirineo Navarro y Aragonés');
    }

    // Test 4: Obtener todos los datos
    logger.info('4. Obteniendo todos los datos nivológicos...');
    const allData = await aemetService.getAllNivologicalData();
    logger.info(`✅ Total de áreas con datos: ${allData.length}/2`);

    logger.info('=== Test completado ===');

  } catch (error) {
    logger.error('Error durante las pruebas:', error);
  }
}

// Ejecutar el test
testAemetConnection().catch(console.error);