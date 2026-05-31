import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Loader2, MessageSquare, User, Car, Wrench } from 'lucide-react'
import { workOrdersApi } from '../api/workOrders'
import { staffApi } from '../api/staff'
import { servicesApi } from '../api/services'
import { clientsApi } from '../api/clients'
import { vehiclesApi } from '../api/vehicles'
import { smsApi } from '../api/sms'
import { useToastStore } from './Toast'

interface Props {
  order: any
  onClose: () => void
}

export default function EditWorkOrderModal({ order, onClose }: Props) {
  const { addToast } = useToastStore()
  const queryClient = useQueryClient()

  const [status, setStatus] = useState(order.status)
  const [staffId, setStaffId] = useState(order.staff_id || '')
  const [serviceId, setServiceId] = useState(order.service?.id || '')
  const [clientId, setClientId] = useState(order.client?.id || '')
  const [vehicleId, setVehicleId] = useState(order.vehicle?.id || '')
  const [scheduledDate, setScheduledDate] = useState('')
  const [description, setDescription] = useState(order.description || '')
  const [totalCost, setTotalCost] = useState(order.total_cost || 0)

  const { data: staff } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const res = await staffApi.getAll()
      return res.data
    },
  })

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await servicesApi.getAll()
      return res.data
    },
  })

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await clientsApi.getAll()
      return res.data
    },
  })

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await vehiclesApi.getAll()
      return res.data
    },
  })

  useEffect(() => {
    if (order.scheduled_date) {
      // Parse as UTC (server returns +00:00 or Z)
      const d = new Date(order.scheduled_date)
      // Format for datetime-local input: YYYY-MM-DDTHH:mm (local time)
      const pad = (n: number) => n.toString().padStart(2, '0')
      setScheduledDate(
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
      )
    } else {
      setScheduledDate('')
    }
  }, [order])

  // Update total cost when service changes
  useEffect(() => {
    if (serviceId && services) {
      const selectedService = services.find((s: any) => s.id === serviceId)
      if (selectedService) {
        setTotalCost(selectedService.price || 0)
      }
    }
  }, [serviceId, services])

  const updateMutation = useMutation({
    mutationFn: (data: any) => workOrdersApi.update(order.id, data),
    onSuccess: () => {
      addToast('Заказ обновлён', 'success')
      queryClient.invalidateQueries({ queryKey: ['workOrders'] })
      onClose()
    },
    onError: () => addToast('Ошибка при обновлении', 'error'),
  })

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: string) => workOrdersApi.updateStatus(order.id, newStatus),
    onSuccess: () => {
      addToast('Статус обновлён', 'success')
      queryClient.invalidateQueries({ queryKey: ['workOrders'] })
    },
    onError: () => addToast('Ошибка при обновлении статуса', 'error'),
  })

  const sendSmsMutation = useMutation({
    mutationFn: () => smsApi.send({
      phone: order.client?.phone,
      message: `Здравствуйте, ${order.client?.name}! Ваш заказ на ${order.service?.name} — статус: ${getStatusLabel(status)}. Сумма: ${totalCost.toLocaleString()} ₽`,
    }),
    onSuccess: () => addToast('SMS отправлено', 'success'),
    onError: () => addToast('Ошибка отправки SMS', 'error'),
  })

  const handleSave = () => {
    const data: any = {}
    if (clientId && clientId !== order.client?.id) data.client_id = clientId
    if (vehicleId && vehicleId !== order.vehicle?.id) data.vehicle_id = vehicleId
    if (serviceId && serviceId !== order.service?.id) data.service_id = serviceId
    if (staffId !== (order.staff_id || '')) data.staff_id = staffId || null
    if (scheduledDate) {
      data.scheduled_date = new Date(scheduledDate).toISOString()
    }
    if (description !== order.description) data.description = description
    if (status !== order.status) data.status = status

    if (Object.keys(data).length > 0) {
      updateMutation.mutate(data)
    } else {
      onClose()
    }
  }

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'pending': return 'Ожидает'
      case 'in_progress': return 'В работе'
      case 'completed': return 'Готово'
      case 'cancelled': return 'Отменено'
      default: return s
    }
  }

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
      case 'in_progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      case 'completed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
      case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  // Filter vehicles by selected client
  const filteredVehicles = vehicles?.filter((v: any) => v.client_id === clientId) || []

  // Get current client and vehicle names for display
  const selectedClient = clients?.find((c: any) => c.id === clientId)
  const selectedVehicle = vehicles?.find((v: any) => v.id === vehicleId)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg max-h-[85vh] overflow-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Заказ-наряд</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Client */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                Клиент
              </span>
            </label>
            <select
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value)
                setVehicleId('') // Reset vehicle when client changes
              }}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100"
            >
              <option value="">Выберите клиента</option>
              {clients?.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
              ))}
            </select>
          </div>

          {/* Vehicle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <span className="flex items-center gap-1">
                <Car className="w-3.5 h-3.5" />
                Автомобиль
              </span>
            </label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              disabled={!clientId}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 disabled:opacity-50"
            >
              <option value="">Выберите автомобиль</option>
              {filteredVehicles.map((v: any) => (
                <option key={v.id} value={v.id}>{v.make} {v.model} — {v.license_plate}</option>
              ))}
            </select>
          </div>

          {/* Service */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <span className="flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5" />
                Услуга
              </span>
            </label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100"
            >
              <option value="">Выберите услугу</option>
              {services?.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name} — {s.price?.toLocaleString()} ₽ ({s.duration}ч)</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Статус</label>
            <div className="flex gap-2 flex-wrap">
              {['pending', 'in_progress', 'completed', 'cancelled'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    status === s ? getStatusColor(s) + ' ring-2 ring-offset-1 ring-primary-500' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {getStatusLabel(s)}
                </button>
              ))}
            </div>
          </div>

          {/* Staff */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                Механик
              </span>
            </label>
            <select
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100"
            >
              <option value="">Не назначен</option>
              {staff?.filter((s: any) => s.role === 'mechanic').map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Scheduled date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Дата и время записи</label>
            <input
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Описание проблемы</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100"
              rows={3}
            />
          </div>

          {/* Total */}
          <div className="flex items-center justify-between p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <span className="text-sm text-primary-700 dark:text-primary-300">Сумма:</span>
            <span className="text-lg font-bold text-primary-800 dark:text-primary-200">{totalCost.toLocaleString()} ₽</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2"
            >
              {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Сохранить
            </button>
            <button
              onClick={() => sendSmsMutation.mutate()}
              disabled={sendSmsMutation.isPending}
              className="px-4 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              SMS
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
