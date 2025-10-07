import { ref, computed } from 'vue'
import L from 'leaflet'
import type { AvalancheZone } from '../types'
import { useSettings } from './useSettings'

// Define coordinates for each zone
const zoneCoordinates = {
  'pirineo-aragones': { lat: 42.4500, lng: 0.0000, zoom: 10 },
  'pirineo-navarro': { lat: 42.8500, lng: -0.7500, zoom: 10 },
  'pirineo-catalan': { lat: 42.3500, lng: 1.5000, zoom: 10 }
}

export function useAvalancheMap() {
  const map = ref<L.Map | null>(null)
  const avalancheZones = ref<AvalancheZone[]>([])
  const { settings } = useSettings()

  // Computed property to get current zone coordinates
  const currentZoneCoordinates = computed(() => {
    if (settings.favoriteZone && zoneCoordinates[settings.favoriteZone as keyof typeof zoneCoordinates]) {
      return zoneCoordinates[settings.favoriteZone as keyof typeof zoneCoordinates]
    }
    // Default to center of Pyrenees if no zone selected
    return { lat: 42.6000, lng: 0.5000, zoom: 8 }
  })

  // Helper function to get zone display name
  const getZoneName = (zoneKey: string): string => {
    const zoneNames: Record<string, string> = {
      'pirineo-aragones': 'Pirineo Aragonés',
      'pirineo-navarro': 'Pirineo Navarro',
      'pirineo-catalan': 'Pirineo Catalán'
    }
    return zoneNames[zoneKey] || zoneKey
  }

  const initializeMap = (container: HTMLElement) => {
    try {
      // Initialize Leaflet map
      const coords = currentZoneCoordinates.value
      
      const leafletMap = L.map(container, {
        center: [coords.lat, coords.lng],
        zoom: coords.zoom,
        zoomControl: true,
        scrollWheelZoom: true,
        touchZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        attributionControl: true
      })
      
      map.value = leafletMap

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
        minZoom: 6
      }).addTo(leafletMap)

      // Add terrain/topographic layer for better mountain visualization
      L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data: © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: © <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
        maxZoom: 17,
        opacity: 0.6
      }).addTo(leafletMap)

      // Add marker for selected zone if available
      if (settings.favoriteZone) {
        L.marker([coords.lat, coords.lng])
          .addTo(leafletMap)
          .bindPopup(getZoneName(settings.favoriteZone))
          .openPopup()
      }

      // Load avalanche data for the current zone
      loadAvalancheData()

    } catch (error) {
      console.error('Error initializing map:', error)
      // Fallback to simple div if Leaflet fails
      container.innerHTML = `
        <div style="
          width: 100%; 
          height: 100%; 
          background: linear-gradient(135deg, #e3f2fd 0%, #81c784 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2e7d32;
          font-size: 18px;
          font-weight: 500;
          text-align: center;
        ">
          <div>
            🗺️ Error al cargar el mapa<br>
            <small style="font-size: 14px; opacity: 0.8;">Zona: ${settings.favoriteZone || 'No seleccionada'}</small>
          </div>
        </div>
      `
    }
  }

  const destroyMap = () => {
    if (map.value) {
      map.value.remove()
      map.value = null
    }
  }

  const loadAvalancheData = async () => {
    // TODO: Load avalanche data from API service
    try {
      // Mock data for now
      avalancheZones.value = []
    } catch (error) {
      console.error('Error loading avalanche data:', error)
    }
  }

  const addAvalancheLayer = (zones: AvalancheZone[]) => {
    // TODO: Add avalanche zones to map as colored polygons
    console.log('Adding avalanche zones:', zones)
  }

  // Method to update map center when zone changes
  const updateMapCenter = () => {
    if (map.value) {
      const coords = currentZoneCoordinates.value
      map.value.setView([coords.lat, coords.lng], coords.zoom)
      
      // Add/update marker for the new zone
      if (settings.favoriteZone) {
        L.marker([coords.lat, coords.lng])
          .addTo(map.value as any)
          .bindPopup(getZoneName(settings.favoriteZone))
          .openPopup()
      }
    }
  }

  return {
    map,
    avalancheZones,
    currentZoneCoordinates,
    initializeMap,
    destroyMap,
    loadAvalancheData,
    addAvalancheLayer,
    updateMapCenter
  }
}