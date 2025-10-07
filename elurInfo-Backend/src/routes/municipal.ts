import { Router, Request, Response } from 'express'
import { asyncHandler, createError } from '../utils/errorHandler'
import { logger } from '../utils/logger'
import { models } from '../models'

const router = Router()

// Predefined municipalities with their data
const MUNICIPALITIES = {
  // Pirineo Aragonés
  '22015': { name: 'Benasque', zone: 'Pirineo Aragonés', province: 'Huesca' },
  '22040': { name: 'Canfranc', zone: 'Pirineo Aragonés', province: 'Huesca' },
  '22178': { name: 'Panticosa', zone: 'Pirineo Aragonés', province: 'Huesca' },
  '22242': { name: 'Torla-Ordesa', zone: 'Pirineo Aragonés', province: 'Huesca' },
  
  // Pirineo Navarro
  '31174': { name: 'Isaba', zone: 'Pirineo Navarro', province: 'Navarra' },
  '31175': { name: 'Ochagavía', zone: 'Pirineo Navarro', province: 'Navarra' },
  '31246': { name: 'Roncal', zone: 'Pirineo Navarro', province: 'Navarra' },
  '31269': { name: 'Burguete', zone: 'Pirineo Navarro', province: 'Navarra' }
}

// GET /municipio/:id - Obtener predicción municipal
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  if (!id) {
    res.status(400).json({
      success: false,
      message: 'ID de municipio requerido'
    })
    return
  }

  // Validate municipality ID
  const municipalityData = MUNICIPALITIES[id as keyof typeof MUNICIPALITIES]
  if (!municipalityData) {
    throw createError(`Municipio con ID ${id} no está disponible`, 404)
  }

  try {
    if (!models.isInitialized()) {
      await models.initialize()
    }

    // Check for valid cached data (1 hour for municipal forecasts)
    const validHours = parseInt(process.env['CACHE_MUNICIPAL_HOURS'] || '1')
    
    const forecast = await models.municipalForecasts.findByMunicipalityId(id)
    
    // Check if we have recent data
    if (forecast) {
      const isValid = await models.municipalForecasts.isDataValid(id, validHours)
      
      if (isValid) {
        logger.info('Serving municipal forecast from database', { 
          municipalityId: id,
          municipalityName: municipalityData.name,
          lastUpdate: forecast.last_update
        })

        return res.json({
          success: true,
          data: {
            ...forecast,
            forecast_data: JSON.parse(forecast.forecast_json),
            municipality_info: municipalityData
          },
          cached: true,
          lastUpdate: forecast.last_update,
          source: 'database'
        })
      }
    }

    // If no recent data, generate mock data for MVP
    const today = new Date().toISOString().split('T')[0] || new Date().toISOString().substring(0, 10)
    const mockMunicipalData = {
      municipality_id: id,
      municipality_name: municipalityData.name,
      forecast_json: JSON.stringify({
        nombre: municipalityData.name,
        provincia: municipalityData.province,
        fecha: today,
        prediccion: {
          dia: {
            estadoCielo: {
              descripcion: 'Poco nuboso',
              value: '13'
            },
            precipitacion: {
              descripcion: 'No significativa',
              value: '0'
            },
            probPrecipitacion: [0, 5, 10, 0],
            cotaNieveProv: 1800,
            temperatura: {
              maxima: municipalityData.zone === 'Pirineo Aragonés' ? 8 : 10,
              minima: municipalityData.zone === 'Pirineo Aragonés' ? -2 : 0
            },
            sensTermica: {
              maxima: municipalityData.zone === 'Pirineo Aragonés' ? 6 : 8,
              minima: municipalityData.zone === 'Pirineo Aragonés' ? -4 : -2
            },
            humedadRelativa: {
              maxima: 85,
              minima: 45
            },
            viento: [
              {
                direccion: 'N',
                velocidad: 15,
                periodo: '00-06'
              },
              {
                direccion: 'NE',
                velocidad: 10,
                periodo: '06-12'
              },
              {
                direccion: 'E',
                velocidad: 8,
                periodo: '12-18'
              },
              {
                direccion: 'SE',
                velocidad: 12,
                periodo: '18-24'
              }
            ]
          }
        },
        elaborado: new Date().toISOString(),
        descripcion: `Predicción para ${municipalityData.name}. Día con cielo poco nuboso y temperaturas estables.`
      }),
      valid_date: today,
      last_update: new Date().toISOString()
    }

    // Save mock data to database
    await models.municipalForecasts.upsert(mockMunicipalData)

    logger.info('Serving mock municipal forecast', { 
      municipalityId: id,
      municipalityName: municipalityData.name
    })

    res.json({
      success: true,
      data: {
        ...mockMunicipalData,
        forecast_data: JSON.parse(mockMunicipalData.forecast_json),
        municipality_info: municipalityData
      },
      cached: false,
      lastUpdate: new Date().toISOString(),
      source: 'mock-data',
      message: 'Datos de prueba - Integración con AEMET pendiente'
    })
    return

  } catch (error) {
    logger.error('Error fetching municipal forecast:', { municipalityId: id, error })
    res.status(500).json({
      success: false,
      message: 'Error al obtener predicción municipal',
      error: process.env['NODE_ENV'] === 'development' ? error : undefined
    })
    return
  }
}))

