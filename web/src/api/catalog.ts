import api from './index'

export interface CatalogMake {
  id: number
  slug: string
  name: string
}

export interface CatalogModel {
  id: number
  make_id: number
  name: string
  slug: string
}

export interface CatalogGeneration {
  id: number
  model_id: number
  name: string
  year_from: number | null
  year_to: number | null
}

export interface CatalogBody {
  id: number
  generation_id: number
  name: string
}

export const catalogApi = {
  getMakes: () => api.get<CatalogMake[]>('/catalog/makes'),
  getModels: (makeId: number) => api.get<CatalogModel[]>(`/catalog/models?make_id=${makeId}`),
  getGenerations: (modelId: number) => api.get<CatalogGeneration[]>(`/catalog/generations?model_id=${modelId}`),
  getBodies: (generationId: number) => api.get<CatalogBody[]>(`/catalog/bodies?generation_id=${generationId}`),
}
