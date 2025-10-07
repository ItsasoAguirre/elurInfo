import { ref } from 'vue'
import type { MountainForecast } from '../types'
import { apiService } from '../services/api.service'
import { offlineService } from '../services/offline.service'

export function useMountainForecasts() {
  const forecasts = ref<MountainForecast[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selectedForecast = ref<MountainForecast | null>(null)

  const loadForecasts = async () => {
    loading.value = true
    error.value = null

    try {
      // Try to load from API first
      const data = await apiService.getMountainForecasts()
      forecasts.value = data
      
      // Save to offline storage
      await offlineService.saveMountainForecasts(data)
    } catch (err) {
      console.error('Error loading mountain forecasts:', err)
      
      // Try to load from offline storage
      try {
        const offlineData = await offlineService.getMountainForecasts()
        if (offlineData && offlineData.data) {
          forecasts.value = offlineData.data
          error.value = 'Mostrando datos offline del ' + new Date(offlineData.timestamp).toLocaleDateString()
        } else {
          error.value = 'No hay datos disponibles'
        }
      } catch (offlineErr) {
        error.value = 'Error al cargar datos'
        console.error('Error loading offline data:', offlineErr)
      }
    } finally {
      loading.value = false
    }
  }

  const selectForecast = (forecast: MountainForecast) => {
    selectedForecast.value = forecast
    // TODO: Navigate to detail view or show modal
    console.log('Selected forecast:', forecast)
  }

  const refreshForecasts = async () => {
    await loadForecasts()
  }

  return {
    forecasts,
    loading,
    error,
    selectedForecast,
    loadForecasts,
    selectForecast,
    refreshForecasts
  }
}