// GET /municipio - Obtener lista de municipios disponibles
router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  try {
    if (!models.isInitialized()) {
      await models.initialize()
    }

    const stats = await models.municipalForecasts.getMunicipalityStatistics()

    // Combine predefined municipalities with database statistics
    const municipalitiesWithData = Object.entries(MUNICIPALITIES).map(([id, info]) => {
      const stat = stats.find(s => s.municipality_id === id)
      return {
        id,
        name: info.name,
        zone: info.zone,
        province: info.province,
        hasData: !!stat,
        forecastCount: stat?.count || 0,
        latestForecast: stat?.latest_date || null
      }
    })

    logger.info('Serving available municipalities', { count: municipalitiesWithData.length })

    res.json({
      success: true,
      data: municipalitiesWithData,
      summary: {
        total: municipalitiesWithData.length,
        withData: municipalitiesWithData.filter(m => m.hasData).length,
        byZone: {
          'Pirineo Aragonés': municipalitiesWithData.filter(m => m.zone === 'Pirineo Aragonés').length,
          'Pirineo Navarro': municipalitiesWithData.filter(m => m.zone === 'Pirineo Navarro').length
        }
      },
      source: 'configuration'
    })

  } catch (error) {
    logger.error('Error fetching municipalities:', error)
    throw createError('Error al obtener lista de municipios', 500)
  }
}))

// GET /municipio/zone/:zone - Obtener municipios por zona
router.get('/zone/:zone', asyncHandler(async (req: Request, res: Response) => {
  const { zone } = req.params

  if (!zone) {
    throw createError('Zona requerida', 400)
  }

  const decodedZone = decodeURIComponent(zone)

  try {
    if (!models.isInitialized()) {
      await models.initialize()
    }

    // Filter municipalities by zone
    const municipalitiesInZone = Object.entries(MUNICIPALITIES)
      .filter(([, info]) => info.zone === decodedZone)
      .map(([id, info]) => ({ id, ...info }))

    if (municipalitiesInZone.length === 0) {
      throw createError(`No se encontraron municipios para la zona: ${decodedZone}`, 404)
    }

    // Get forecasts for municipalities in this zone
    const municipalityIds = municipalitiesInZone.map(m => m.id)
    const forecasts = await models.municipalForecasts.findByMunicipalities(municipalityIds)

    logger.info('Serving municipalities by zone', { 
      zone: decodedZone,
      municipalityCount: municipalitiesInZone.length,
      forecastCount: forecasts.length
    })

    res.json({
      success: true,
      data: {
        zone: decodedZone,
        municipalities: municipalitiesInZone,
        forecasts: forecasts.map(forecast => ({
          ...forecast,
          forecast_data: JSON.parse(forecast.forecast_json)
        }))
      },
      summary: {
        municipalityCount: municipalitiesInZone.length,
        forecastCount: forecasts.length
      },
      source: 'database'
    })

  } catch (error) {
    if (error instanceof Error && error.message.includes('No se encontraron')) {
      throw error
    }
    
    logger.error('Error fetching municipalities by zone:', { zone: decodedZone, error })
    throw createError('Error al obtener municipios por zona', 500)
  }
}))

// GET /municipio/stats - Obtener estadísticas municipales
router.get('/stats', asyncHandler(async (_req: Request, res: Response) => {
  try {
    if (!models.isInitialized()) {
      await models.initialize()
    }

    const stats = await models.municipalForecasts.getMunicipalityStatistics()

    logger.info('Serving municipal forecast statistics', { municipalityCount: stats.length })

    res.json({
      success: true,
      data: stats,
      summary: {
        totalMunicipalities: stats.length,
        configuredMunicipalities: Object.keys(MUNICIPALITIES).length,
        coverage: Object.keys(MUNICIPALITIES).length > 0 
          ? Math.round((stats.length / Object.keys(MUNICIPALITIES).length) * 100)
          : 0,
        byZone: {
          'Pirineo Aragonés': stats.filter(s => {
            const info = MUNICIPALITIES[s.municipality_id as keyof typeof MUNICIPALITIES]
            return info?.zone === 'Pirineo Aragonés'
          }).length,
          'Pirineo Navarro': stats.filter(s => {
            const info = MUNICIPALITIES[s.municipality_id as keyof typeof MUNICIPALITIES]
            return info?.zone === 'Pirineo Navarro'
          }).length
        }
      },
      source: 'database'
    })

  } catch (error) {
    logger.error('Error fetching municipal forecast statistics:', error)
    throw createError('Error al obtener estadísticas de predicciones municipales', 500)
  }
}))

export default router