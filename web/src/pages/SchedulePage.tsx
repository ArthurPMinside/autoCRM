import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, Clock, Loader2, User } from 'lucide-react'
import { workOrdersApi } from '../api/workOrders'
import { staffApi } from '../api/staff'
import CreateWorkOrderModal from '../components/CreateWorkOrderModal'

const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00']

const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function formatWeekRange(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6)
  const startStr = weekStart.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  const endStr = weekEnd.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  return `${startStr} — ${endStr}`
}

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showCreate, setShowCreate] = useState(false)

  const weekStart = getWeekStart(currentDate)

  const { data: orders, isLoading: ordersLoading } = useQuery({
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

  const getStaffName = (staffId?: string) => {
    if (!staffId) return null
    const s = staff?.find((m: any) => m.id === staffId)
    return s?.name?.split(' ')[0] || null
  }

  const getOrdersForSlot = (dayIndex: number, time: string): any[] => {
    if (!orders) return []
    const slotDate = addDays(weekStart, dayIndex)
    const [slotHour] = time.split(':').map(Number)

    return orders.filter((o: any) => {
      if (!o.scheduled_date) return false
      const orderDate = new Date(o.scheduled_date)
      if (!isSameDay(orderDate, slotDate)) return false
      const orderHour = orderDate.getHours()
      return orderHour === slotHour || (orderHour === slotHour - 1 && orderDate.getMinutes() >= 30)
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

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-blue-500'
      case 'completed': return 'bg-emerald-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-amber-500'
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

  if (ordersLoading) {
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

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setCurrentDate(addDays(currentDate, -7))}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{formatWeekRange(weekStart)}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {orders?.filter((o: any) => {
              if (!o.scheduled_date) return false
              const d = new Date(o.scheduled_date)
              return d >= weekStart && d < addDays(weekStart, 7)
            }).length || 0} записей на неделе
          </div>
        </div>
        <button
          onClick={() => setCurrentDate(addDays(currentDate, 7))}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Week Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hidden md:block">
        {/* Day Headers */}
        <div className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700">
          <div className="p-3 text-xs font-medium text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
            Время
          </div>
          {Array.from({ length: 7 }, (_, i) => {
            const dayDate = addDays(weekStart, i)
            const isToday = isSameDay(dayDate, new Date())
            return (
              <div
                key={i}
                className={`p-3 text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0 ${
                  isToday ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-gray-50 dark:bg-gray-700/30'
                }`}
              >
                <div className={`text-xs font-medium ${isToday ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {weekDays[i]}
                </div>
                <div className={`text-sm font-semibold ${isToday ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-gray-100'}`}>
                  {dayDate.getDate()}
                </div>
              </div>
            )
          })}
        </div>

        {/* Time Slots */}
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {timeSlots.map((time) => (
            <div key={time} className="grid grid-cols-8 min-h-[80px]">
              <div className="p-2 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex items-start justify-center pt-3">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{time}</span>
              </div>
              {Array.from({ length: 7 }, (_, dayIndex) => {
                const slotOrders = getOrdersForSlot(dayIndex, time)
                return (
                  <div
                    key={dayIndex}
                    className="p-1.5 border-r border-gray-200 dark:border-gray-700 last:border-r-0 min-h-[80px]"
                  >
                    {slotOrders.map((order: any) => (
                      <div
                        key={order.id}
                        className={`mb-1 p-2 rounded-lg border text-xs cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(order.status)}`}
                      >
                        <div className="flex items-center gap-1 mb-0.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${getStatusDot(order.status)}`} />
                          <span className="font-medium truncate">{order.client?.name?.split(' ')[0] || 'Клиент'}</span>
                        </div>
                        <div className="truncate text-[10px] opacity-80">
                          {order.vehicle?.make} {order.vehicle?.model}
                        </div>
                        {getStaffName(order.staff_id) && (
                          <div className="flex items-center gap-0.5 text-[9px] opacity-60 mt-0.5">
                            <User className="w-2 h-2" />
                            {getStaffName(order.staff_id)}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] font-medium">{order.total_cost?.toLocaleString()} ₽</span>
                          <span className="text-[9px] px-1 py-0.5 rounded bg-white/50 dark:bg-black/20">
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: List view */}
      <div className="md:hidden space-y-2">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {currentDate.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
        </h3>
        {timeSlots.map((time) => {
          const dayIndex = currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1
          const slotOrders = getOrdersForSlot(dayIndex, time)
          if (slotOrders.length === 0) return null
          return (
            <div key={time} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{time}</span>
              </div>
              {slotOrders.map((order: any) => (
                <div key={order.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                  <div className={`w-2 h-2 rounded-full ${getStatusDot(order.status)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{order.client?.name || 'Клиент'}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {order.vehicle?.make} {order.vehicle?.model} • {order.service?.name}
                    </div>
                    {getStaffName(order.staff_id) && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {getStaffName(order.staff_id)}
                      </div>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{order.total_cost?.toLocaleString()} ₽</span>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {showCreate && <CreateWorkOrderModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
