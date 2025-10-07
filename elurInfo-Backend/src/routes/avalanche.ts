import { Router, Request, Response } from 'express'
import { asyncHandler, createError } from '../utils/errorHandler'
import { logger } from '../utils/logger'
import { models } from '../models'

const router = Router()

// GET /avalancha - Obtener boletín de avalanchas
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Ensure models are initialized
    if (!models.isInitialized()) {
      await models.initialize()
    }

    // Check if we have valid cached data (24 hours for avalanche reports)
    const validHours = parseInt(process.env.CACHE_AVALANCHE_HOURS || '24')
    
    // Get all latest avalanche reports from database
    const reports = await models.avalancheReports.findLatest(50)
    
    // Check if we have recent data
    const cutoffTime = new Date(Date.now() - validHours * 60 * 60 * 1000)
    const recentReports = reports.filter(report => 
      new Date(report.last_update) > cutoffTime
    )

    if (recentReports.length > 0) {
      logger.info('Serving avalanche reports from database', { 
        count: recentReports.length,
        oldestUpdate: recentReports[recentReports.length - 1]?.last_update
      })

      return res.json({
        success: true,
        data: recentReports,
        cached: true,
        lastUpdate: recentReports[0]?.last_update,
        source: 'database'
      })
    }

    // If no recent data, try to fetch from AEMET API
    // For MVP, we'll return mock data and implement AEMET integration later
    const mockAvalancheData = [
      {
        zone: 'Pirineo Aragonés',
        risk_level: 2,
        description: 'Riesgo limitado de avalanchas. Precaución en pendientes pronunciadas orientadas al norte.',
        source_url: 'https://www.aemet.es/es/eltiempo/prediccion/montana',
        last_update: new Date().toISOString()
      },
      {
        zone: 'Pirineo Navarro',
        risk_level: 1,
        description: 'Riesgo débil de avalanchas. Condiciones generalmente estables.',
        source_url: 'https://www.aemet.es/es/eltiempo/prediccion/montana',
        last_update: new Date().toISOString()
      }
    ]

    // Save mock data to database
    for (const mockReport of mockAvalancheData) {
      await models.avalancheReports.upsert(mockReport)
    }

    logger.info('Serving mock avalanche data', { count: mockAvalancheData.length })

    res.json({
      success: true,
      data: mockAvalancheData,
      cached: false,
      lastUpdate: new Date().toISOString(),
      source: 'mock-data',
      message: 'Datos de prueba - Integración con AEMET pendiente'
    })

  } catch (error) {
    logger.error('Error fetching avalanche reports:', error)
    throw createError('Error al obtener boletín de avalanchas', 500)
  }
}))

// GET /avalancha/zone/:zone - Obtener boletín para una zona específica
router.get('/zone/:zone', asyncHandler(async (req: Request, res: Response) => {
  const { zone } = req.params

  if (!zone) {
    throw createError('Zona requerida', 400)
  }

  try {
    if (!models.isInitialized()) {
      await models.initialize()
    }

    const report = await models.avalancheReports.findByZone(zone)

    if (!report) {
      throw createError(`No se encontró información para la zona: ${zone}`, 404)
    }

    // Check if data is still valid (24 hours)
    const validHours = parseInt(process.env.CACHE_AVALANCHE_HOURS || '24')
    const cutoffTime = new Date(Date.now() - validHours * 60 * 60 * 1000)
    const isValid = new Date(report.last_update) > cutoffTime

    logger.info('Serving avalanche report for zone', { 
      zone,
      isValid,
      lastUpdate: report.last_update
    })

    res.json({
      success: true,
      data: report,
      cached: true,
      valid: isValid,
      lastUpdate: report.last_update,
      source: 'database'
    })

  } catch (error) {
    if (error instanceof Error && error.message.includes('No se encontró')) {
      throw error
    }
    
    logger.error('Error fetching avalanche report for zone:', { zone, error })
    throw createError('Error al obtener boletín de avalanchas para la zona', 500)
  }
}))

// GET /avalancha/risk/:level - Obtener zonas por nivel de riesgo
router.get('/risk/:level', asyncHandler(async (req: Request, res: Response) => {
  const { level } = req.params
  const riskLevel = parseInt(level)

  if (isNaN(riskLevel) || riskLevel < 1 || riskLevel > 5) {
    throw createError('Nivel de riesgo debe ser un número entre 1 y 5', 400)
  }

  try {
    if (!models.isInitialized()) {
      await models.initialize()
    }

    const reports = await models.avalancheReports.findByRiskLevel(riskLevel)

    logger.info('Serving avalanche reports by risk level', { 
      riskLevel,
      count: reports.length
    })

    res.json({
      success: true,
      data: reports,
      riskLevel,
      count: reports.length,
      source: 'database'
    })

  } catch (error) {
    logger.error('Error fetching avalanche reports by risk level:', { riskLevel, error })
    throw createError('Error al obtener zonas por nivel de riesgo', 500)
  }
}))

// GET /avalancha/stats - Obtener estadísticas de zonas
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!models.isInitialized()) {
      await models.initialize()
    }

    const stats = await models.avalancheReports.getZoneStatistics()

    logger.info('Serving avalanche statistics', { zoneCount: stats.length })

    res.json({
      success: true,
      data: stats,
      summary: {
        totalZones: stats.length,
        averageRisk: stats.length > 0 
          ? Math.round(stats.reduce((sum, stat) => sum + stat.latest_risk, 0) / stats.length * 10) / 10
          : 0
      },
      source: 'database'
    })

  } catch (error) {
    logger.error('Error fetching avalanche statistics:', error)
    throw createError('Error al obtener estadísticas de avalanchas', 500)
  }
}))

export default router