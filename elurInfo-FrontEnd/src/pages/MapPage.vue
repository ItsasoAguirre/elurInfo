<template>
  <div class="map-page">
    <div class="page-header">
      <h1>Mapa de Avalanchas</h1>
      <p class="subtitle">Cordillera pirenaica</p>
    </div>
    
    <div class="map-container" ref="mapContainer">
      <!-- Leaflet map will be mounted here -->
    </div>
    
    <div class="map-legend">
      <div class="legend-item">
        <span class="legend-color risk-1"></span>
        <span>Riesgo 1 - Débil</span>
      </div>
      <div class="legend-item">
        <span class="legend-color risk-2"></span>
        <span>Riesgo 2 - Limitado</span>
      </div>
      <div class="legend-item">
        <span class="legend-color risk-3"></span>
        <span>Riesgo 3 - Notable</span>
      </div>
      <div class="legend-item">
        <span class="legend-color risk-4"></span>
        <span>Riesgo 4 - Fuerte</span>
      </div>
      <div class="legend-item">
        <span class="legend-color risk-5"></span>
        <span>Riesgo 5 - Muy fuerte</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAvalancheMap } from '../composables/useAvalancheMap'

const mapContainer = ref<HTMLElement>()
const { initializeMap, destroyMap } = useAvalancheMap()

onMounted(() => {
  if (mapContainer.value) {
    initializeMap(mapContainer.value)
  }
})

onUnmounted(() => {
  destroyMap()
})
</script>

<style scoped>
.map-page {
  height: 100%;
  display: flex;
  flex-direction: column;
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

.map-container {
  flex: 1;
  position: relative;
}

.map-legend {
  background: white;
  padding: 12px 16px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.risk-1 { background: #4caf50; }
.risk-2 { background: #ffeb3b; }
.risk-3 { background: #ff9800; }
.risk-4 { background: #f44336; }
.risk-5 { background: #9c27b0; }

@media (max-width: 480px) {
  .page-header {
    padding: 12px;
  }
  
  .page-header h1 {
    font-size: 20px;
  }
  
  .map-legend {
    padding: 8px 12px;
    gap: 8px;
  }
  
  .legend-item {
    font-size: 11px;
  }
}
</style>