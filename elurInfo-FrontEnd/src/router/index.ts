import { createRouter, createWebHistory } from 'vue-router'
import MapPage from '@/pages/MapPage.vue'
import StationsPage from '@/pages/StationsPage.vue'
import SettingsPage from '@/pages/SettingsPage.vue'

const routes = [
  {
    path: '/',
    redirect: '/mapa'
  },
  {
    path: '/mapa',
    name: 'Mapa',
    component: MapPage
  },
  {
    path: '/estaciones',
    name: 'Estaciones',
    component: StationsPage
  },
  {
    path: '/ajustes',
    name: 'Ajustes',
    component: SettingsPage
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router