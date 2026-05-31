import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Save, Bell, Moon, Sun, Shield, User, Building2, MessageSquare, Send } from 'lucide-react'
import { useThemeStore } from '../store/themeStore'
import { useToastStore } from '../components/Toast'
import { smsApi } from '../api/sms'
import { telegramApi } from '../api/telegram'

export default function SettingsPage() {
  const { isDark, toggle } = useThemeStore()
  const { addToast } = useToastStore()
  const [activeSection, setActiveSection] = useState('profile')

  const { data: smsStatus } = useQuery({
    queryKey: ['smsStatus'],
    queryFn: async () => {
      const res = await smsApi.getStatus()
      return res.data
    },
  })

  const { data: telegramStatus } = useQuery({
    queryKey: ['telegramStatus'],
    queryFn: async () => {
      const res = await telegramApi.getStatus()
      return res.data
    },
  })

  const [profile, setProfile] = useState({
    firstName: 'Админ',
    lastName: 'Админов',
    email: 'admin@autocrm.ru',
    phone: '+7 (999) 000-00-00',
  })

  const [company, setCompany] = useState({
    name: 'Автосервис "Мастер"',
    address: 'г. Москва, ул. Автосервисная, 15',
    phone: '+7 (495) 123-45-67',
    email: 'info@master-auto.ru',
    website: 'master-auto.ru',
    workHours: 'Пн-Сб: 08:00-20:00, Вс: выходной',
  })

  const [notifications, setNotifications] = useState({
    emailOrders: true,
    emailMarketing: false,
    smsClient: true,
    smsStatus: true,
    telegramBot: true,
  })

  const [smsSettings, setSmsSettings] = useState({
    provider: 'mock',
    apiKey: '',
    enabled: true,
  })

  const [telegramSettings, setTelegramSettings] = useState({
    token: '',
    enabled: false,
  })

  const handleSave = () => {
    addToast('Настройки сохранены', 'success')
  }

  const sections = [
    { key: 'profile', label: 'Профиль', icon: User },
    { key: 'company', label: 'Компания', icon: Building2 },
    { key: 'notifications', label: 'Уведомления', icon: Bell },
    { key: 'integrations', label: 'Интеграции', icon: Send },
    { key: 'security', label: 'Безопасность', icon: Shield },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Настройки</h2>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Save className="w-4 h-4" />
          Сохранить
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {sections.map((section) => (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                  activeSection === section.key
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 border-l-4 border-primary-500'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border-l-4 border-transparent'
                }`}
              >
                <section.icon className="w-4 h-4" />
                {section.label}
              </button>
            ))}

            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  Тема
                </span>
                <button
                  onClick={toggle}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    isDark ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      isDark ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            {activeSection === 'profile' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Профиль</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Имя</label>
                    <input value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Фамилия</label>
                    <input value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Телефон</label>
                  <input type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100" />
                </div>
              </div>
            )}

            {activeSection === 'company' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Компания</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Название</label>
                  <input value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Адрес</label>
                  <input value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Телефон</label>
                    <input value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input type="email" value={company.email} onChange={(e) => setCompany({ ...company, email: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Сайт</label>
                    <input value={company.website} onChange={(e) => setCompany({ ...company, website: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Режим работы</label>
                    <input value={company.workHours} onChange={(e) => setCompany({ ...company, workHours: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100" />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Уведомления</h3>
                <div className="space-y-3">
                  {[
                    { key: 'emailOrders', label: 'Email о новых заказах', desc: 'Получать уведомления при создании заказ-наряда' },
                    { key: 'emailMarketing', label: 'Email рассылки', desc: 'Получать маркетинговые отчёты' },
                    { key: 'smsClient', label: 'SMS клиенту при записи', desc: 'Автоматическая отправка SMS при создании записи' },
                    { key: 'smsStatus', label: 'SMS о статусе заказа', desc: 'Уведомлять клиента об изменении статуса' },
                    { key: 'telegramBot', label: 'Telegram-бот', desc: 'Интеграция с Telegram для уведомлений' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">{item.label}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</div>
                      </div>
                      <button
                        onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          notifications[item.key as keyof typeof notifications] ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      >
                        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          notifications[item.key as keyof typeof notifications] ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'integrations' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Интеграции</h3>

                {/* SMS */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary-500" />
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">SMS-уведомления</h4>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                      smsStatus?.mock_mode
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30'
                    }`}>
                      {smsStatus?.mock_mode ? 'Mock режим' : 'Активно'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Провайдер</label>
                    <select
                      value={smsSettings.provider}
                      onChange={(e) => setSmsSettings({ ...smsSettings, provider: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100"
                    >
                      <option value="mock">Mock (тестовый)</option>
                      <option value="smsru">SMS.ru</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API ключ</label>
                    <input
                      type="password"
                      value={smsSettings.apiKey}
                      onChange={(e) => setSmsSettings({ ...smsSettings, apiKey: e.target.value })}
                      placeholder="Введите API ключ"
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100"
                    />
                  </div>
                </div>

                {/* Telegram */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <Send className="w-5 h-5 text-sky-500" />
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Telegram-бот</h4>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                      telegramStatus?.enabled
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700'
                    }`}>
                      {telegramStatus?.enabled ? 'Активен' : 'Не настроен'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bot Token</label>
                    <input
                      type="password"
                      value={telegramSettings.token}
                      onChange={(e) => setTelegramSettings({ ...telegramSettings, token: e.target.value })}
                      placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Получите токен у @BotFather в Telegram
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Безопасность</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Текущий пароль</label>
                  <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Новый пароль</label>
                  <input type="password" placeholder="Минимум 8 символов" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Подтвердите пароль</label>
                  <input type="password" placeholder="Повторите новый пароль" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
