import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Megaphone, Send, MessageSquare, Loader2, Users, CheckCircle, Clock } from 'lucide-react'
import { useToastStore } from '../components/Toast'

interface Campaign {
  id: string
  name: string
  type: 'sms' | 'email' | 'telegram'
  status: 'active' | 'draft' | 'completed'
  sent: number
  delivered: number
  opened: number
  date: string
}

const mockCampaigns: Campaign[] = [
  { id: '1', name: 'Напоминание о ТО', type: 'sms', status: 'active', sent: 45, delivered: 43, opened: 38, date: '2025-05-28' },
  { id: '2', name: 'Скидка 10% на шиномонтаж', type: 'telegram', status: 'completed', sent: 120, delivered: 118, opened: 89, date: '2025-05-20' },
  { id: '3', name: 'Поздравление с Днём рождения', type: 'email', status: 'draft', sent: 0, delivered: 0, opened: 0, date: '2025-06-01' },
  { id: '4', name: 'Акция "Летнее ТО"', type: 'sms', status: 'active', sent: 80, delivered: 78, opened: 65, date: '2025-05-25' },
]

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates' | 'audience'>('campaigns')
  const [showCreate, setShowCreate] = useState(false)
  const { addToast } = useToastStore()

  const { data: campaigns = mockCampaigns, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => mockCampaigns,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
      </div>
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sms': return <MessageSquare className="w-4 h-4" />
      case 'email': return <Send className="w-4 h-4" />
      case 'telegram': return <Megaphone className="w-4 h-4" />
      default: return <MessageSquare className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sms': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      case 'email': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
      case 'telegram': return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
      case 'completed': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
      case 'draft': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Маркетинг</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Megaphone className="w-4 h-4" />
          Новая кампания
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Megaphone className="w-4 h-4 text-primary-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Кампаний</span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{campaigns.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Send className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Отправлено</span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{campaigns.reduce((s, c) => s + c.sent, 0)}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Доставлено</span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{campaigns.reduce((s, c) => s + c.delivered, 0)}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Открытий</span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{campaigns.reduce((s, c) => s + c.opened, 0)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {[
          { key: 'campaigns', label: 'Кампании' },
          { key: 'templates', label: 'Шаблоны' },
          { key: 'audience', label: 'Аудитория' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Campaigns */}
      {activeTab === 'campaigns' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Название</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Тип</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Статус</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Отправлено</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Доставлено</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Открытий</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Дата</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{c.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(c.type)}`}>
                        {getTypeIcon(c.type)}
                        {c.type === 'sms' ? 'SMS' : c.type === 'email' ? 'Email' : 'Telegram'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(c.status)}`}>
                        {c.status === 'active' && <Clock className="w-3 h-3" />}
                        {c.status === 'active' ? 'Активна' : c.status === 'completed' ? 'Завершена' : 'Черновик'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{c.sent}</td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{c.delivered}</td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{c.opened}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Templates */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'Напоминание о ТО', type: 'sms', text: 'Здравствуйте, {name}! Напоминаем, что вашему автомобилю {car} требуется ТО. Запишитесь: +7 (495) 123-45-67' },
            { name: 'Готовность заказа', type: 'sms', text: 'Здравствуйте, {name}! Ваш заказ #{order} готов к выдаче. Сумма: {amount} ₽. Ждём вас!' },
            { name: 'Скидка 10%', type: 'email', text: 'Уважаемый {name}! Специально для вас скидка 10% на {service}. Действует до {date}.' },
            { name: 'Поздравление с ДР', type: 'telegram', text: '{name}, поздравляем с Днём рождения! 🎉 Скидка 15% на все услуги в ваш день!' },
          ].map((template, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">{template.name}</h4>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(template.type)}`}>
                  {getTypeIcon(template.type)}
                  {template.type === 'sms' ? 'SMS' : template.type === 'email' ? 'Email' : 'Telegram'}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">{template.text}</p>
              <div className="flex gap-2 mt-3">
                <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">Редактировать</button>
                <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">Использовать</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audience */}
      {activeTab === 'audience' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">По статусу</h4>
              <div className="space-y-2">
                {['Все клиенты', 'Активные', 'Неактивные (30+ дн.)', 'Новые (7 дн.)'].map((item) => (
                  <label key={item} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <input type="checkbox" className="rounded border-gray-300" />
                    {item}
                  </label>
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">По авто</h4>
              <div className="space-y-2">
                {['Все марки', 'Toyota', 'BMW', 'Hyundai', 'Kia'].map((item) => (
                  <label key={item} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <input type="checkbox" className="rounded border-gray-300" />
                    {item}
                  </label>
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">По услугам</h4>
              <div className="space-y-2">
                {['Все услуги', 'ТО', 'Диагностика', 'Ремонт', 'Шиномонтаж'].map((item) => (
                  <label key={item} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <input type="checkbox" className="rounded border-gray-300" />
                    {item}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 border border-primary-200 dark:border-primary-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-primary-700 dark:text-primary-300">Выбрано получателей</div>
                <div className="text-2xl font-bold text-primary-800 dark:text-primary-200">42 клиента</div>
              </div>
              <button
                onClick={() => { addToast('Рассылка запущена!', 'success'); setShowCreate(false) }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
              >
                Запустить рассылку
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
