const CACHE_NAME = 'elurinfo-v1'
const API_CACHE_NAME = 'elurinfo-api-v1'

// Files to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/vite.svg',
  // Add more static assets as needed
]

// API endpoints to cache
const API_ENDPOINTS = [
  '/avalancha',
  '/montana',
]

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .catch(error => {
        console.error('Error caching static assets:', error)
      })
  )
  
  // Force activation of new service worker
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => 
              cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME
            )
            .map(cacheName => {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            })
        )
      })
      .then(() => {
        // Take control of all pages
        return self.clients.claim()
      })
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Handle API requests
  if (url.pathname.startsWith('/api/') || API_ENDPOINTS.some(endpoint => url.pathname.includes(endpoint))) {
    event.respondWith(handleApiRequest(request))
    return
  }
  
  // Handle static assets
  if (request.destination === 'document' || 
      request.destination === 'script' || 
      request.destination === 'style' ||
      request.destination === 'image') {
    event.respondWith(handleStaticRequest(request))
    return
  }
})

async function handleApiRequest(request) {
  const url = new URL(request.url)
  const cacheKey = url.pathname + url.search
  
  try {
    // Try to fetch from network first
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(API_CACHE_NAME)
      
      // Clone the response before caching
      const responseClone = networkResponse.clone()
      await cache.put(cacheKey, responseClone)
      
      console.log('API response cached:', cacheKey)
      return networkResponse
    }
    
    throw new Error(`Network response not ok: ${networkResponse.status}`)
    
  } catch (error) {
    console.warn('Network request failed, trying cache:', error)
    
    // Try to get from cache
    const cache = await caches.open(API_CACHE_NAME)
    const cachedResponse = await cache.match(cacheKey)
    
    if (cachedResponse) {
      console.log('Serving from API cache:', cacheKey)
      
      // Add custom header to indicate cached response
      const response = cachedResponse.clone()
      response.headers.set('X-Served-From', 'cache')
      
      return response
    }
    
    // Return a fallback response for API requests
    return new Response(
      JSON.stringify({ 
        error: 'No hay conexión y no hay datos en caché',
        offline: true 
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'X-Served-From': 'fallback'
        }
      }
    )
  }
}

async function handleStaticRequest(request) {
  try {
    // Try network first for static assets
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
      return networkResponse
    }
    
    throw new Error(`Network response not ok: ${networkResponse.status}`)
    
  } catch (error) {
    console.warn('Network request failed for static asset, trying cache:', error)
    
    // Try to get from cache
    const cache = await caches.open(CACHE_NAME)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      console.log('Serving static asset from cache:', request.url)
      return cachedResponse
    }
    
    // For navigation requests, return the cached index.html
    if (request.destination === 'document') {
      const cachedIndex = await cache.match('/')
      if (cachedIndex) {
        return cachedIndex
      }
    }
    
    // Return network error for other requests
    return new Response('Sin conexión', {
      status: 503,
      statusText: 'Service Unavailable'
    })
  }
}

// Handle background sync for failed requests
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  console.log('Performing background sync...')
  
  try {
    // Re-fetch important data when connection is restored
    const apiCache = await caches.open(API_CACHE_NAME)
    
    for (const endpoint of API_ENDPOINTS) {
      try {
        const response = await fetch(endpoint)
        if (response.ok) {
          await apiCache.put(endpoint, response.clone())
          console.log('Background sync updated:', endpoint)
        }
      } catch (error) {
        console.warn('Background sync failed for:', endpoint, error)
      }
    }
  } catch (error) {
    console.error('Background sync error:', error)
  }
}

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    console.log('Push notification received:', data)
    
    const title = data.title || 'ElurInfo'
    const options = {
      body: data.body || 'Nueva información disponible',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      tag: data.tag || 'general',
      data: data.data || {}
    }
    
    event.waitUntil(
      self.registration.showNotification(title, options)
    )
  }
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  const targetUrl = event.notification.data?.url || '/'
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus()
          }
        }
        
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(targetUrl)
        }
      })
  )
})