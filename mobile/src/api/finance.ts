import api from './index'

export const financeApi = {
  getAll: () => api.get('/finance'),
  create: (data: any) => api.post('/finance', data),
}
