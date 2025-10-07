<template>
  <div class="stations-page">
    <div class="page-header">
      <h1>Estaciones</h1>
      <p class="subtitle">Predicciones de montaña</p>
    </div>
    
    <div class="stations-content">
      <!-- Loading state -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando predicciones...</p>
      </div>
      
      <!-- Error state -->
      <div v-else-if="error" class="error-state">
        <span class="error-icon">⚠️</span>
        <p>{{ error }}</p>
        <button @click="loadForecasts" class="retry-button">
          Reintentar
        </button>
      </div>
      
      <!-- Forecasts list -->
      <div v-else class="forecasts-list">
        <div
          v-for="forecast in forecasts"
          :key="forecast.id"
          class="forecast-card"
          @click="selectForecast(forecast)"
        >
          <div class="forecast-header">
            <h3>{{ forecast.zone }}</h3>
            <span class="forecast-date">{{ formatDate(forecast.valid_date) }}</span>
          </div>
          
          <div class="forecast-preview">
            {{ getPreviewText(forecast.forecast_json) }}
          </div>
          
          <div class="forecast-meta">
            <span class="update-time">
              Actualizado: {{ formatTime(forecast.last_update) }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- Empty state -->
      <div v-if="!loading && !error && forecasts.length === 0" class="empty-state">
        <span class="empty-icon">🏔️</span>
        <p>No hay predicciones disponibles</p>
      </div>
    </div>
    
    <!-- Floating refresh button -->
    <button 
      @click="loadForecasts" 
      class="refresh-button"
      :disabled="loading"
    >
      <span class="refresh-icon" :class="{ spinning: loading }">🔄</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMountainForecasts } from '../composables/useMountainForecasts'
import type { MountainForecast } from '../types'

const { 
  forecasts, 
  loading, 
  error, 
  loadForecasts,
  selectForecast 
} = useMountainForecasts()

onMounted(() => {
  loadForecasts()
})

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
}

const formatTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getPreviewText = (forecastJson: string): string => {
  try {
    const data = JSON.parse(forecastJson)
    // Extract relevant preview information
    return data.descripcion || data.resumen || 'Predicción disponible'
  } catch {
    return 'Ver detalles'
  }
}
</script>

<style scoped>
.stations-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.page-header {
  padding: 16px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.subtitle {
  font-size: 14px;
  color: #666;
}

.stations-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
  color: #666;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #2196f3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon,
.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.retry-button {
  margin-top: 16px;
  padding: 8px 16px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.retry-button:hover {
  background: #1976d2;
}

.forecasts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.forecast-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e0e0e0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.forecast-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.forecast-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 8px;
}

.forecast-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.forecast-date {
  font-size: 12px;
  color: #666;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
}

.forecast-preview {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.forecast-meta {
  font-size: 12px;
  color: #999;
}

.refresh-button {
  position: fixed;
  bottom: 80px;
  right: 16px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #2196f3;
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  transition: all 0.2s ease;
}

.refresh-button:hover {
  background: #1976d2;
  transform: scale(1.05);
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

@media (max-width: 480px) {
  .page-header {
    padding: 12px;
  }
  
  .page-header h1 {
    font-size: 20px;
  }
  
  .stations-content {
    padding: 12px;
  }
  
  .forecast-card {
    padding: 12px;
  }
  
  .refresh-button {
    bottom: 70px;
  }
}
</style>