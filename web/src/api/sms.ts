import api from './index'

export const smsApi = {
  getStatus: () => api.get('/sms/status'),
  send: (data: { phone: string; message: string }) => api.post('/sms/send', data),
  getLogs: (limit?: number) => api.get('/sms/logs', { params: { limit } }),
}
