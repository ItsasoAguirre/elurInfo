<script setup lang="ts">
import TabLayout from './components/TabLayout.vue'
import { useNetwork } from './composables/useNetwork'
import { useLanguage } from './composables/useLanguage'

const { connectionStatus } = useNetwork()
const { t } = useLanguage()
</script>

<template>
  <div id="app" :class="{ 'has-offline-indicator': !connectionStatus.isOnline }">
    <!-- Offline indicator -->
    <div v-if="!connectionStatus.isOnline" class="offline-indicator">
      {{ t('app.offline') }}
    </div>

    <TabLayout />
  </div>
</template>

<style>
#app {
  height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr;
  grid-template-columns: 1fr;
  grid-template-areas:
    "offline"
    "content";
  background-color: var(--color-background-alt);
  font-family: var(--font-family-base);
  overflow: hidden; /* Prevent app-level scroll */
  width: 100%;
  max-width: 100vw; /* Prevent horizontal overflow */
}

/* When offline indicator is not shown */
#app:not(.has-offline-indicator) {
  grid-template-rows: 1fr;
  grid-template-areas: "content";
}

.offline-indicator {
  grid-area: offline;
  background: var(--color-warning);
  color: white;
  padding: var(--spacing-sm) var(--spacing-lg);
  text-align: center;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  z-index: var(--z-sticky);
  width: 100%;
  box-sizing: border-box;
  display: grid;
  place-items: center;
}

/* TabLayout takes the content area */
.tab-layout {
  grid-area: content;
}
</style>
