import api from './index'

export const workOrdersApi = {
  getAll: () => api.get('/work-orders'),
  getById: (id: string) => api.get(`/work-orders/${id}`),
  create: (data: any) => api.post('/work-orders', data),
  update: (id: string, data: any) => api.put(`/work-orders/${id}`, data),
  updateStatus: (id: string, status: string) => api.patch(`/work-orders/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/work-orders/${id}`),
}
