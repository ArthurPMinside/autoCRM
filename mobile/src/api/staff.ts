import api from './index'

export const staffApi = {
  getAll: () => api.get('/staff'),
  getById: (id: string) => api.get(`/staff/${id}`),
  create: (data: any) => api.post('/staff', data),
  update: (id: string, data: any) => api.put(`/staff/${id}`, data),
  delete: (id: string) => api.delete(`/staff/${id}`),
  getSalary: (id: string) => api.get(`/staff/${id}/salary`),
}
