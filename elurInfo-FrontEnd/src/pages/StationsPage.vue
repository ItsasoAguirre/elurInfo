<template>
  <div class="stations-page">
    <div class="page-header">
      <h1>{{ t('snowScience.title') }}</h1>
      <p class="subtitle">{{ t('snowScience.subtitle') }}</p>
    </div>
    
    <div class="stations-content">
      <!-- Loading state -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>{{ t('snowScience.loading') }}</p>
      </div>
      
      <!-- Error state -->
      <div v-else-if="error" class="error-state">
        <span class="error-icon">⚠️</span>
        <p>{{ error }}</p>
        <button @click="loadReports" class="retry-button">
          {{ t('snowScience.retry') }}
        </button>
      </div>
      
      <!-- Reports list -->
      <div v-else class="reports-list">
        <div
          v-for="report in reports"
          :key="report.id"
          class="report-card"
          @click="selectReport(report)"
        >
          <div class="report-header">
            <h3>{{ getAreaName(report.areaCode) }}</h3>
            <div class="report-meta">
              <span class="area-code">{{ report.areaCode === 0 ? 'PCT' : 'PNA' }}</span>
              <span 
                class="freshness-indicator" 
                :class="{ fresh: isDataFresh(report), stale: !isDataFresh(report) }"
              >
                {{ isDataFresh(report) ? '🟢' : '🟡' }}
              </span>
            </div>
          </div>
          
          <div class="report-dates">
            <div class="date-item">
              <span class="date-label">{{ t('snowScience.elaborated') }}</span>
              <span class="date-value">{{ formatDate(report.fechaElaboracion) }}</span>
            </div>
            <div class="date-item">
              <span class="date-label">{{ t('snowScience.valid') }}</span>
              <span class="date-value">{{ formatDate(report.fechaValidez) }}</span>
            </div>
          </div>
          
          <div class="report-preview">
            {{ getPreviewText(report) }}
          </div>
          
          <div class="report-footer">
            <span class="update-time">
              {{ t('snowScience.updated') }} {{ formatTime(report.fechaActualizacion) }}
            </span>
            <button 
              @click.stop="refreshArea(report.areaCode)" 
              class="mini-refresh-btn"
              :disabled="loading"
            >
              🔄
            </button>
          </div>
        </div>
      </div>
      
      <!-- Empty state -->
      <div v-if="!loading && !error && reports.length === 0" class="empty-state">
        <span class="empty-icon">❄️</span>
        <p>{{ t('snowScience.empty') }}</p>
      </div>
    </div>
    
    <!-- Floating refresh button -->
    <button 
      @click="refreshAllData" 
      class="refresh-button"
      :disabled="loading"
    >
      <span class="refresh-icon" :class="{ spinning: loading }">🔄</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useSnowScienceData } from '../composables/useSnowScienceData'
import { useLanguage } from '../composables/useLanguage'

const { 
  reports, 
  loading, 
  error, 
  loadReports,
  refreshData,
  selectReport,
  getAreaName,
  getFormattedData,
  isDataFresh
} = useSnowScienceData()

const { t, currentLanguage } = useLanguage()

onMounted(() => {
  loadReports()
})

const refreshAllData = async () => {
  await refreshData()
}

const refreshArea = async (areaCode: number) => {
  await refreshData(areaCode)
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const locale = currentLanguage.value === 'ca' ? 'ca-ES' : 
                currentLanguage.value === 'eu' ? 'eu-ES' :
                currentLanguage.value === 'en' ? 'en-GB' :
                currentLanguage.value === 'fr' ? 'fr-FR' : 'es-ES'
  
  return date.toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
}

const formatTime = (dateString: string): string => {
  const date = new Date(dateString)
  const locale = currentLanguage.value === 'ca' ? 'ca-ES' : 
                currentLanguage.value === 'eu' ? 'eu-ES' :
                currentLanguage.value === 'en' ? 'en-GB' :
                currentLanguage.value === 'fr' ? 'fr-FR' : 'es-ES'
  
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getPreviewText = (report: any): string => {
  const formattedData = getFormattedData(report)
  
  if (typeof formattedData === 'object') {
    return formattedData.resumen || 
           formattedData.descripcion || 
           formattedData.condiciones ||
           t('snowScience.dataAvailable')
  }
  
  return String(formattedData).substring(0, 150) + '...'
}
</script>

<style scoped>
.stations-page {
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr;
  grid-template-columns: 1fr;
  grid-template-areas:
    "header"
    "content";
  position: relative;
  background: var(--color-background-alt);
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

.stations-content {
  grid-area: content;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--spacing-lg);
  /* Smooth scrolling on iOS */
  -webkit-overflow-scrolling: touch;
  /* Prevent bounce scrolling */
  overscroll-behavior-y: contain;
  width: 100%;
  box-sizing: border-box;
}

.loading-state,
.error-state,
.empty-state {
  display: grid;
  place-items: center;
  grid-template-rows: auto auto auto;
  grid-template-areas:
    "icon"
    "text"
    "action";
  gap: var(--spacing-lg);
  min-height: 200px;
  text-align: center;
  color: var(--color-text-secondary);
  padding: var(--spacing-xl);
  width: 100%;
  box-sizing: border-box;
}

.spinner {
  grid-area: icon;
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border-light);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  justify-self: center;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon,
.empty-icon {
  grid-area: icon;
  font-size: 48px;
  opacity: 0.7;
  justify-self: center;
}

.loading-state p,
.error-state p,
.empty-state p {
  grid-area: text;
  margin: 0;
}

.retry-button {
  grid-area: action;
  padding: var(--spacing-sm) var(--spacing-xl);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-base);
  touch-action: manipulation;
  min-height: 44px;
  justify-self: center;
}

