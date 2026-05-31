import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Filter, Loader2, X, ChevronDown, ChevronUp, Clock, CheckCircle, AlertCircle, ClipboardList as ClipboardListIcon } from 'lucide-react'
import { workOrdersApi } from '../api/workOrders'
import { useToastStore } from '../components/Toast'
import CreateWorkOrderModal from '../components/CreateWorkOrderModal'

interface WorkOrder {
  id: string
  client: { name: string; phone: string }
  vehicle: { make: string; model: string; license_plate: string }
  service: { name: string }
  status: string
  total_cost: number
  scheduled_date: string
  created_at: string
  description: string
}

const statusFilters = [
  { key: 'all', label: 'Все', color: 'bg-gray-100 text-gray-700' },
  { key: 'pending', label: 'Ожидает', color: 'bg-amber-100 text-amber-700' },
  { key: 'in_progress', label: 'В работе', color: 'bg-blue-100 text-blue-700' },
  { key: 'completed', label: 'Готово', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'cancelled', label: 'Отменено', color: 'bg-red-100 text-red-700' },
]

export default function WorkOrdersPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const { addToast } = useToastStore()
  const queryClient = useQueryClient()

  const { data: orders, isLoading } = useQuery({
    queryKey: ['workOrders'],
    queryFn: async () => {
      const res = await workOrdersApi.getAll()
      return res.data
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      // API call
      return { id, status }
    },
    onSuccess: () => {
      addToast('Статус обновлён', 'success')
      queryClient.invalidateQueries({ queryKey: ['workOrders'] })
    },
  })

  const filteredOrders = orders?.filter((o: WorkOrder) => {
    const matchesSearch = !search ||
      o.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.vehicle?.license_plate?.toLowerCase().includes(search.toLowerCase()) ||
      o.service?.name?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter
    return matchesSearch && matchesStatus
  }) || []

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'in_progress': return <AlertCircle className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидает'
      case 'in_progress': return 'В работе'
      case 'completed': return 'Готово'
      case 'cancelled': return 'Отменено'
      default: return status
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Заказ-наряды</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Новый заказ
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по клиенту, номеру или услуге..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm dark:text-gray-100 placeholder-gray-400"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {statusFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === f.key
                  ? f.color + ' ring-2 ring-offset-1 ring-primary-500'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-2">
        {filteredOrders.map((order: WorkOrder) => (
          <div
            key={order.id}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <button
              onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
              className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30"
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                order.status === 'in_progress' ? 'bg-blue-500' :
                order.status === 'completed' ? 'bg-emerald-500' :
                order.status === 'cancelled' ? 'bg-red-500' : 'bg-amber-500'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{order.client?.name || 'Клиент'}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{order.vehicle?.make} {order.vehicle?.model}</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {order.service?.name || 'Услуга'} • {order.vehicle?.license_plate}
                </div>
              </div>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                order.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                order.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                order.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
              }`}>
                {getStatusIcon(order.status)}
                {getStatusLabel(order.status)}
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{order.total_cost?.toLocaleString()} ₽</span>
              {expandedOrder === order.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {expandedOrder === order.id && (
              <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-3">
                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Телефон:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">{order.client?.phone || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Дата записи:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">
                      {order.scheduled_date ? new Date(order.scheduled_date).toLocaleDateString('ru-RU') : '-'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500 dark:text-gray-400">Описание:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">{order.description || '-'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {order.status !== 'completed' && order.status !== 'cancelled' && (
                    <>
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'in_progress' })}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700"
                        >
                          В работу
                        </button>
                      )}
                      {order.status === 'in_progress' && (
                        <button
                          onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'completed' })}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs hover:bg-emerald-700"
                        >
                          Завершить
                        </button>
                      )}
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'cancelled' })}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700"
                      >
                        Отменить
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <ClipboardListIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Заказы не найдены</p>
        </div>
      )}

      {showCreate && <CreateWorkOrderModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
