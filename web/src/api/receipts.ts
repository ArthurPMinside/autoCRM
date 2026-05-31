import api from './index'

export const receiptsApi = {
  getAll: () => api.get('/receipts'),
  getById: (id: string) => api.get(`/receipts/${id}`),
  create: (data: { work_order_id: string }) => api.post('/receipts', data),
}
