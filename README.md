# ElurInfo - MVP Funcional

## 📱 Aplicación de Información de Avalanchas en el Pirineo

ElurInfo es una aplicación completa que proporciona información actualizada sobre el riesgo de avalanchas y predicciones meteorológicas en el Pirineo. La aplicación está construida siguiendo principios SOLID y Clean Code.

## 🏗️ Arquitectura del Proyecto

### Frontend (Vue 3 + Capacitor)
- **Framework**: Vue 3 con Composition API
- **Router**: Vue Router 4 para navegación
- **PWA**: Service Worker con cache offline
- **UI**: Sistema de tabs personalizado (sin Ionic)
- **Offline**: LocalForage para almacenamiento local
- **Mapas**: Leaflet para visualización de zonas

### Backend (Node.js + Express)
- **Framework**: Express.js con TypeScript
- **Base de datos**: SQLite con migraciones versionadas
- **Cache**: Sistema de cache inteligente con expiración
- **Logging**: Winston para logs estructurados
- **Seguridad**: Helmet, CORS, Rate Limiting

## 📁 Estructura del Proyecto

```
elurInfo/
├── elurInfo-FrontEnd/          # Aplicación frontend
│   ├── src/
│   │   ├── pages/             # Páginas principales
│   │   ├── components/        # Componentes reutilizables
│   │   ├── composables/       # Lógica de negocio (hooks)
│   │   ├── services/          # Servicios de API y offline
│   │   ├── types/             # Definiciones TypeScript
│   │   └── constants/         # Constantes de configuración
│   ├── public/               # Assets estáticos y PWA
│   └── package.json
│
└── elurInfo-Backend/          # API backend
    ├── src/
    │   ├── routes/           # Rutas de la API
    │   ├── models/           # Modelos de base de datos
    │   ├── services/         # Servicios de negocio
    │   ├── utils/            # Utilidades y helpers
    │   └── migrations/       # Migraciones de BD
    ├── data/                 # Base de datos SQLite
    └── package.json
```

## 🚀 Características Implementadas

### ✅ Frontend
- [x] **Navegación por tabs**: Mapa, Estaciones, Ajustes
- [x] **PWA completa**: Manifest, Service Worker, cache offline
- [x] **Componentes modulares**: Siguiendo principios SOLID
- [x] **Gestión de estado offline**: LocalForage + IndexedDB
- [x] **Responsive design**: Optimizado para móvil y desktop
- [x] **Detección de conectividad**: Indicador offline/online

### ✅ Backend
- [x] **API REST completa**: 3 endpoints principales
- [x] **Base de datos SQLite**: Migraciones versionadas
- [x] **Sistema de cache**: Expiración inteligente por tipo de dato
- [x] **Logging avanzado**: Winston con rotación de logs
- [x] **Tareas programadas**: Limpieza automática de datos
- [x] **Backup automático**: Base de datos con retención configurable

## 🔧 APIs Implementadas

### 📊 Endpoints Disponibles

#### 1. Boletín de Avalanchas
```
GET /avalancha              # Todos los boletines
GET /avalancha/zone/:zone   # Por zona específica
GET /avalancha/risk/:level  # Por nivel de riesgo
GET /avalancha/stats        # Estadísticas
```

#### 2. Predicciones de Montaña
```
GET /montana                # Todas las predicciones
GET /montana/zone/:zone     # Por zona específica
GET /montana/zones          # Lista de zonas
GET /montana/stats          # Estadísticas
```

#### 3. Predicciones Municipales
```
GET /municipio/:id          # Por ID de municipio
GET /municipio              # Lista de municipios
GET /municipio/zone/:zone   # Por zona
GET /municipio/stats        # Estadísticas
```

#### 4. Salud del Sistema
```
GET /health                 # Estado general
GET /health/ready           # Estado de servicios
GET /health/live            # Liveness probe
```

## 🗃️ Base de Datos

### Tablas Implementadas
- **avalanche_reports**: Boletines de avalanchas (válidos 24h)
- **mountain_forecasts**: Predicciones de montaña (válidas 1h)
- **municipal_forecasts**: Predicciones municipales (válidas 1h)
- **api_cache**: Cache de respuestas API
- **migrations**: Control de versiones del esquema

### Características de la BD
- ✅ Índices optimizados para consultas frecuentes
- ✅ Triggers automáticos para updated_at
- ✅ Constraints de integridad
- ✅ Modo WAL para mejor concurrencia
- ✅ VACUUM automático semanal

## ⚡ Sistema de Cache

### Niveles de Cache
1. **Frontend (Service Worker)**: Cache de assets estáticos
2. **Frontend (LocalForage)**: Datos offline en IndexedDB
3. **Backend (SQLite)**: Cache de respuestas API
4. **Base de datos**: Datos persistentes

