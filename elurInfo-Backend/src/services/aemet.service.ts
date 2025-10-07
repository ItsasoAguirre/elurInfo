import axios, { AxiosResponse } from 'axios';
import { logger } from '../utils/logger';

interface AemetResponse {
  descripcion: string;
  estado: number;
  datos: string;
  metadatos: string;
}

interface NivologicalData {
  area: string;
  fecha: string;
  datos: any;
}

export class AemetService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = process.env['AEMET_BASE_URL'] || 'https://opendata.aemet.es/opendata/api';
    this.apiKey = process.env['AEMET_API_KEY'] || '';
    
    if (!this.apiKey) {
      throw new Error('AEMET_API_KEY is required');
    }
  }

  /**
   * Obtiene información nivológica de AEMET para el área especificada
   * @param area - Código del área (0: Pirineo Catalán, 1: Pirineo Navarro y Aragonés)
   * @returns Promise con los datos nivológicos
   */
  async getNivologicalData(area: number): Promise<NivologicalData | null> {
    try {
      // Validar el área
      if (area !== 0 && area !== 1) {
        throw new Error('Invalid area code. Must be 0 (Pirineo Catalán) or 1 (Pirineo Navarro y Aragonés)');
      }

      const url = `${this.baseUrl}/prediccion/especifica/nivologica/${area}`;
      
      logger.info(`Fetching nivological data from AEMET for area: ${area}`);

      // Primera petición para obtener la URL de los datos
      const response: AxiosResponse<AemetResponse> = await axios.get(url, {
        headers: {
          'api_key': this.apiKey,
        },
        timeout: 10000,
      });

      if (response.data.estado !== 200) {
        logger.error(`AEMET API returned error status: ${response.data.estado}`);
        return null;
      }

      // Segunda petición para obtener los datos reales
      const dataUrl = response.data.datos;
      const dataResponse = await axios.get(dataUrl, {
        timeout: 15000,
      });

      const areaName = area === 0 ? 'Pirineo Catalán' : 'Pirineo Navarro y Aragonés';
      
      logger.info(`Successfully fetched nivological data for ${areaName}`);

      return {
        area: areaName,
        fecha: new Date().toISOString(),
        datos: dataResponse.data,
      };

    } catch (error) {
      logger.error('Error fetching nivological data from AEMET:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          logger.error('Authentication failed - check AEMET API key');
        } else if (error.response?.status === 404) {
          logger.error('Nivological data not found for the specified area');
        } else if (error.response?.status === 429) {
          logger.error('Rate limit exceeded for AEMET API');
        }
      }
      
      return null;
    }
  }

  /**
   * Obtiene datos nivológicos para ambas áreas disponibles
   * @returns Promise con array de datos nivológicos
   */
  async getAllNivologicalData(): Promise<NivologicalData[]> {
    const areas = [0, 1]; // Pirineo Catalán y Pirineo Navarro y Aragonés
    const results: NivologicalData[] = [];

    for (const area of areas) {
      const data = await this.getNivologicalData(area);
      if (data) {
        results.push(data);
      }
      
      // Pequeña pausa entre peticiones para no sobrecargar la API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }

  /**
   * Verifica la conectividad con la API de AEMET
   * @returns Promise<boolean> indicando si la API está disponible
   */
  async checkApiHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/prediccion/especifica/nivologica/0`, {
        headers: {
          'api_key': this.apiKey,
        },
        timeout: 5000,
      });

      return response.status === 200 || response.data.estado === 200;
    } catch (error) {
      logger.error('AEMET API health check failed:', error);
      return false;
    }
  }
}

// Exportar una instancia singleton
export const aemetService = new AemetService();