import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, Clock, Wrench, Loader2 } from 'lucide-react'
import { workOrdersApi } from '../api/workOrders'
import CreateWorkOrderModal from '../components/CreateWorkOrderModal'

const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00']

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showCreate, setShowCreate] = useState(false)

  const { data: orders, isLoading } = useQuery({
    queryKey: ['workOrders'],
    queryFn: async () => {
      const res = await workOrdersApi.getAll()
      return res.data
    },
  })

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  const getOrdersForSlot = (time: string) => {
    if (!orders) return []
    return orders.filter((o: any) => {
      if (!o.scheduled_date) return false
      const orderDate = new Date(o.scheduled_date)
      const slotDate = new Date(currentDate)
      return orderDate.toDateString() === slotDate.toDateString()
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200'
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200'
      case 'completed': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200'
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200'
      default: return 'bg-gray-100 text-gray-800'
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Расписание</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Новая запись
        </button>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setCurrentDate(new Date(currentDate.getTime() - 86400000))}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">{formatDate(currentDate)}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{orders?.filter((o: any) => {
            if (!o.scheduled_date) return false
            return new Date(o.scheduled_date).toDateString() === currentDate.toDateString()
          }).length || 0} записей</div>
        </div>
        <button
          onClick={() => setCurrentDate(new Date(currentDate.getTime() + 86400000))}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Time Slots */}
      <div className="space-y-2">
        {timeSlots.map((time) => {
          const slotOrders = getOrdersForSlot(time)
          return (
            <div key={time} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{time}</span>
                <span className="text-xs text-gray-400">{slotOrders.length} записей</span>
              </div>
              {slotOrders.length > 0 && (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {slotOrders.map((order: any) => (
                    <div key={order.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <div className={`w-2 h-2 rounded-full ${
                        order.status === 'in_progress' ? 'bg-blue-500' :
                        order.status === 'completed' ? 'bg-emerald-500' :
                        order.status === 'cancelled' ? 'bg-red-500' : 'bg-amber-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {order.client?.name || 'Клиент'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {order.vehicle?.make} {order.vehicle?.model} • {order.service?.name || 'Услуга'}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {order.status === 'pending' ? 'Ожидает' :
                         order.status === 'in_progress' ? 'В работе' :
                         order.status === 'completed' ? 'Готово' : 'Отменено'}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{order.total_cost?.toLocaleString()} ₽</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showCreate && <CreateWorkOrderModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
