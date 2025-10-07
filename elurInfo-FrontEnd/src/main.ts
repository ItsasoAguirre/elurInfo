import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { serviceWorkerService } from './services/serviceWorker.service'

const app = createApp(App)
app.use(router)
app.mount('#app')

// Register Service Worker
if (import.meta.env.PROD) {
  serviceWorkerService.register().then((registered) => {
    if (registered) {
      console.log('PWA features enabled')
      
      // Request persistent storage for better offline experience
      serviceWorkerService.requestPersistentStorage()
    }
  })
}
