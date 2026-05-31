import api from './index'

export const telegramApi = {
  getStatus: () => api.get('/telegram/status'),
  sendMessage: (chat_id: string, text: string) => api.post('/telegram/send', null, { params: { chat_id, text } }),
}
