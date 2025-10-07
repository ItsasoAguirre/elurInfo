import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables first
console.log('Loading environment variables...')
dotenv.config()
console.log('Environment loaded, PORT:', process.env['PORT'])

import { setupDatabase } from './utils/database'
import { logger } from './utils/logger'
import { errorHandler } from './utils/errorHandler'
import { setupScheduledTasks } from './utils/scheduler'

// Route imports
import avalancheRoutes from './routes/avalanche'
import mountainRoutes from './routes/mountain'
import municipalRoutes from './routes/municipal'
import healthRoutes from './routes/health'
import snowScienceRoutes from './routes/snow-science'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env['PORT'] || 3000

// Trust proxy for rate limiting behind reverse proxies
app.set('trust proxy', 1)

// Security middleware
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
}))

// CORS configuration
const corsOptions = {
  origin: process.env['CORS_ORIGIN']?.split(',') || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}
app.use(cors(corsOptions))

// Compression middleware
app.use(compression())

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Logging middleware
if (process.env['NODE_ENV'] === 'production') {
  app.use(morgan('combined', {
    stream: { write: (message: string) => logger.info(message.trim()) }
  }))
} else {
  app.use(morgan('dev'))
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
  max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'),
  message: {
    error: 'Demasiadas peticiones desde esta IP, inténtalo más tarde'
  },
  standardHeaders: true,
  legacyHeaders: false
})
app.use(limiter)

// API Routes
app.use('/health', healthRoutes)
app.use('/avalancha', avalancheRoutes)
app.use('/montana', mountainRoutes)
app.use('/municipio', municipalRoutes)
app.use('/snow-science', snowScienceRoutes)

// API documentation route
app.get('/api', (_req, res) => {
  res.json({
    name: 'ElurInfo API',
    version: '1.0.0',
    description: 'API para información de avalanchas en el Pirineo',
    endpoints: {
      health: '/health',
      avalanche: '/avalancha',
      mountain: '/montana',
      municipal: '/municipio/:id',
      snowScience: '/snow-science'
    },
    documentation: 'https://github.com/ItsasoAguirre/elurInfo'
  })
})

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    message: `La ruta ${req.originalUrl} no existe`
  })
})

// Serve static files in production
if (process.env['NODE_ENV'] === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist')
  app.use(express.static(frontendPath))
  
  // Serve frontend for all non-API routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'))
  })
}

// Global error handler
app.use(errorHandler)

// Graceful shutdown handling
process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)

let serverInstance: any = null;

async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`)
  
  // Close server
  if (serverInstance) {
    serverInstance.close(() => {
      logger.info('HTTP server closed')
      process.exit(0)
    })
  }
  
  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down')
    process.exit(1)
  }, 30000)
}

async function startServer() {
  try {
    // Initialize database
    await setupDatabase()
    logger.info('Database initialized successfully')
    
    // Setup scheduled tasks
    setupScheduledTasks()
    logger.info('Scheduled tasks configured')
    
    // Start server
    serverInstance = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`)
      logger.info(`Environment: ${process.env['NODE_ENV'] || 'development'}`)
      logger.info(`CORS enabled for: ${corsOptions.origin}`)
    })
    
    return serverInstance
    
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Start the server
startServer()

export default app