class ServiceWorkerService {
  private registration: ServiceWorkerRegistration | null = null

  async register(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported')
      return false
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      console.log('Service Worker registered successfully')

      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing
        if (newWorker) {
          console.log('New Service Worker found, installing...')
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New Service Worker installed, prompting for update')
              this.showUpdatePrompt()
            }
          })
        }
      })

      // Check for existing updates
      if (this.registration.waiting) {
        this.showUpdatePrompt()
      }

      return true
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      return false
    }
  }

  private showUpdatePrompt(): void {
    if (confirm('Hay una nueva versión disponible. ¿Quieres actualizarla?')) {
      this.skipWaiting()
    }
  }

  private skipWaiting(): void {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      
      // Reload the page after the new SW takes control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
    }
  }

  async unregister(): Promise<boolean> {
    if (this.registration) {
      const result = await this.registration.unregister()
      console.log('Service Worker unregistered:', result)
      return result
    }
    return false
  }

  // Check if the app is running in standalone mode (installed as PWA)
  isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           ('standalone' in navigator) ||
           document.referrer.includes('android-app://')
  }

  // Request persistent storage
  async requestPersistentStorage(): Promise<boolean> {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const granted = await navigator.storage.persist()
        console.log('Persistent storage granted:', granted)
        return granted
      } catch (error) {
        console.error('Error requesting persistent storage:', error)
        return false
      }
    }
    return false
  }

  // Estimate storage usage
  async getStorageEstimate(): Promise<StorageEstimate | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate()
        console.log('Storage estimate:', estimate)
        return estimate
      } catch (error) {
        console.error('Error getting storage estimate:', error)
        return null
      }
    }
    return null
  }
}

export const serviceWorkerService = new ServiceWorkerService()