<template>
  <div class="settings-page">
    <div class="page-header">
      <h1>{{ t('settings.title') }}</h1>
      <p class="subtitle">{{ t('settings.subtitle') }}</p>
    </div>
    
    <div class="settings-content">
      <div class="settings-section">
        <h2>{{ t('settings.language.title') }}</h2>
        <div class="settings-section-content">
          <div class="setting-item">
            <label for="language-select">{{ t('settings.language.label') }}</label>
            <select 
              id="language-select"
              :value="settings.language"
              @change="onLanguageChange(($event.target as HTMLSelectElement).value)"
              class="setting-select"
            >
              <option v-for="locale in availableLocales" :key="locale.code" :value="locale.code">
                {{ locale.flag }} {{ locale.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h2>{{ t('settings.zone.title') }}</h2>
        <div class="settings-section-content">
          <div class="setting-item">
            <label for="zone-select">{{ t('settings.zone.label') }}</label>
            <select 
              id="zone-select"
              v-model="settings.favoriteZone"
              @change="saveSettings"
              class="setting-select"
            >
              <option value="">{{ t('settings.zone.none') }}</option>
              <option value="pirineo-aragones">{{ t('settings.zone.aragon') }}</option>
              <option value="pirineo-navarro">{{ t('settings.zone.navarre') }}</option>
              <option value="pirineo-catalan">{{ t('settings.zone.catalonia') }}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h2>{{ t('settings.updates.title') }}</h2>
        <div class="settings-section-content">
          <div class="setting-item">
            <div class="setting-toggle">
              <label for="auto-refresh">{{ t('settings.updates.auto') }}</label>
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
              {{ t('settings.updates.autoDescription') }}
            </p>
          </div>
          
          <div v-if="settings.autoRefresh" class="setting-item">
            <label for="refresh-interval">{{ t('settings.updates.interval') }}</label>
            <select 
              id="refresh-interval"
              v-model="settings.refreshInterval"
              @change="saveSettings"
              class="setting-select"
            >
              <option :value="15">{{ t('settings.updates.intervals.15') }}</option>
              <option :value="30">{{ t('settings.updates.intervals.30') }}</option>
              <option :value="60">{{ t('settings.updates.intervals.60') }}</option>
              <option :value="120">{{ t('settings.updates.intervals.120') }}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h2>{{ t('settings.data.title') }}</h2>
        <div class="settings-section-content">
          <div class="setting-item">
            <button @click="clearOfflineData" class="danger-button">
              {{ t('settings.data.clear') }}
            </button>
            <p class="setting-description">
              {{ t('settings.data.clearDescription') }}
            </p>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h2>{{ t('settings.info.title') }}</h2>
        <div class="settings-section-content">
          <div class="info-list">
            <div class="info-item">
              <span class="info-label">{{ t('settings.info.version') }}</span>
              <span class="info-value">1.0.0</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ t('settings.info.lastUpdate') }}</span>
              <span class="info-value">{{ lastUpdate }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ t('settings.info.connection') }}</span>
              <span class="info-value" :class="connectionClass">
                {{ isOnline() ? t('settings.info.online') : t('settings.info.offline') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSettings } from '../composables/useSettings'
import { useNetwork } from '../composables/useNetwork'
import { useLanguage } from '../composables/useLanguage'
import { offlineService } from '../services/offline.service'

const { settings, saveSettings, loadSettings } = useSettings()
const { isOnline } = useNetwork()
const { t, availableLocales, setLanguage } = useLanguage()

const lastUpdate = computed(() => {
  // TODO: Get real last update time from stored data
  return new Date().toLocaleString()
})

const connectionClass = computed(() => {
  return isOnline() ? 'status-online' : 'status-offline'
})

const clearOfflineData = async () => {
  if (confirm(t('settings.data.confirmClear'))) {
    try {
      await offlineService.clearAllData()
      alert(t('settings.data.cleared'))
    } catch (error) {
      console.error('Error clearing offline data:', error)
      alert(t('settings.data.clearError'))
    }
  }
}

const onLanguageChange = (languageCode: string) => {
  setLanguage(languageCode)
  settings.language = languageCode as 'es' | 'en' | 'fr' | 'ca' | 'eu'
  saveSettings()
}

// Load settings on mount
loadSettings()
</script>

<style scoped>
.settings-page {
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr;
  grid-template-columns: 1fr;
  grid-template-areas:
    "header"
    "content";
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--color-background-alt);
  /* Smooth scrolling on iOS */
  -webkit-overflow-scrolling: touch;
  width: 100%;
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

.settings-content {
  grid-area: content;
  padding: var(--spacing-lg);
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-lg);
  align-content: start;
}

