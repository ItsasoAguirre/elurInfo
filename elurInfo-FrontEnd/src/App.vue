<script setup lang="ts">
import TabLayout from './components/TabLayout.vue'
import { useNetwork } from './composables/useNetwork'

const { connectionStatus } = useNetwork()
</script>

<template>
  <div id="app">
    <!-- Offline indicator -->
    <div v-if="!connectionStatus.isOnline" class="offline-indicator">
      📶 Modo offline - Mostrando datos guardados
    </div>
    
    <TabLayout />
  </div>
</template>

<style>
#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.offline-indicator {
  background: #ff9800;
  color: white;
  padding: 8px 16px;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  z-index: 1000;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
