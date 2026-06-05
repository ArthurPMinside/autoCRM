import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Loader2, X, ChevronDown, ChevronUp, Clock, CheckCircle, AlertCircle, ClipboardList as ClipboardListIcon, MessageSquare, Printer, User, Trash2 } from 'lucide-react'
import { workOrdersApi } from '../api/workOrders'
import { staffApi } from '../api/staff'
import { smsApi } from '../api/sms'
import { receiptsApi } from '../api/receipts'
import { useToastStore } from '../components/Toast'
import CreateWorkOrderModal from '../components/CreateWorkOrderModal'
import ReceiptModal from '../components/ReceiptModal'

interface WorkOrder {
  id: string
  client: { name: string; phone: string }
  vehicle: { make: string; model: string; license_plate: string }
  service: { name: string }
  staff_id?: string
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
  const [showReceipt, setShowReceipt] = useState<WorkOrder | null>(null)
  const { addToast } = useToastStore()
  const queryClient = useQueryClient()

  const { data: orders, isLoading } = useQuery({
    queryKey: ['workOrders'],
    queryFn: async () => {
      const res = await workOrdersApi.getAll()
      return res.data
    },
  })

  const { data: staff } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const res = await staffApi.getAll()
      return res.data
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return workOrdersApi.updateStatus(id, status)
    },
    onSuccess: () => {
      addToast('Статус обновлён', 'success')
      queryClient.invalidateQueries({ queryKey: ['workOrders'] })
    },
  })

  const assignStaffMutation = useMutation({
    mutationFn: async ({ id, staff_id }: { id: string; staff_id: string }) => {
      return workOrdersApi.update(id, { staff_id })
    },
    onSuccess: () => {
      addToast('Механик назначен', 'success')
      queryClient.invalidateQueries({ queryKey: ['workOrders'] })
    },
  })

  const sendSmsMutation = useMutation({
    mutationFn: async ({ phone, message }: { phone: string; message: string }) => {
      return smsApi.send({ phone, message })
    },
    onSuccess: () => {
      addToast('SMS отправлено', 'success')
    },
    onError: () => {
      addToast('Ошибка отправки SMS', 'error')
    },
  })

  const createReceiptMutation = useMutation({
    mutationFn: async (work_order_id: string) => {
      return receiptsApi.create({ work_order_id })
    },
    onSuccess: () => {
      addToast('Чек создан', 'success')
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

  const getStaffName = (staffId?: string) => {
    if (!staffId) return 'Не назначен'
    const s = staff?.find((m: any) => m.id === staffId)
    return s?.name || 'Не назначен'
  }

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
              <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-3 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Телефон:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">{order.client?.phone || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Плановая дата готовности:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">
                      {order.scheduled_date ? new Date(order.scheduled_date).toLocaleDateString('ru-RU') : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Дата и время записи:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString('ru-RU') : '-'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500 dark:text-gray-400">Механик:</span>
                    <select
                      value={order.staff_id || ''}
                      onChange={(e) => assignStaffMutation.mutate({ id: order.id, staff_id: e.target.value })}
                      className="ml-2 px-2 py-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm dark:text-gray-100"
                    >
                      <option value="">Не назначен</option>
                      {staff?.filter((s: any) => s.role === 'mechanic').map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500 dark:text-gray-400">Описание:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">{order.description || '-'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
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
                  <button
                    onClick={() => {
                      if (confirm('Удалить заказ-наряд?')) {
                        workOrdersApi.delete(order.id).then(() => {
                          addToast('Заказ удален', 'success')
                          queryClient.invalidateQueries({ queryKey: ['workOrders'] })
                        }).catch(() => {
                          addToast('Ошибка при удалении заказа', 'error')
                        })
                      }
                    }}
                    className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs hover:bg-red-100 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Удалить
                  </button>
                  <button
                    onClick={() => sendSmsMutation.mutate({
                      phone: order.client?.phone,
                      message: `Здравствуйте, ${order.client?.name}! Ваш заказ на ${order.service?.name} ${order.status === 'completed' ? 'готов' : 'в работе'}. Сумма: ${order.total_cost?.toLocaleString()} ₽`
                    })}
                    className="px-3 py-1.5 bg-sky-600 text-white rounded-lg text-xs hover:bg-sky-700 flex items-center gap-1"
                  >
                    <MessageSquare className="w-3 h-3" />
                    SMS
                  </button>
                  {order.status === 'completed' && (
                    <button
                      onClick={() => setShowReceipt(order)}
                      className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-xs hover:bg-gray-700 flex items-center gap-1"
                    >
                      <Printer className="w-3 h-3" />
                      Чек
                    </button>
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
      {showReceipt && <ReceiptModal order={showReceipt} onClose={() => setShowReceipt(null)} />}
    </div>
  )
}
