import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Users, Repeat, AlertTriangle, Loader2, BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { clientsApi } from '../api/clients'
import { workOrdersApi } from '../api/workOrders'

const rfmData = [
  { segment: 'Чемпионы', count: 12, color: '#10b981', desc: 'Частые, новые, высокий чек' },
  { segment: 'Лояльные', count: 18, color: '#3b82f6', desc: 'Регулярные клиенты' },
  { segment: 'Потенциал', count: 15, color: '#8b5cf6', desc: 'Новые с высоким чеком' },
  { segment: 'В зоне риска', count: 8, color: '#f59e0b', desc: 'Не были давно' },
  { segment: 'Потерянные', count: 5, color: '#ef4444', desc: 'Давно не посещали' },
]

const retentionData = [
  { month: 'Янв', new: 12, returned: 8, churned: 3 },
  { month: 'Фев', new: 15, returned: 10, churned: 4 },
  { month: 'Мар', new: 18, returned: 14, churned: 5 },
  { month: 'Апр', new: 14, returned: 16, churned: 3 },
  { month: 'Май', new: 20, returned: 18, churned: 4 },
]

const revenueByService = [
  { name: 'ТО', value: 35 },
  { name: 'Диагностика', value: 15 },
  { name: 'Ремонт', value: 30 },
  { name: 'Кузов', value: 12 },
  { name: 'Шиномонтаж', value: 8 },
]

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'rfm' | 'retention' | 'revenue'>('rfm')

  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await clientsApi.getAll()
      return res.data
    },
  })

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['workOrders'],
    queryFn: async () => {
      const res = await workOrdersApi.getAll()
      return res.data
    },
  })

  const isLoading = clientsLoading || ordersLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
      </div>
    )
  }

  const avgVisits = clients ? (clients.reduce((sum: number, c: any) => sum + c.total_visits, 0) / clients.length).toFixed(1) : '0'
  const avgRevenue = clients ? (clients.reduce((sum: number, c: any) => sum + c.total_revenue, 0) / clients.length).toFixed(0) : '0'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Аналитика</h2>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-primary-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Всего клиентов</span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{clients?.length || 0}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Repeat className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Среднее визитов</span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{avgVisits}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">LTV средний</span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{Number(avgRevenue).toLocaleString()} ₽</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Отток (30 дн.)</span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">12%</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {[
          { key: 'rfm', label: 'RFM-сегменты', icon: Users },
          { key: 'retention', label: 'Удержание', icon: Repeat },
          { key: 'revenue', label: 'Выручка', icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* RFM Tab */}
      {activeTab === 'rfm' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Распределение сегментов</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={rfmData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {rfmData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                  formatter={(value: number, name: string, props: any) => [`${value} чел.`, props.payload.segment]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {rfmData.map((c) => (
                <div key={c.segment} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.segment}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Сегменты клиентов</h3>
            <div className="space-y-3">
              {rfmData.map((segment) => (
                <div key={segment.segment} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: segment.color }} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{segment.segment}</span>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{segment.count} чел.</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{segment.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Retention Tab */}
      {activeTab === 'retention' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Динамика удержания</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={retentionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Line type="monotone" dataKey="new" stroke="#3b82f6" strokeWidth={2} name="Новые" />
                <Line type="monotone" dataKey="returned" stroke="#10b981" strokeWidth={2} name="Вернувшиеся" />
                <Line type="monotone" dataKey="churned" stroke="#ef4444" strokeWidth={2} name="Отток" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
              <div className="text-sm text-emerald-600 dark:text-emerald-400">Retention rate</div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">68%</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">+5% к прошлому месяцу</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="text-sm text-blue-600 dark:text-blue-400">Средний срок жизни</div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">14 мес.</div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">+2 мес. к прошлому году</div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
              <div className="text-sm text-amber-600 dark:text-amber-400">Время до второго визита</div>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">45 дн.</div>
              <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">-8 дн. к прошлому кварталу</div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Выручка по типам услуг</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueByService} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#9ca3af', fontSize: 12 }} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                  formatter={(value: number) => [`${value}%`, 'Доля']}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Топ услуг по выручке</h3>
            <div className="space-y-3">
              {[
                { name: 'ТО-1 (замена масла + фильтры)', revenue: 485000, orders: 42, growth: '+15%' },
                { name: 'Диагностика подвески', revenue: 320000, orders: 28, growth: '+8%' },
                { name: 'Ремонт тормозной системы', revenue: 280000, orders: 22, growth: '+22%' },
                { name: 'Шиномонтаж (комплект)', revenue: 195000, orders: 35, growth: '+5%' },
                { name: 'Замена ГРМ', revenue: 168000, orders: 12, growth: '-3%' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-sm font-bold text-primary-700 dark:text-primary-300">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{item.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.orders} заказов</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{item.revenue.toLocaleString()} ₽</div>
                    <div className={`text-xs ${item.growth.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}`}>
                      {item.growth}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
