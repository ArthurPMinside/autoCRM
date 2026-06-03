import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, Users, Wrench, DollarSign, Calendar, ArrowUpRight, ArrowDownRight, Loader2, BarChart3, Repeat, AlertTriangle, ArrowUpDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { dashboardApi } from '../api/dashboard'
import { workOrdersApi } from '../api/workOrders'
import { clientsApi } from '../api/clients'
import { financeApi } from '../api/finance'
import { analyticsApi } from '../api/analytics'
import DateRangePicker from '../components/DateRangePicker'

const statusColors: Record<string, string> = {
  pending: '#f59e0b',
  in_progress: '#3b82f6',
  completed: '#10b981',
  cancelled: '#ef4444',
}

const statusLabels: Record<string, string> = {
  pending: 'Ожидает',
  in_progress: 'В работе',
  completed: 'Завершено',
  cancelled: 'Отменено',
}

function getDefaultDates() {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  return { start: fmt(start), end: fmt(end) }
}

function shiftMonthBack(dateStr: string): string {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() - 1)
  return d.toISOString().split('T')[0]
}

function isDateInRange(dateStr: string | null | undefined, start: string, end: string): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const s = new Date(start)
  const e = new Date(end)
  e.setHours(23, 59, 59, 999)
  return d >= s && d <= e
}

function calcChange(current: number, previous: number): { value: string; isPositive: boolean | null } {
  if (previous === 0) {
    if (current === 0) return { value: '0%', isPositive: null }
    return { value: 'Новое', isPositive: true }
  }
  const change = ((current - previous) / previous) * 100
  return { value: `${change >= 0 ? '+' : ''}${change.toFixed(0)}%`, isPositive: change >= 0 }
}

