import api from './index'

export const telegramApi = {
  getStatus: () => api.get('/telegram/status'),
  sendMessage: (data: { chat_id: string; text: string }) => api.post('/telegram/send', data),
}
