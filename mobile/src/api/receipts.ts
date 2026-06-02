import api from './index'

export const receiptsApi = {
  getAll: () => api.get('/receipts'),
  getById: (id: string) => api.get(`/receipts/${id}`),
  create: (data: any) => api.post('/receipts', data),
}
