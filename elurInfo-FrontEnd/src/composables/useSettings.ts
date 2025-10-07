import { ref, reactive } from 'vue'
import type { AppSettings } from '../types'
import { offlineService } from '../services/offline.service'

export function useSettings() {
  const settings = reactive<AppSettings>({
    language: 'es',
    favoriteZone: '',
    autoRefresh: true,
    refreshInterval: 60
  })

  const loading = ref(false)

  const loadSettings = async () => {
    loading.value = true
    try {
      const savedSettings = await offlineService.getSettings()
      if (savedSettings) {
        Object.assign(settings, savedSettings)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      loading.value = false
    }
  }

  const saveSettings = async () => {
    try {
      await offlineService.saveSettings(settings)
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  const resetSettings = async () => {
    Object.assign(settings, {
      language: 'es',
      favoriteZone: '',
      autoRefresh: true,
      refreshInterval: 60
    })
    await saveSettings()
  }

  return {
    settings,
    loading,
    loadSettings,
    saveSettings,
    resetSettings
  }
}