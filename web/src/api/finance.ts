import api from './index'

export const financeApi = {
  getAll: () => api.get('/finance'),
  create: (data: any) => api.post('/finance', data),
  update: (id: string, data: any) => api.put(`/finance/${id}`, data),
  delete: (id: string) => api.delete(`/finance/${id}`),
}