type SortBy = 'revenue' | 'orders' | 'clients' | 'source'
type SortOrder = 'asc' | 'desc'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview')
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'sources' | 'rfm' | 'retention' | 'revenue'>('sources')
  const defaultDates = getDefaultDates()
  const [startDate, setStartDate] = useState(defaultDates.start)
  const [endDate, setEndDate] = useState(defaultDates.end)
  const [sortBy, setSortBy] = useState<SortBy>('revenue')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const dateParams = { start_date: startDate, end_date: endDate }
  const sourceParams = { ...dateParams, sort_by: sortBy, sort_order: sortOrder }

  const { data: dashboardData, isLoading: dashLoading } = useQuery({
    queryKey: ['dashboard', dateParams],
    queryFn: async () => {
      const res = await dashboardApi.getStats(dateParams)
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

  const { data: sourcesData, isLoading: sourcesLoading } = useQuery({
    queryKey: ['analyticsSources', sourceParams],
    queryFn: async () => {
      const res = await analyticsApi.getSources(sourceParams)
      return res.data
    },
  })

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['dashboardActivity'],
    queryFn: async () => {
      const res = await dashboardApi.getActivity()
      return res.data
    },
  })

  const { data: rfmData, isLoading: rfmLoading } = useQuery({
    queryKey: ['analyticsRfm', dateParams],
    queryFn: async () => {
      const res = await analyticsApi.getRfm(dateParams)
      return res.data
    },
  })

  const { data: retentionData, isLoading: retentionLoading } = useQuery({
    queryKey: ['analyticsRetention'],
    queryFn: async () => {
      const res = await analyticsApi.getRetention()
      return res.data
    },
  })

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['analyticsRevenue', dateParams],
    queryFn: async () => {
      const res = await analyticsApi.getRevenue(dateParams)
      return res.data
    },
  })

  const isLoading = dashLoading || ordersLoading || clientsLoading || financeLoading || sourcesLoading || activityLoading || rfmLoading || retentionLoading || revenueLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
      </div>
    )
  }

  const prevStart = shiftMonthBack(startDate)
  const prevEnd = shiftMonthBack(endDate)

  // --- Current period metrics ---
  const currentOrders = orders?.filter((o: any) => isDateInRange(o.scheduled_date, startDate, endDate)) || []
  const periodRevenue = currentOrders.filter((o: any) => o.status !== 'cancelled').reduce((s: number, o: any) => s + (o.total_cost || 0), 0)
  const periodActiveOrders = currentOrders.filter((o: any) => o.status === 'pending' || o.status === 'in_progress').length
  const periodNewClients = clients?.filter((c: any) => isDateInRange(c.created_at, startDate, endDate)).length || 0
  const periodExpenses = transactions?.filter((t: any) => t.type === 'expense' && isDateInRange(t.date, startDate, endDate)).reduce((s: number, t: any) => s + t.amount, 0) || 0

  // --- Previous period metrics ---
  const prevOrders = orders?.filter((o: any) => isDateInRange(o.scheduled_date, prevStart, prevEnd)) || []
  const prevRevenue = prevOrders.filter((o: any) => o.status !== 'cancelled').reduce((s: number, o: any) => s + (o.total_cost || 0), 0)
  const prevActiveOrders = prevOrders.filter((o: any) => o.status === 'pending' || o.status === 'in_progress').length
  const prevNewClients = clients?.filter((c: any) => isDateInRange(c.created_at, prevStart, prevEnd)).length || 0
  const prevExpenses = transactions?.filter((t: any) => t.type === 'expense' && isDateInRange(t.date, prevStart, prevEnd)).reduce((s: number, t: any) => s + t.amount, 0) || 0

  const revenueChange = calcChange(periodRevenue, prevRevenue)
  const expensesChange = calcChange(periodExpenses, prevExpenses)
  const activeOrdersChange = calcChange(periodActiveOrders, prevActiveOrders)
  const clientsChange = calcChange(periodNewClients, prevNewClients)

  const statusCounts: Record<string, number> = {}
  orders?.forEach((o: any) => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1
  })
  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    name: statusLabels[status] || status,
    value: count,
    color: statusColors[status] || '#9ca3af',
  }))

  const dailyMap: Record<string, { revenue: number; expenses: number }> = {}
  // Revenue from orders by scheduled date
  orders?.forEach((o: any) => {
    if (o.status === 'cancelled') return
    const d = new Date(o.scheduled_date || o.created_at)
    const key = d.toLocaleDateString('ru-RU', { weekday: 'short' })
    if (!dailyMap[key]) dailyMap[key] = { revenue: 0, expenses: 0 }
    dailyMap[key].revenue += o.total_cost || 0
  })
  // Expenses from transactions
  transactions?.forEach((t: any) => {
    const d = new Date(t.date)
    const key = d.toLocaleDateString('ru-RU', { weekday: 'short' })
    if (!dailyMap[key]) dailyMap[key] = { revenue: 0, expenses: 0 }
    if (t.type === 'expense') dailyMap[key].expenses += t.amount
  })
  const dailyRevenueData = Object.entries(dailyMap).map(([day, vals]) => ({ day, ...vals }))

  const avgVisits = clients ? (clients.reduce((sum: number, c: any) => sum + c.total_visits, 0) / clients.length).toFixed(1) : '0'
  const avgRevenue = clients ? (clients.reduce((sum: number, c: any) => sum + c.total_revenue, 0) / clients.length).toFixed(0) : '0'

  const sources = sourcesData?.items || []
  const sourcesTotalRevenue = sourcesData?.total_revenue || 0
  const sourcesTotalOrders = sourcesData?.total_orders || 0
  const sourcesTotalClients = sourcesData?.total_clients || 0

  const rfmSegments = [
    { key: 'champions', label: 'Чемпионы', color: '#10b981', desc: 'Частые, новые, высокий чек' },
    { key: 'loyal', label: 'Лояльные', color: '#3b82f6', desc: 'Регулярные клиенты' },
    { key: 'potential', label: 'Потенциал', color: '#8b5cf6', desc: 'Новые с высоким чеком' },
    { key: 'new', label: 'Новые', color: '#06b6d4', desc: 'Недавно пришли' },
    { key: 'at_risk', label: 'В зоне риска', color: '#f59e0b', desc: 'Не были давно' },
    { key: 'lost', label: 'Потерянные', color: '#ef4444', desc: 'Давно не посещали' },
  ]

  const rfmChartData = rfmSegments.map(s => ({
    segment: s.label,
    count: rfmData?.[s.key] || 0,
    color: s.color,
    desc: s.desc,
  }))

  const cohorts = retentionData?.cohorts || []
  const revenueItems = revenueData?.items || []
  const revenueTotal = revenueData?.total_revenue || 0

  const toggleSort = (field: SortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const SortHeader = ({ field, children }: { field: SortBy; children: React.ReactNode }) => (
    <button
      onClick={() => toggleSort(field)}
      className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
    >
      {children}
      <ArrowUpDown className="w-3 h-3" />
    </button>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Дашборд</h2>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={(s, e) => { setStartDate(s); setEndDate(e) }}
        />
      </div>

      {/* Main Tabs: Overview / Analytics */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 items-center">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Обзор
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'analytics'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Аналитика
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Выручка</span>
                <div className={`flex items-center gap-1 text-xs ${revenueChange.isPositive === true ? 'text-emerald-600' : revenueChange.isPositive === false ? 'text-red-600' : 'text-gray-500'}`}>
                  {revenueChange.isPositive === true ? <ArrowUpRight className="w-3 h-3" /> : revenueChange.isPositive === false ? <ArrowDownRight className="w-3 h-3" /> : <span className="w-3 h-3" />}
                  {revenueChange.value}
                </div>
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{periodRevenue.toLocaleString()} ₽</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Расходы</span>
                <div className={`flex items-center gap-1 text-xs ${expensesChange.isPositive === true ? 'text-emerald-600' : expensesChange.isPositive === false ? 'text-red-600' : 'text-gray-500'}`}>
                  {expensesChange.isPositive === true ? <ArrowUpRight className="w-3 h-3" /> : expensesChange.isPositive === false ? <ArrowDownRight className="w-3 h-3" /> : <span className="w-3 h-3" />}
                  {expensesChange.value}
                </div>
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{periodExpenses.toLocaleString()} ₽</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">В работе</span>
                <div className={`flex items-center gap-1 text-xs ${activeOrdersChange.isPositive === true ? 'text-emerald-600' : activeOrdersChange.isPositive === false ? 'text-red-600' : 'text-gray-500'}`}>
                  {activeOrdersChange.isPositive === true ? <ArrowUpRight className="w-3 h-3" /> : activeOrdersChange.isPositive === false ? <ArrowDownRight className="w-3 h-3" /> : <span className="w-3 h-3" />}
                  {activeOrdersChange.value}
                </div>
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{periodActiveOrders}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Клиентов</span>
                <div className={`flex items-center gap-1 text-xs ${clientsChange.isPositive === true ? 'text-emerald-600' : clientsChange.isPositive === false ? 'text-red-600' : 'text-gray-500'}`}>
                  {clientsChange.isPositive === true ? <ArrowUpRight className="w-3 h-3" /> : clientsChange.isPositive === false ? <ArrowDownRight className="w-3 h-3" /> : <span className="w-3 h-3" />}
                  {clientsChange.value}
                </div>
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{periodNewClients}</div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Выручка и расходы</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dailyRevenueData.length ? dailyRevenueData : [{ day: '—', revenue: 0, expenses: 0 }]}>
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
                    data={statusData.length ? statusData : [{ name: 'Нет данных', value: 1, color: '#9ca3af' }]}
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
              {activityData?.items?.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <Wrench className={`w-4 h-4 flex-shrink-0 ${
                    item.status === 'completed' ? 'text-emerald-500' :
                    item.status === 'in_progress' ? 'text-blue-500' :
                    item.status === 'cancelled' ? 'text-red-500' : 'text-amber-500'
                  }`} />
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                    {item.client_name} — {item.service_name} ({item.status === 'completed' ? 'завершено' : item.status === 'in_progress' ? 'в работе' : item.status === 'cancelled' ? 'отменено' : 'ожидает'})
                  </span>
                  <span className="text-xs text-gray-400">{item.total_cost?.toLocaleString()} ₽</span>
                </div>
              )) || (
                <div className="px-5 py-3 text-sm text-gray-500">Нет данных</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <>
          {/* Analytics Sub-tabs */}
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
            {[
              { key: 'sources', label: 'Источники', icon: BarChart3 },
              { key: 'rfm', label: 'RFM-сегменты', icon: Users },
              { key: 'retention', label: 'Удержание', icon: Repeat },
              { key: 'revenue', label: 'Выручка', icon: BarChart3 },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setAnalyticsSubTab(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  analyticsSubTab === tab.key
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Analytics KPI Cards */}
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

          {/* SOURCES SUB-TAB */}
          {analyticsSubTab === 'sources' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Всего выручки</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{sourcesTotalRevenue.toLocaleString()} ₽</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Всего заказов</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{sourcesTotalOrders}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Уникальных клиентов</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{sourcesTotalClients}</div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Источники клиентов</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700/50">
                        <th className="text-left px-5 py-3">
                          <SortHeader field="source">Источник</SortHeader>
                        </th>
                        <th className="text-right px-5 py-3">
                          <SortHeader field="orders">Заказы</SortHeader>
                        </th>
                        <th className="text-right px-5 py-3">
                          <SortHeader field="clients">Клиенты</SortHeader>
                        </th>
                        <th className="text-right px-5 py-3">
                          <SortHeader field="revenue">Выручка</SortHeader>
                        </th>
                        <th className="text-right px-5 py-3">Доля</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {sources.map((s: any) => {
                        const share = sourcesTotalRevenue > 0 ? Math.round((s.revenue / sourcesTotalRevenue) * 100) : 0
                        return (
                          <tr key={s.source} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                            <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{s.source_label}</td>
                            <td className="px-5 py-3 text-right text-gray-700 dark:text-gray-300">{s.orders}</td>
                            <td className="px-5 py-3 text-right text-gray-700 dark:text-gray-300">{s.clients}</td>
                            <td className="px-5 py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                              {s.revenue.toLocaleString()} ₽
                            </td>
                            <td className="px-5 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">{share}%</span>
                                <div className="w-16 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary-500 rounded-full"
                                    style={{ width: `${share}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                      {sources.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                            Нет данных за выбранный период
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {sources.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Выручка по источникам</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={sources}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                      <XAxis dataKey="source_label" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                        formatter={(value: number) => [`${value.toLocaleString()} ₽`, 'Выручка']}
                      />
                      <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* RFM SUB-TAB */}
          {analyticsSubTab === 'rfm' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Распределение сегментов</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={rfmChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="count"
                    >
                      {rfmChartData.map((entry, index) => (
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
                  {rfmChartData.map((c) => (
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
                  {rfmChartData.map((segment) => (
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

          {/* RETENTION SUB-TAB */}
          {analyticsSubTab === 'retention' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Когортный анализ удержания</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={cohorts}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                    <XAxis dataKey="cohort" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} unit="%" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                      formatter={(value: number) => [`${value}%`, '']}
                    />
                    <Line type="monotone" dataKey="return_1m" stroke="#3b82f6" strokeWidth={2} name="1 мес." />
                    <Line type="monotone" dataKey="return_3m" stroke="#8b5cf6" strokeWidth={2} name="3 мес." />
                    <Line type="monotone" dataKey="return_6m" stroke="#f59e0b" strokeWidth={2} name="6 мес." />
                    <Line type="monotone" dataKey="return_12m" stroke="#10b981" strokeWidth={2} name="12 мес." />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* REVENUE SUB-TAB */}
          {analyticsSubTab === 'revenue' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Выручка по типам услуг</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={revenueItems} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                    <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
                    <YAxis dataKey="service_name" type="category" tick={{ fill: '#9ca3af', fontSize: 12 }} width={120} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                      formatter={(value: number) => [`${value.toLocaleString()} ₽`, 'Выручка']}
                    />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Топ услуг по выручке</h3>
                <div className="space-y-3">
                  {revenueItems.slice(0, 5).map((item: any, i: number) => (
                    <div key={item.service_name} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                      <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-sm font-bold text-primary-700 dark:text-primary-300">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{item.service_name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{item.orders} заказов</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{item.revenue.toLocaleString()} ₽</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {revenueTotal > 0 ? Math.round((item.revenue / revenueTotal) * 100) : 0}% от общей
                        </div>
                      </div>
                    </div>
                  ))}
                  {revenueItems.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      Нет данных за выбранный период
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
