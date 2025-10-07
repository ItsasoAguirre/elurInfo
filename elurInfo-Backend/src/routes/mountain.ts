import { Router, Request, Response } from 'express'
import { asyncHandler, createError } from '../utils/errorHandler'
import { logger } from '../utils/logger'
import { models } from '../models'

const router = Router()

// Predefined mountain zones
const MOUNTAIN_ZONES = [
  'Pirineo Aragonés',
  'Pirineo Navarro',
  'Pirineo Catalán'
]

// GET /montana - Obtener predicciones de montaña
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!models.isInitialized()) {
      await models.initialize()
    }

    // Check for valid cached data (1 hour for mountain forecasts)
    const validHours = parseInt(process.env.CACHE_MOUNTAIN_HOURS || '1')
    
    // Get latest forecasts for all mountain zones
    const forecasts = await models.mountainForecasts.findLatestByZones(MOUNTAIN_ZONES)
    
    // Check if we have recent data for all zones
    const cutoffTime = new Date(Date.now() - validHours * 60 * 60 * 1000)
    const validForecasts = forecasts.filter(forecast => 
      new Date(forecast.last_update) > cutoffTime
    )

    const hasRecentDataForAllZones = MOUNTAIN_ZONES.every(zone =>
      validForecasts.some(forecast => forecast.zone === zone)
    )

    if (hasRecentDataForAllZones) {
      logger.info('Serving mountain forecasts from database', { 
        count: validForecasts.length,
        zones: validForecasts.map(f => f.zone)
      })

      return res.json({
        success: true,
        data: validForecasts.map(forecast => ({
          ...forecast,
          forecast_data: JSON.parse(forecast.forecast_json)
        })),
        cached: true,
        lastUpdate: validForecasts[0]?.last_update,
        source: 'database'
      })
    }

    // If no recent data, generate mock data for MVP
    const today = new Date().toISOString().split('T')[0] || new Date().toISOString().substring(0, 10)
    const mockMountainData = MOUNTAIN_ZONES.map(zone => ({
      zone,
      forecast_json: JSON.stringify({
        fecha: today,
        zona: zone,
        cota_nieve: zone === 'Pirineo Aragonés' ? 1800 : zone === 'Pirineo Navarro' ? 1600 : 1700,
        temperaturas: {
          maximas: zone === 'Pirineo Aragonés' ? [2, 8] : zone === 'Pirineo Navarro' ? [4, 10] : [3, 9],
          minimas: zone === 'Pirineo Aragonés' ? [-4, 2] : zone === 'Pirineo Navarro' ? [-2, 4] : [-3, 3]
        },
        viento: {
          direccion: 'N',
          velocidad: zone === 'Pirineo Aragonés' ? 20 : 15
        },
        cielo: 'Poco nuboso',
        precipitacion: 'Débil',
        visibilidad: 'Buena',
        descripcion: `Condiciones estables en ${zone}. Cielo poco nuboso con temperaturas en descenso.`
      }),
      valid_date: today,
      last_update: new Date().toISOString()
    }))

    // Save mock data to database
    for (const mockForecast of mockMountainData) {
      await models.mountainForecasts.upsert(mockForecast)
    }

    logger.info('Serving mock mountain forecast data', { 
      count: mockMountainData.length,
      zones: mockMountainData.map(f => f.zone)
    })

    res.json({
      success: true,
      data: mockMountainData.map(forecast => ({
        ...forecast,
        forecast_data: JSON.parse(forecast.forecast_json)
      })),
      cached: false,
      lastUpdate: new Date().toISOString(),
      source: 'mock-data',
      message: 'Datos de prueba - Integración con AEMET pendiente'
    })

  } catch (error) {
    logger.error('Error fetching mountain forecasts:', error)
    throw createError('Error al obtener predicciones de montaña', 500)
  }
}))

// GET /montana/zone/:zone - Obtener predicción para una zona específica
router.get('/zone/:zone', asyncHandler(async (req: Request, res: Response) => {
  const { zone } = req.params

  if (!zone) {
    throw createError('Zona requerida', 400)
  }

  try {
    if (!models.isInitialized()) {
      await models.initialize()
    }

    const forecast = await models.mountainForecasts.findByZone(decodeURIComponent(zone))

    if (!forecast) {
      throw createError(`No se encontró predicción para la zona: ${zone}`, 404)
    }

    // Check if data is still valid (1 hour)
    const validHours = parseInt(process.env.CACHE_MOUNTAIN_HOURS || '1')
    const isValid = await models.mountainForecasts.isDataValid(forecast.zone, validHours)

    logger.info('Serving mountain forecast for zone', { 
      zone: forecast.zone,
      isValid,
      lastUpdate: forecast.last_update
    })

    res.json({
      success: true,
      data: {
        ...forecast,
        forecast_data: JSON.parse(forecast.forecast_json)
      },
      cached: true,
      valid: isValid,
      lastUpdate: forecast.last_update,
      source: 'database'
    })

  } catch (error) {
    if (error instanceof Error && error.message.includes('No se encontró')) {
      throw error
    }
    
    logger.error('Error fetching mountain forecast for zone:', { zone, error })
    throw createError('Error al obtener predicción de montaña para la zona', 500)
  }
}))

// GET /montana/zones - Obtener lista de zonas disponibles
router.get('/zones', asyncHandler(async (_req: Request, res: Response) => {
  try {
    if (!models.isInitialized()) {
      await models.initialize()
    }

    const stats = await models.mountainForecasts.getZoneStatistics()

    logger.info('Serving available mountain zones')

    res.json({
      success: true,
      data: {
        predefined: MOUNTAIN_ZONES,
        withData: stats,
        count: MOUNTAIN_ZONES.length
      },
      source: 'configuration'
    })

  } catch (error) {
    logger.error('Error fetching mountain zones:', error)
    throw createError('Error al obtener zonas de montaña', 500)
  }
}))

// GET /montana/stats - Obtener estadísticas de predicciones
router.get('/stats', asyncHandler(async (_req: Request, res: Response) => {
  try {
    if (!models.isInitialized()) {
      await models.initialize()
    }

    const stats = await models.mountainForecasts.getZoneStatistics()

    logger.info('Serving mountain forecast statistics', { zoneCount: stats.length })

    res.json({
      success: true,
      data: stats,
      summary: {
        totalZones: stats.length,
        configuredZones: MOUNTAIN_ZONES.length,
        coverage: MOUNTAIN_ZONES.length > 0 
          ? Math.round((stats.length / MOUNTAIN_ZONES.length) * 100)
          : 0
      },
      source: 'database'
    })

  } catch (error) {
    logger.error('Error fetching mountain forecast statistics:', error)
    throw createError('Error al obtener estadísticas de predicciones de montaña', 500)
  }
}))

export default router