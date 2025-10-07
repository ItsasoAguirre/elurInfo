<template>
  <div class="tab-layout">
    <!-- Main content area -->
    <main class="main-content">
      <router-view />
    </main>
    
    <!-- Bottom tab navigation -->
    <nav class="tab-navigation">
      <router-link
        v-for="tab in tabs"
        :key="tab.id"
        :to="tab.path"
        class="tab-item"
        :class="{ active: route.path === tab.path }"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.name }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import type { TabItem } from '../types'

const route = useRoute()

const tabs: TabItem[] = [
  {
    id: 'mapa',
    name: 'Mapa',
    path: '/mapa',
    icon: '🗺️'
  },
  {
    id: 'estaciones',
    name: 'Estaciones',
    path: '/estaciones',
    icon: '🏔️'
  },
  {
    id: 'ajustes',
    name: 'Ajustes',
    path: '/ajustes',
    icon: '⚙️'
  }
]
</script>

<style scoped>
.tab-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  background: #f5f5f5;
}

.tab-navigation {
  display: flex;
  background: white;
  border-top: 1px solid #e0e0e0;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  safe-area-inset-bottom: env(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px 12px 4px;
  text-decoration: none;
  color: #666;
  transition: all 0.2s ease;
  min-height: 56px;
}

.tab-item:hover {
  background: #f5f5f5;
}

.tab-item.active {
  color: #2196f3;
  background: #f0f8ff;
}

.tab-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.tab-label {
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  line-height: 1;
}

/* Mobile optimizations */
@media (max-width: 480px) {
  .tab-label {
    font-size: 10px;
  }
  
  .tab-icon {
    font-size: 18px;
  }
}
</style>