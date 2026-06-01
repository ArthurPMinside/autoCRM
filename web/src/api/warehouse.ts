import api from './index'

export const warehouseApi = {
  getParts: () => api.get('/warehouse/parts'),
  createPart: (data: any) => api.post('/warehouse/parts', data),
  updatePart: (id: string, data: any) => api.put(`/warehouse/parts/${id}`, data),
  deletePart: (id: string) => api.delete(`/warehouse/parts/${id}`),
}
