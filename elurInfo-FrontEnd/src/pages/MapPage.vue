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
  display: grid;
  grid-template-rows: auto 1fr auto;
  grid-template-columns: 1fr;
  grid-template-areas:
    "header"
    "map"
    "legend";
  background: var(--color-surface);
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.page-header {
  grid-area: header;
  padding: var(--spacing-lg);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  width: 100%;
  box-sizing: border-box;
  display: grid;
  grid-template-rows: auto auto;
  gap: var(--spacing-xs);
}

.page-header h1 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
  line-height: var(--line-height-tight);
}

.subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.map-container {
  grid-area: map;
  position: relative;
  min-height: 200px;
  width: 100%;
  /* Ensure map is touchable on mobile */
  touch-action: manipulation;
  overflow: hidden;
  display: grid;
  place-items: center;
}

.map-legend {
  grid-area: legend;
  background: var(--color-surface);
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--color-border);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: var(--spacing-sm);
  justify-items: center;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  max-width: 100%;
}

.legend-item {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-areas: "color text";
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
  padding: var(--spacing-xs);
  border-radius: var(--radius-sm);
  transition: background-color var(--transition-base);
  min-width: 0;
  justify-self: stretch;
}

.legend-item:hover {
  background-color: var(--color-background-alt);
}

.legend-color {
  grid-area: color;
  width: 12px;
  height: 12px;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

/* Risk level colors with better contrast */
.risk-1 { background: var(--color-success); }
.risk-2 { background: #fdd835; border-color: #f9a825; }
.risk-3 { background: var(--color-warning); }
.risk-4 { background: var(--color-error); }
.risk-5 { background: #7b1fa2; }

/* Mobile-first responsive design */
@media (max-width: 480px) {
  .page-header {
    padding: var(--spacing-md) var(--spacing-lg);
  }
  
  .page-header h1 {
    font-size: var(--font-size-xl);
  }
  
  .subtitle {
    font-size: var(--font-size-xs);
  }
  
  .map-legend {
    padding: var(--spacing-sm) var(--spacing-md);
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-xs);
  }
  
  .legend-item {
    font-size: 10px;
    gap: 4px;
    justify-self: stretch;
  }
  
  .legend-color {
    width: 10px;
    height: 10px;
  }
}

/* Very small screens */
@media (max-width: 360px) {
  .page-header {
    padding: var(--spacing-md);
  }
  
  .legend-item {
    font-size: 9px;
  }
}

/* Landscape orientation optimizations */
@media (max-height: 500px) and (orientation: landscape) {
  .map-page {
    grid-template-rows: auto 1fr auto;
  }
  
  .page-header {
    padding: var(--spacing-sm) var(--spacing-lg);
  }
  
  .page-header h1 {
    font-size: var(--font-size-lg);
  }
  
  .subtitle {
    font-size: 11px;
  }
  
  .map-legend {
    padding: var(--spacing-xs) var(--spacing-md);
    grid-template-columns: repeat(5, 1fr);
  }
}

/* Tablet and desktop layouts */
@media (min-width: 768px) {
  .map-legend {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media (min-width: 1024px) {
  .map-page {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .map-legend {
    grid-template-columns: repeat(5, 1fr);
    justify-items: center;
  }
}
</style>