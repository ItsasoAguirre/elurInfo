import { ref, onMounted, onUnmounted } from 'vue'
import type { ConnectionStatus } from '../types'

export function useNetwork() {
  const connectionStatus = ref<ConnectionStatus>({
    isOnline: navigator.onLine,
    lastOnline: navigator.onLine ? new Date() : undefined
  })

  const updateConnectionStatus = () => {
    const wasOnline = connectionStatus.value.isOnline
    connectionStatus.value.isOnline = navigator.onLine
    
    if (navigator.onLine && !wasOnline) {
      connectionStatus.value.lastOnline = new Date()
    }
  }

  onMounted(() => {
    // Listen for network changes
    window.addEventListener('online', updateConnectionStatus)
    window.addEventListener('offline', updateConnectionStatus)
  })

  onUnmounted(() => {
    window.removeEventListener('online', updateConnectionStatus)
    window.removeEventListener('offline', updateConnectionStatus)
  })

  return {
    connectionStatus: connectionStatus.value,
    isOnline: () => connectionStatus.value.isOnline,
    lastOnline: () => connectionStatus.value.lastOnline
  }
}