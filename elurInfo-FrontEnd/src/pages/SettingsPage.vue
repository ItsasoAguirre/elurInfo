<template>
  <div class="settings-page">
    <div class="page-header">
      <h1>Ajustes</h1>
      <p class="subtitle">Configuración de la aplicación</p>
    </div>
    
    <div class="settings-content">
      <div class="settings-section">
        <h2>Idioma</h2>
        <div class="setting-item">
          <label for="language-select">Idioma de la aplicación</label>
          <select 
            id="language-select"
            v-model="settings.language"
            @change="saveSettings"
            class="setting-select"
          >
            <option value="es">Español</option>
            <option value="ca">Català</option>
            <option value="eu">Euskera</option>
          </select>
        </div>
      </div>

      <div class="settings-section">
        <h2>Zona Favorita</h2>
        <div class="setting-item">
          <label for="zone-select">Zona predeterminada</label>
          <select 
            id="zone-select"
            v-model="settings.favoriteZone"
            @change="saveSettings"
            class="setting-select"
          >
            <option value="">Ninguna</option>
            <option value="pirineo-aragones">Pirineo Aragonés</option>
            <option value="pirineo-navarro">Pirineo Navarro</option>
            <option value="pirineo-catalan">Pirineo Catalán</option>
          </select>
        </div>
      </div>

      <div class="settings-section">
        <h2>Actualización</h2>
        <div class="setting-item">
          <div class="setting-toggle">
            <label for="auto-refresh">Actualización automática</label>
            <input 
              id="auto-refresh"
              type="checkbox" 
              v-model="settings.autoRefresh"
              @change="saveSettings"
              class="toggle-input"
            />
            <span class="toggle-slider"></span>
          </div>
          <p class="setting-description">
            Actualizar datos automáticamente cuando esté disponible
          </p>
        </div>
        
        <div v-if="settings.autoRefresh" class="setting-item">
          <label for="refresh-interval">Intervalo de actualización</label>
          <select 
            id="refresh-interval"
            v-model="settings.refreshInterval"
            @change="saveSettings"
            class="setting-select"
          >
            <option :value="15">15 minutos</option>
            <option :value="30">30 minutos</option>
            <option :value="60">1 hora</option>
            <option :value="120">2 horas</option>
          </select>
        </div>
      </div>

      <div class="settings-section">
        <h2>Datos</h2>
        <div class="setting-item">
          <button @click="clearOfflineData" class="danger-button">
            Limpiar datos offline
          </button>
          <p class="setting-description">
            Elimina todos los datos guardados localmente
          </p>
        </div>
      </div>

      <div class="settings-section">
        <h2>Información</h2>
        <div class="info-item">
          <span class="info-label">Versión:</span>
          <span class="info-value">1.0.0</span>
        </div>
        <div class="info-item">
          <span class="info-label">Última actualización:</span>
          <span class="info-value">{{ lastUpdate }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Estado de conexión:</span>
          <span class="info-value" :class="connectionClass">
            {{ connectionStatus }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSettings } from '../composables/useSettings'
import { useNetwork } from '../composables/useNetwork'
import { offlineService } from '../services/offline.service'

const { settings, saveSettings, loadSettings } = useSettings()
const { connectionStatus, isOnline } = useNetwork()

const lastUpdate = computed(() => {
  // TODO: Get real last update time from stored data
  return new Date().toLocaleString('es-ES')
})

const connectionClass = computed(() => {
  return isOnline() ? 'status-online' : 'status-offline'
})

const connectionStatusText = computed(() => {
  return isOnline() ? 'En línea' : 'Sin conexión'
})

const clearOfflineData = async () => {
  if (confirm('¿Estás seguro de que quieres eliminar todos los datos offline?')) {
    try {
      await offlineService.clearAllData()
      alert('Datos offline eliminados correctamente')
    } catch (error) {
      console.error('Error clearing offline data:', error)
      alert('Error al eliminar los datos offline')
    }
  }
}

// Load settings on mount
loadSettings()
</script>

<style scoped>
.settings-page {
  height: 100%;
  overflow-y: auto;
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

.settings-content {
  padding: 16px;
}

.settings-section {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid #e0e0e0;
}

.settings-section h2 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.setting-item {
  margin-bottom: 16px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-item label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.setting-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.setting-select:focus {
  outline: none;
  border-color: #2196f3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

.setting-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}

.toggle-input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.toggle-slider {
  width: 50px;
  height: 28px;
  background: #ccc;
  border-radius: 14px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  top: 4px;
  left: 4px;
  transition: all 0.2s;
}

.toggle-input:checked + .toggle-slider {
  background: #2196f3;
}

.toggle-input:checked + .toggle-slider::before {
  transform: translateX(22px);
}

.setting-description {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
  line-height: 1.4;
}

.danger-button {
  background: #f44336;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.danger-button:hover {
  background: #d32f2f;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 14px;
  color: #666;
}

.info-value {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.status-online {
  color: #4caf50;
}

.status-offline {
  color: #f44336;
}

@media (max-width: 480px) {
  .page-header {
    padding: 12px;
  }
  
  .page-header h1 {
    font-size: 20px;
  }
  
  .settings-content {
    padding: 12px;
  }
  
  .settings-section {
    padding: 12px;
  }
}
</style>