### Política de Expiración
- **Boletines de avalanchas**: 24 horas
- **Predicciones de montaña**: 1 hora
- **Predicciones municipales**: 1 hora
- **Assets estáticos**: Cache indefinido con versionado

## 🔄 Tareas Programadas

- **Cada hora**: Limpieza de cache expirado
- **Cada 6 horas**: Limpieza de predicciones antiguas
- **Diario (2 AM)**: Limpieza de predicciones expiradas
- **Semanal (Domingo 3 AM)**: VACUUM de base de datos
- **Diario (4 AM)**: Backup automático

## 🛠️ Instalación y Configuración

### 1. Backend

```bash
cd elurInfo-Backend
npm install
cp .env.example .env
# Configurar variables de entorno en .env
npm run migrate up
npm run dev
```

### 2. Frontend

```bash
cd elurInfo-FrontEnd
npm install
npm run dev
```

### Variables de Entorno (.env)
```env
# Server
PORT=3000
NODE_ENV=development

# AEMET API (para implementación futura)
AEMET_API_KEY=your_key_here
AEMET_BASE_URL=https://opendata.aemet.es/opendata/api

# Database
DATABASE_PATH=./data/elurinfo.db
DATABASE_BACKUP_PATH=./data/backups

# Cache
CACHE_AVALANCHE_HOURS=24
CACHE_MOUNTAIN_HOURS=1
CACHE_MUNICIPAL_HOURS=1

# CORS
CORS_ORIGIN=http://localhost:5173
```

## 🧪 Estado del MVP

### ✅ Completado
- Arquitectura completa frontend y backend
- Sistema de navegación y PWA
- Base de datos con migraciones
- Cache multinivel
- APIs REST con datos mock
- Sistema de logging y monitoreo
- Tareas de mantenimiento automatizadas

### 🔄 Pendiente para Producción
- Integración real con API de AEMET
- Autenticación y autorización
- Tests unitarios y de integración
- Despliegue con Docker
- Monitoreo con métricas
- Implementación de Leaflet en el mapa

## 📱 Uso de la Aplicación

1. **Mapa**: Visualización de zonas de riesgo (mock implementation)
2. **Estaciones**: Lista de predicciones de montaña por zonas
3. **Ajustes**: Configuración de idioma, zona favorita, y refresh automático

La aplicación funciona completamente offline después de la primera carga, mostrando datos cached cuando no hay conectividad.

## 🏔️ Zonas Cubiertas

### Pirineo Aragonés
- Benasque (22015)
- Canfranc (22040)
- Panticosa (22178)
- Torla-Ordesa (22242)

### Pirineo Navarro
- Isaba (31174)
- Ochagavía (31175)
- Roncal (31246)
- Burguete (31269)

## 📞 Estado de la Integración AEMET

El MVP incluye la estructura completa para integrar con la API de AEMET:
- Servicios preparados para conexión real
- Cache optimizado para tipos de datos de AEMET
- Transformación de datos lista para implementar
- Error handling para APIs externas

**Próximo paso**: Implementar `AemetService` con la API key real.

## 📝 Contribución y Conventional Commits

Este proyecto utiliza **Conventional Commits** para mantener un historial de cambios claro y consistente.

### Tipos de Commit Permitidos

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `feat` | Nueva funcionalidad | `feat(frontend): add avalanche map visualization` |
| `fix` | Corrección de bug | `fix(backend): resolve SQLite connection timeout` |
| `docs` | Solo documentación | `docs(readme): update installation instructions` |
| `style` | Formato, espacios | `style(ui): fix button alignment` |
| `refactor` | Refactorización | `refactor(api): extract validation logic` |
| `perf` | Mejora de rendimiento | `perf(cache): optimize database queries` |
| `test` | Tests | `test(api): add integration tests for endpoints` |
| `build` | Build system | `build(deps): update dependencies` |
| `ci` | CI/CD | `ci: add automated testing workflow` |
| `chore` | Other changes | `chore: update gitignore` |

### Recommended Scopes
- `frontend` - Vue.js/frontend changes
- `backend` - Node.js/backend changes  
- `database` - SQLite/migrations changes
- `api` - REST endpoints changes
- `ui` - User interface changes
- `config` - Project configuration
- `deps` - Dependencies
- `release` - Versions and releases

### Commit Commands

```bash
# Interactive wizard (recommended)
npm run commit

# Manual commit (automatically validated)
git commit -m "feat(frontend): add avalanche map visualization"
```

### Automatic Validation

- **Pre-commit**: Verifies format before committing
- **Commit-msg**: Validates message follows conventional format
- **Template**: Use `git commit` to see template with examples

---

**ElurInfo MVP v1.0** - Una base sólida para información de avalanchas en el Pirineo 🏔️