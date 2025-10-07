import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import './style.css'
import App from './App.vue'
import router from './router'
import { serviceWorkerService } from './services/serviceWorker.service'
import { messages } from './locales'

// Get saved language from localStorage or default to browser language
const savedLanguage = localStorage.getItem('elurinfo-language')
const browserLanguage = navigator.language.split('-')[0] || 'es'
const defaultLanguage = savedLanguage && Object.keys(messages).includes(savedLanguage) 
  ? savedLanguage 
  : Object.keys(messages).includes(browserLanguage) 
    ? browserLanguage 
    : 'es'

const i18n = createI18n({
  legacy: false,
  locale: defaultLanguage,
  fallbackLocale: 'es',
  messages
})

const app = createApp(App)
app.use(router)
app.use(i18n)
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
