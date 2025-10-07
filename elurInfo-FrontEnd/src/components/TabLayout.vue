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
import { computed } from 'vue'
import { useLanguage } from '../composables/useLanguage'
import type { TabItem } from '../types'

const route = useRoute()
const { t } = useLanguage()

const tabs = computed<TabItem[]>(() => [
  {
    id: 'mapa',
    name: t('navigation.map'),
    path: '/mapa',
    icon: '🗺️'
  },
  {
    id: 'estaciones',
    name: t('navigation.stations'),
    path: '/estaciones',
    icon: '🏔️'
  },
  {
    id: 'ajustes',
    name: t('navigation.settings'),
    path: '/ajustes',
    icon: '⚙️'
  }
])
</script>

<style scoped>
.tab-layout {
  height: 100%;
  display: grid;
  grid-template-rows: 1fr auto;
  grid-template-columns: 1fr;
  grid-template-areas:
    "main"
    "navigation";
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.main-content {
  grid-area: main;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--color-background-alt);
  /* Add scroll momentum for iOS */
  -webkit-overflow-scrolling: touch;
  /* Prevent pull-to-refresh on mobile */
  overscroll-behavior-y: contain;
  width: 100%;
  max-width: 100%;
}

.tab-navigation {
  grid-area: navigation;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-sticky);
  /* Safe area support for devices with home indicator */
  padding-bottom: env(safe-area-inset-bottom);
  /* Prevent layout shift on orientation change */
  min-height: calc(56px + env(safe-area-inset-bottom));
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.tab-item {
  display: grid;
  grid-template-rows: auto auto;
  grid-template-areas:
    "icon"
    "label";
  place-items: center;
  padding: var(--spacing-sm) var(--spacing-xs);
  text-decoration: none;
  color: var(--color-text-secondary);
  transition: all var(--transition-base);
  min-height: 56px;
  position: relative;
  /* Improve tap target size for accessibility */
  min-width: 44px;
  touch-action: manipulation;
  box-sizing: border-box;
}

.tab-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-primary);
  transform: scaleX(0);
  transition: transform var(--transition-base);
}

.tab-item:hover:not(.active) {
  background: var(--color-background-alt);
  color: var(--color-text-primary);
}

.tab-item.active {
  color: var(--color-primary);
  background: rgba(33, 150, 243, 0.05);
}

.tab-item.active::before {
  transform: scaleX(1);
}

.tab-icon {
  grid-area: icon;
  font-size: 20px;
  line-height: 1;
  /* Ensure consistent icon alignment */
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
}

.tab-label {
  grid-area: label;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  text-align: center;
  line-height: var(--line-height-tight);
  /* Prevent text wrapping */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  margin-top: var(--spacing-xs);
}

/* Responsive breakpoints */
@media (max-width: 480px) {
  .tab-navigation {
    min-height: calc(60px + env(safe-area-inset-bottom));
  }

  .tab-item {
    padding: var(--spacing-sm) 2px;
    min-height: 60px;
  }

  .tab-label {
    font-size: 10px;
  }

  .tab-icon {
    font-size: 18px;
    width: 20px;
    height: 20px;
  }
}

@media (max-width: 360px) {
  .tab-label {
    font-size: 9px;
  }

  .tab-icon {
    font-size: 16px;
  }
}

/* Landscape orientation on mobile */
@media (max-height: 500px) and (orientation: landscape) {
  .tab-navigation {
    min-height: calc(48px + env(safe-area-inset-bottom));
  }

  .tab-item {
    min-height: 48px;
    padding: var(--spacing-xs) var(--spacing-xs);
    grid-template-rows: 1fr auto;
  }

  .tab-icon {
    font-size: 16px;
  }

  .tab-label {
    font-size: 9px;
    margin-top: 2px;
  }
}

/* Alternative layouts for different screen sizes */
@media (min-width: 768px) {
  /* Tablet layout - could use side navigation if needed */
  .tab-layout {
    grid-template-areas:
      "main"
      "navigation";
  }
}

@media (min-width: 1024px) {
  /* Desktop layout - could use sidebar navigation */
  .tab-layout {
    grid-template-rows: 1fr auto;
    grid-template-areas:
      "main"
      "navigation";
  }
}

/* High DPI displays */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .tab-navigation {
    border-top-width: 0.5px;
  }
}

/* Focus styles for accessibility */
.tab-item:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
  z-index: 1;
}

/* Dark mode support (if needed in the future) */
@media (prefers-color-scheme: dark) {
  .tab-navigation {
    background: #1e1e1e;
    border-top-color: #333;
  }

  .tab-item {
    color: #ccc;
  }

  .tab-item:hover:not(.active) {
    background: #333;
    color: #fff;
  }

  .tab-item.active {
    color: var(--color-primary);
    background: rgba(33, 150, 243, 0.1);
  }
}

/* Reduce motion for users who prefer it */
@media (prefers-reduced-motion: reduce) {
  .tab-item,
  .tab-item::before {
    transition: none;
  }
}
</style>