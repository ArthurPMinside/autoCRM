import api from './index'

export const vehiclesApi = {
  getAll: () => api.get('/vehicles'),
  getByClient: (clientId: string) => api.get(`/vehicles?client_id=${clientId}`),
  create: (data: any) => api.post('/vehicles', data),
  update: (id: string, data: any) => api.put(`/vehicles/${id}`, data),
  delete: (id: string) => api.delete(`/vehicles/${id}`),
}
