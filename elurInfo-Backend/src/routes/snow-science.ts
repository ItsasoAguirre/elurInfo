import { Router, Request, Response } from 'express';
import { models } from '../models';
import { snowScienceCacheService } from '../services/snow-science-cache.service';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @route GET /api/snow-science
 * @desc Gets all the latest snow science reports (one per area)
 * @access Public
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const reports = await snowScienceCacheService.getAllSnowScienceData();
    
    res.json({
      success: true,
      data: reports,
      count: reports.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching all latest snow science reports:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error when getting snow science reports',
      error: process.env['NODE_ENV'] === 'development' ? error : undefined
    });
  }
});

/**
 * @route GET /api/snow-science/:area
 * @desc Gets the latest snow science report for a specific area
 * @param area - Area code (0: Catalan Pyrenees, 1: Navarre and Aragonese Pyrenees)
 * @access Public
 */
router.get('/:area', async (req: Request, res: Response): Promise<void> => {
  try {
    const areaParam = req.params['area'];
    if (!areaParam) {
      res.status(400).json({
        success: false,
        message: 'Area parameter required'
      });
      return;
    }

    const areaCode = parseInt(areaParam);
    
    // Validate area code
    if (isNaN(areaCode) || (areaCode !== 0 && areaCode !== 1)) {
      res.status(400).json({
        success: false,
        message: 'Invalid area code. Must be 0 (Catalan Pyrenees) or 1 (Navarre and Aragonese Pyrenees)'
      });
      return;
    }

    const report = await snowScienceCacheService.getSnowScienceData(areaCode);
    
    if (!report) {
      res.status(404).json({
        success: false,
        message: `No snow science reports found for area ${areaCode}`
      });
      return;
    }

    // Parse complete data if necessary
    let datosCompletos;
    try {
      datosCompletos = JSON.parse(report.datosCompletos);
    } catch {
      datosCompletos = report.datosCompletos;
    }

    res.json({
      success: true,
      data: {
        ...report,
        datosCompletos
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error fetching snow science report for area ${req.params['area']}:`, error);
    res.status(500).json({
      success: false,
      message: 'Internal server error when getting snow science report',
      error: process.env['NODE_ENV'] === 'development' ? error : undefined
    });
  }
});

/**
 * @route GET /api/snow-science/:area/history
 * @desc Gets the history of snow science reports for a specific area
 * @param area - Area code (0: Catalan Pyrenees, 1: Navarre and Aragonese Pyrenees)
 * @query fechaInicio - Start date (ISO string, optional)
 * @query fechaFin - End date (ISO string, optional)
 * @query limit - Maximum number of reports to return (default: 30)
 * @access Public
 */
router.get('/:area/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const areaParam = req.params['area'];
    if (!areaParam) {
      res.status(400).json({
        success: false,
        message: 'Area parameter required'
      });
      return;
    }

    const areaCode = parseInt(areaParam);
    
    // Validate area code
    if (isNaN(areaCode) || (areaCode !== 0 && areaCode !== 1)) {
      res.status(400).json({
        success: false,
        message: 'Invalid area code. Must be 0 (Catalan Pyrenees) or 1 (Navarre and Aragonese Pyrenees)'
      });
      return;
    }

    // Get query parameters
    const limit = parseInt(req.query['limit'] as string) || 30;
    let fechaInicio = req.query['fechaInicio'] as string;
    let fechaFin = req.query['fechaFin'] as string;

    // If no dates provided, use the last 30 days
    if (!fechaInicio || !fechaFin) {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      
      fechaInicio = fechaInicio || thirtyDaysAgo.toISOString();
      fechaFin = fechaFin || now.toISOString();
    }

    const reports = await models.snowScienceReports.getByAreaAndDateRange(
      areaCode, 
      fechaInicio, 
      fechaFin
    );

    // Limit the number of results
    const limitedReports = reports.slice(0, limit);

    res.json({
      success: true,
      data: limitedReports,
      count: limitedReports.length,
      totalFound: reports.length,
      filters: {
        area: areaCode,
        fechaInicio,
        fechaFin,
        limit
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error fetching snow science history for area ${req.params['area']}:`, error);
    res.status(500).json({
      success: false,
      message: 'Internal server error when getting snow science history',
      error: process.env['NODE_ENV'] === 'development' ? error : undefined
    });
  }
});

/**
 * @route POST /api/snow-science/refresh
 * @desc Forces snow science data update from AEMET
 * @access Public (in production you might want to authenticate this)
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    logger.info('Manual refresh of snow science data requested');
    
    const areaParam = req.body?.area;
    const areaCode = areaParam !== undefined ? parseInt(areaParam) : undefined;
    
    // Validate area if provided
    if (areaCode !== undefined && (isNaN(areaCode) || (areaCode !== 0 && areaCode !== 1))) {
      res.status(400).json({
        success: false,
        message: 'Invalid area code. Must be 0 (Catalan Pyrenees) or 1 (Navarre and Aragonese Pyrenees)'
      });
      return;
    }

    // Use cache service to force update
    const results = await snowScienceCacheService.forceRefresh(areaCode);

    const response = {
      success: results.length > 0,
      data: results.map(report => ({
        areaCode: report.areaCode,
        area: report.area,
        id: report.id,
        success: true
      })),
      timestamp: new Date().toISOString(),
      summary: {
        successful: results.length,
        failed: 0,
        total: areaCode !== undefined ? 1 : 2
      }
    };

    const statusCode = results.length > 0 ? 200 : 500;
    res.status(statusCode).json(response);

  } catch (error) {
    logger.error('Error during manual snow science data refresh:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during update',
      error: process.env['NODE_ENV'] === 'development' ? error : undefined
    });
  }
});

/**
 * @route GET /api/snow-science/stats
 * @desc Gets basic statistics of snow science reports
 * @access Public
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [dbStats, cacheStats] = await Promise.all([
      models.snowScienceReports.getStats(),
      snowScienceCacheService.getCacheStats()
    ]);
    
    res.json({
      success: true,
      data: {
        database: dbStats,
        cache: cacheStats
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching snow science stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error when getting statistics',
      error: process.env['NODE_ENV'] === 'development' ? error : undefined
    });
  }
});

export default router;