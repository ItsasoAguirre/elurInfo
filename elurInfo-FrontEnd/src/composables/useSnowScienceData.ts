import { ref, computed } from 'vue'
import type { SnowScienceReport } from '../types'
import { apiService } from '../services/api.service'
import { offlineService } from '../services/offline.service'
import { useLanguage } from './useLanguage'

export function useSnowScienceData() {
  const reports = ref<SnowScienceReport[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selectedReport = ref<SnowScienceReport | null>(null)
  const { t } = useLanguage()

  // Computed properties for better UI display
  const catalanPyrenees = computed(() => 
    reports.value.find(report => report.areaCode === 0)
  )

  const navarreAragonesePyrenees = computed(() => 
    reports.value.find(report => report.areaCode === 1)
  )

  const hasData = computed(() => reports.value.length > 0)
  const lastUpdate = computed(() => {
    if (reports.value.length === 0) return null
    const dates = reports.value.map(r => new Date(r.fechaActualizacion))
    return new Date(Math.max(...dates.map(d => d.getTime())))
  })

  const loadReports = async () => {
    loading.value = true
    error.value = null

    try {
      // Try to load from API first
      const data = await apiService.getSnowScienceReports()
      reports.value = data
      
      // Save to offline storage
      await offlineService.saveSnowScienceReports(data)
    } catch (err) {
      console.error('Error loading snow science reports:', err)
      
      // Try to load from offline storage
      try {
        const offlineData = await offlineService.getSnowScienceReports()
        if (offlineData && offlineData.data) {
          reports.value = offlineData.data
          error.value = t('common.offline') + ' ' + new Date(offlineData.timestamp).toLocaleDateString()
        } else {
          error.value = t('common.noData')
        }
      } catch (offlineErr) {
        error.value = t('common.errorLoading')
        console.error('Error loading offline data:', offlineErr)
      }
    } finally {
      loading.value = false
    }
  }

  const loadReportByArea = async (areaCode: number) => {
    loading.value = true
    error.value = null

    try {
      const data = await apiService.getSnowScienceReportByArea(areaCode)
      
      // Update the specific report in the array
      const index = reports.value.findIndex(r => r.areaCode === areaCode)
      if (index >= 0) {
        reports.value[index] = data
      } else {
        reports.value.push(data)
      }
      
      // Save updated data to offline storage
      await offlineService.saveSnowScienceReports(reports.value)
    } catch (err) {
      console.error('Error loading snow science report for area:', areaCode, err)
      error.value = t('common.errorLoading')
    } finally {
      loading.value = false
    }
  }

  const refreshData = async (areaCode?: number) => {
    loading.value = true
    error.value = null

    try {
      const refreshedData = await apiService.refreshSnowScienceData(areaCode)
      
      if (areaCode !== undefined) {
        // Update specific area
        const index = reports.value.findIndex(r => r.areaCode === areaCode)
        const newReport = refreshedData.find(r => r.areaCode === areaCode)
        if (newReport) {
          if (index >= 0) {
            reports.value[index] = newReport
          } else {
            reports.value.push(newReport)
          }
        }
      } else {
        // Update all areas
        reports.value = refreshedData
      }
      
      // Save to offline storage
      await offlineService.saveSnowScienceReports(reports.value)
    } catch (err) {
      console.error('Error refreshing snow science data:', err)
      error.value = t('common.errorRefreshing')
    } finally {
      loading.value = false
    }
  }

  const selectReport = (report: SnowScienceReport) => {
    selectedReport.value = report
    console.log('Selected snow science report:', report)
  }

  const getAreaName = (areaCode: number): string => {
    switch (areaCode) {
      case 0:
        return t('areas.catalanPyrenees')
      case 1:
        return t('areas.navarreAragonesePyrenees')
      default:
        return t('areas.unknown')
    }
  }

  const getFormattedData = (report: SnowScienceReport) => {
    try {
      const data = JSON.parse(report.datosCompletos)
      return data
    } catch {
      return {
        resumen: t('snowScience.dataAvailable'),
        descripcion: report.datosCompletos || t('snowScience.noDescription')
      }
    }
  }

  const isDataFresh = (report: SnowScienceReport, maxHours: number = 12): boolean => {
    const updateTime = new Date(report.fechaActualizacion)
    const now = new Date()
    const diffHours = (now.getTime() - updateTime.getTime()) / (1000 * 60 * 60)
    return diffHours < maxHours
  }

  return {
    // State
    reports,
    loading,
    error,
    selectedReport,
    
    // Computed
    catalanPyrenees,
    navarreAragonesePyrenees,
    hasData,
    lastUpdate,
    
    // Methods
    loadReports,
    loadReportByArea,
    refreshData,
    selectReport,
    getAreaName,
    getFormattedData,
    isDataFresh
  }
}