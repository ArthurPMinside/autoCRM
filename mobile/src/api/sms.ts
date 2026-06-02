import api from './index'

export const smsApi = {
  send: (data: { phone: string; message: string }) => api.post('/sms/send', data),
  getLogs: () => api.get('/sms/logs'),
  getStatus: () => api.get('/sms/status'),
}
