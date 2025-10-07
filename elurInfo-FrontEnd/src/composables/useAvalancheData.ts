import { ref } from 'vue'
import type { AvalancheReport } from '../types'
import { apiService } from '../services/api.service'
import { offlineService } from '../services/offline.service'

export function useAvalancheData() {
  const reports = ref<AvalancheReport[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdate = ref<Date | null>(null)

  const loadAvalancheReports = async () => {
    loading.value = true
    error.value = null

    try {
      // Try to load from API first
      const data = await apiService.getAvalancheReports()
      reports.value = data
      lastUpdate.value = new Date()
      
      // Save to offline storage
      await offlineService.saveAvalancheReports(data)
    } catch (err) {
      console.error('Error loading avalanche reports:', err)
      
      // Try to load from offline storage
      try {
        const offlineData = await offlineService.getAvalancheReports()
        if (offlineData && offlineData.data) {
          reports.value = offlineData.data
          lastUpdate.value = new Date(offlineData.timestamp)
          error.value = 'Mostrando datos offline del ' + new Date(offlineData.timestamp).toLocaleDateString()
        } else {
          error.value = 'No hay datos de avalanchas disponibles'
        }
      } catch (offlineErr) {
        error.value = 'Error al cargar datos'
        console.error('Error loading offline avalanche data:', offlineErr)
      }
    } finally {
      loading.value = false
    }
  }

  const getReportByZone = (zone: string): AvalancheReport | undefined => {
    return reports.value.find(report => report.zone === zone)
  }

  const isDataValid = (): boolean => {
    if (!lastUpdate.value) return false
    
    const now = new Date()
    const diffHours = (now.getTime() - lastUpdate.value.getTime()) / (1000 * 60 * 60)
    
    // Avalanche bulletins are valid for 24 hours
    return diffHours < 24
  }

  const needsUpdate = (): boolean => {
    return !isDataValid() || reports.value.length === 0
  }

  return {
    reports,
    loading,
    error,
    lastUpdate,
    loadAvalancheReports,
    getReportByZone,
    isDataValid,
    needsUpdate
  }
}