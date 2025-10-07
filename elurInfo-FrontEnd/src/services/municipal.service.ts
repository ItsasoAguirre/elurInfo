interface Municipality {
  id: string
  name: string
  zone: string
}

class MunicipalService {
  private municipalities: Municipality[] = [
    // Pirineo Aragonés
    { id: '22015', name: 'Benasque', zone: 'pirineo-aragones' },
    { id: '22040', name: 'Canfranc', zone: 'pirineo-aragones' },
    { id: '22178', name: 'Panticosa', zone: 'pirineo-aragones' },
    { id: '22242', name: 'Torla-Ordesa', zone: 'pirineo-aragones' },
    
    // Pirineo Navarro
    { id: '31174', name: 'Isaba', zone: 'pirineo-navarro' },
    { id: '31175', name: 'Ochagavía', zone: 'pirineo-navarro' },
    { id: '31246', name: 'Roncal', zone: 'pirineo-navarro' },
    { id: '31269', name: 'Burguete', zone: 'pirineo-navarro' }
  ]

  getMunicipalities(): Municipality[] {
    return this.municipalities
  }

  getMunicipalitiesByZone(zone: string): Municipality[] {
    return this.municipalities.filter(m => m.zone === zone)
  }

  getMunicipalityById(id: string): Municipality | undefined {
    return this.municipalities.find(m => m.id === id)
  }

  getMunicipalityName(id: string): string {
    const municipality = this.getMunicipalityById(id)
    return municipality ? municipality.name : `Municipio ${id}`
  }

  // Get main stations for each zone
  getMainStations(): Municipality[] {
    return [
      { id: '22015', name: 'Benasque', zone: 'pirineo-aragones' },
      { id: '31174', name: 'Isaba', zone: 'pirineo-navarro' }
    ]
  }
}

export const municipalService = new MunicipalService()