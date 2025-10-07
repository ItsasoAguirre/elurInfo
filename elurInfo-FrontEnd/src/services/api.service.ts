import type { AvalancheReport, MountainForecast, MunicipalForecast } from '../types'

class ApiService {
  private baseUrl: string

  constructor() {
    // This will be configurable through environment variables
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
  }

  private async fetchWithError<T>(url: string): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${url}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error(`API Error fetching ${url}:`, error)
      throw error
    }
  }

  async getAvalancheReports(): Promise<AvalancheReport[]> {
    return this.fetchWithError<AvalancheReport[]>('/avalancha')
  }

  async getMountainForecasts(): Promise<MountainForecast[]> {
    return this.fetchWithError<MountainForecast[]>('/montana')
  }

  async getMunicipalForecast(municipalityId: string): Promise<MunicipalForecast> {
    return this.fetchWithError<MunicipalForecast>(`/municipio/${municipalityId}`)
  }

  // Check if the API is reachable
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`)
      return response.ok
    } catch {
      return false
    }
  }
}

export const apiService = new ApiService()