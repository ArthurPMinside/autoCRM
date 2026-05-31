import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, Users, Wrench, DollarSign, Calendar, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { workOrdersApi } from '../api/workOrders'
import { clientsApi } from '../api/clients'
import { financeApi } from '../api/finance'

const revenueData = [
  { day: 'Пн', revenue: 45000, expenses: 28000 },
  { day: 'Вт', revenue: 52000, expenses: 31000 },
  { day: 'Ср', revenue: 48000, expenses: 25000 },
  { day: 'Чт', revenue: 61000, expenses: 33000 },
  { day: 'Пт', revenue: 55000, expenses: 29000 },
  { day: 'Сб', revenue: 42000, expenses: 22000 },
  { day: 'Вс', revenue: 18000, expenses: 15000 },
]

const statusData = [
  { name: 'В работе', value: 8, color: '#3b82f6' },
  { name: 'Завершено', value: 12, color: '#10b981' },
  { name: 'Ожидает', value: 3, color: '#f59e0b' },
  { name: 'Отменено', value: 1, color: '#ef4444' },
]

export default function DashboardPage() {
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['workOrders'],
    queryFn: async () => {
      const res = await workOrdersApi.getAll()
      return res.data
    },
  })

  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await clientsApi.getAll()
      return res.data
    },
  })

  const { data: transactions, isLoading: financeLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const res = await financeApi.getAll()
      return res.data
    },
  })

  const isLoading = ordersLoading || clientsLoading || financeLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
      </div>
    )
  }

  const totalRevenue = transactions?.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0) || 0
  const totalExpenses = transactions?.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0) || 0
  const activeOrders = orders?.filter((o: any) => o.status === 'in_progress').length || 0
  const completedToday = orders?.filter((o: any) => o.status === 'completed').length || 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Дашборд</h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">{new Date().toLocaleDateString('ru-RU')}</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Выручка (нед.)</span>
            <div className="flex items-center gap-1 text-emerald-600 text-xs">
              <ArrowUpRight className="w-3 h-3" />
              12%
            </div>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{totalRevenue.toLocaleString()} ₽</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Расходы (нед.)</span>
            <div className="flex items-center gap-1 text-red-600 text-xs">
              <ArrowDownRight className="w-3 h-3" />
              5%
            </div>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{totalExpenses.toLocaleString()} ₽</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">В работе</span>
            <Wrench className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{activeOrders}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Клиентов</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{clients?.length || 0}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Выручка и расходы</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="day" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                formatter={(value: number) => [`${value.toLocaleString()} ₽`, '']}
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Выручка" />
              <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Расходы" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Статусы заказов</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {statusData.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Последняя активность</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {[
            { icon: Wrench, text: 'Заказ #1234 переведён в статус "В работе"', time: '10 мин назад', color: 'text-blue-500' },
            { icon: DollarSign, text: 'Поступление 45 000 ₽ от Иванова А.А.', time: '25 мин назад', color: 'text-emerald-500' },
            { icon: Users, text: 'Новый клиент: Петрова М.С.', time: '1 ч назад', color: 'text-purple-500' },
            { icon: Calendar, text: 'Запись на ТО: Toyota Camry, 15:00', time: '2 ч назад', color: 'text-amber-500' },
            { icon: Wrench, text: 'Заказ #1233 завершён', time: '3 ч назад', color: 'text-emerald-500' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30">
              <item.icon className={`w-4 h-4 ${item.color} flex-shrink-0`} />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{item.text}</span>
              <span className="text-xs text-gray-400">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
