import api from './index'

export interface CatalogMake {
  id: number
  slug: string
  name: string
}

export interface CatalogModel {
  id: number
  slug: string
  name: string
}

export interface CatalogGeneration {
  id: number
  name: string
  year_from: number | null
  year_to: number | null
}

export interface CatalogBody {
  id: number
  name: string
  body_type: string
  frames: string | null
}

export const catalogApi = {
  getMakes: () => api.get<CatalogMake[]>('/catalog/makes'),
  getModels: (makeId: number) => api.get<CatalogModel[]>(`/catalog/models?make_id=${makeId}`),
  getGenerations: (modelId: number) => api.get<CatalogGeneration[]>(`/catalog/generations?model_id=${modelId}`),
  getBodies: (generationId: number) => api.get<CatalogBody[]>(`/catalog/bodies?generation_id=${generationId}`),
}
