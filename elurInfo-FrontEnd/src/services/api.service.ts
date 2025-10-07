import type { 
  AvalancheReport, 
  MountainForecast, 
  MunicipalForecast, 
  SnowScienceReport, 
  ApiResponse 
} from '../types'

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

  // Snow Science endpoints
  async getSnowScienceReports(): Promise<SnowScienceReport[]> {
    const response = await this.fetchWithError<ApiResponse<SnowScienceReport[]>>('/snow-science')
    return response.data
  }

  async getSnowScienceReportByArea(areaCode: number): Promise<SnowScienceReport> {
    const response = await this.fetchWithError<ApiResponse<SnowScienceReport>>(`/snow-science/${areaCode}`)
    return response.data
  }

  async refreshSnowScienceData(areaCode?: number): Promise<SnowScienceReport[]> {
    const body = areaCode !== undefined ? { area: areaCode } : {}
    const response = await fetch(`${this.baseUrl}/snow-science/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    return result.data
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