.settings-section {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  width: 100%;
  box-sizing: border-box;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: var(--spacing-lg);
}

.settings-section h2 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: var(--spacing-sm);
}

.settings-section h2::before {
  content: '';
  width: 4px;
  height: 20px;
  background: var(--color-primary);
  border-radius: var(--radius-sm);
}

.settings-section-content {
  display: grid;
  gap: var(--spacing-xl);
}

.setting-item {
  width: 100%;
  display: grid;
  gap: var(--spacing-sm);
}

.setting-item label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  line-height: var(--line-height-base);
  margin: 0;
}

.setting-select {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: var(--color-surface);
  color: var(--color-text-primary);
  transition: all var(--transition-base);
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right var(--spacing-md) center;
  background-repeat: no-repeat;
  background-size: 16px;
  padding-right: 40px;
  min-height: 44px;
  box-sizing: border-box;
}

.setting-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

.setting-toggle {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas: "label toggle";
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) 0;
  min-height: 44px;
  width: 100%;
}

.setting-toggle label {
  grid-area: label;
}

.toggle-input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  width: 50px;
  height: 28px;
}

.toggle-slider {
  grid-area: toggle;
  width: 50px;
  height: 28px;
  background: var(--color-border);
  border-radius: 14px;
  position: relative;
  cursor: pointer;
  transition: all var(--transition-base);
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  background: var(--color-surface);
  border-radius: 50%;
  top: 4px;
  left: 4px;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
}

.toggle-input:checked + .toggle-slider {
  background: var(--color-primary);
}

.toggle-input:checked + .toggle-slider::before {
  transform: translateX(22px);
}

.toggle-input:focus + .toggle-slider {
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

.setting-description {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  line-height: var(--line-height-base);
  margin: 0;
}

.danger-button {
  background: var(--color-error);
  color: white;
  border: none;
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-base);
  min-height: 44px;
  touch-action: manipulation;
  justify-self: start;
}

.danger-button:hover:not(:disabled) {
  background: #d32f2f;
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.danger-button:active {
  transform: translateY(0);
}

.danger-button:focus-visible {
  outline: 2px solid var(--color-error);
  outline-offset: 2px;
}

.info-list {
  display: grid;
  gap: 0;
}

.info-item {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas: "label value";
  align-items: center;
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid var(--color-border-light);
  min-height: 48px;
  gap: var(--spacing-md);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  grid-area: label;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
  min-width: 0;
}

.info-value {
  grid-area: value;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  text-align: right;
}

.status-online {
  color: var(--color-success);
}

.status-offline {
  color: var(--color-error);
}

/* Responsive breakpoints */
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
  
  .settings-content {
    padding: var(--spacing-md);
  }
  
  .settings-section {
    padding: var(--spacing-lg);
  }
  
  .setting-toggle {
    grid-template-columns: 1fr;
    grid-template-areas: 
      "label"
      "toggle";
    justify-items: start;
    gap: var(--spacing-md);
  }
  
  .toggle-slider {
    justify-self: end;
  }
  
  .info-item {
    grid-template-columns: 1fr;
    grid-template-areas: 
      "label"
      "value";
    gap: var(--spacing-xs);
    align-items: start;
  }
  
  .info-value {
    text-align: left;
    justify-self: start;
  }
}

@media (max-width: 360px) {
  .settings-content {
    padding: var(--spacing-sm);
  }
  
  .settings-section {
    padding: var(--spacing-md);
  }
  
  .settings-section h2 {
    font-size: var(--font-size-base);
  }
}

/* Landscape orientation */
@media (max-height: 500px) and (orientation: landscape) {
  .page-header {
    padding: var(--spacing-sm) var(--spacing-lg);
  }
  
  .page-header h1 {
    font-size: var(--font-size-lg);
  }
  
  .subtitle {
    font-size: 11px;
  }
  
  .settings-section {
    padding: var(--spacing-lg);
  }
  
  .settings-content {
    gap: var(--spacing-md);
  }
}
</style>