.retry-button:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.retry-button:active {
  transform: translateY(0);
}

.reports-list {
  display: grid;
  gap: var(--spacing-lg);
  /* Responsive grid */
  grid-template-columns: 1fr;
  width: 100%;
  max-width: 100%;
}

.report-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
  display: grid;
  grid-template-rows: auto auto auto auto;
  grid-template-areas:
    "header"
    "dates"
    "preview"
    "footer";
  gap: var(--spacing-sm);
}

.report-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--color-primary);
  transform: scaleY(0);
  transition: transform var(--transition-base);
  transform-origin: bottom;
}

.report-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
  border-color: var(--color-primary-light);
}

.report-card:hover::before {
  transform: scaleY(1);
}

.report-card:active {
  transform: translateY(0);
}

.report-header {
  grid-area: header;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas: "title meta";
  align-items: start;
  gap: var(--spacing-md);
  width: 100%;
}

.report-header h3 {
  grid-area: title;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
  line-height: var(--line-height-tight);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.report-meta {
  grid-area: meta;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.area-code {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  background: var(--color-background-alt);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  white-space: nowrap;
  font-weight: var(--font-weight-medium);
}

.freshness-indicator {
  font-size: 12px;
}

.freshness-indicator.fresh {
  opacity: 1;
}

.freshness-indicator.stale {
  opacity: 0.7;
}

.report-dates {
  grid-area: dates;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
  width: 100%;
}

.date-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.date-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

.date-value {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.report-preview {
  grid-area: preview;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-base);
  display: -webkit-box;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.report-footer {
  grid-area: footer;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
}

.update-time {
  font-size: var(--font-size-xs);
  color: var(--color-text-disabled);
}

.update-time::before {
  content: '🕒';
  margin-right: var(--spacing-xs);
}

.mini-refresh-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: var(--color-background-alt);
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all var(--transition-base);
  opacity: 0.7;
}

.mini-refresh-btn:hover:not(:disabled) {
  background: var(--color-primary-light);
  opacity: 1;
}

.mini-refresh-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.refresh-button {
  position: fixed;
  bottom: calc(80px + env(safe-area-inset-bottom));
  right: var(--spacing-lg);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  border: none;
  box-shadow: var(--shadow-xl);
  cursor: pointer;
  display: grid;
  place-items: center;
  font-size: 20px;
  transition: all var(--transition-base);
  z-index: var(--z-fixed);
  touch-action: manipulation;
}

.refresh-button:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: scale(1.05);
  box-shadow: 0 8px 25px rgba(33, 150, 243, 0.4);
}

.refresh-button:active {
  transform: scale(0.95);
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

/* Responsive breakpoints */
@media (min-width: 768px) {
  .reports-list {
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  }
  
  .stations-content {
    padding: var(--spacing-xl);
  }
}

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
  
  .stations-content {
    padding: var(--spacing-md);
  }
  
  .report-card {
    padding: var(--spacing-md);
  }
  
  .report-header {
    grid-template-columns: 1fr;
    grid-template-areas: 
      "title"
      "meta";
    gap: var(--spacing-sm);
  }
  
  .refresh-button {
    bottom: calc(70px + env(safe-area-inset-bottom));
    width: 48px;
    height: 48px;
    font-size: 18px;
  }
}

@media (max-width: 360px) {
  .stations-content {
    padding: var(--spacing-sm);
  }
  
  .report-card {
    padding: var(--spacing-sm);
  }
  
  .report-header h3 {
    font-size: var(--font-size-base);
  }
  
  .refresh-button {
    right: var(--spacing-md);
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
  
  .loading-state,
  .error-state,
  .empty-state {
    min-height: 150px;
    padding: var(--spacing-lg);
  }
}
</style>