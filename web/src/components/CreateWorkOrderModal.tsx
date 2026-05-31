import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Loader2, User, Car, Wrench, Search, Plus, Megaphone } from 'lucide-react'
import { workOrdersApi } from '../api/workOrders'
import { clientsApi } from '../api/clients'
import { vehiclesApi } from '../api/vehicles'
import { servicesApi } from '../api/services'
import { useToastStore } from './Toast'

interface Props {
  onClose: () => void
  initialDate?: string
}

export default function CreateWorkOrderModal({ onClose, initialDate }: Props) {
  const { addToast } = useToastStore()
  const queryClient = useQueryClient()

  const [clientId, setClientId] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [description, setDescription] = useState('')
  const [scheduledDate, setScheduledDate] = useState(initialDate || '')
  const [source, setSource] = useState('direct')
  const [searchClient, setSearchClient] = useState('')
  const [showNewClient, setShowNewClient] = useState(false)
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '' })
  const [showNewVehicle, setShowNewVehicle] = useState(false)
  const [newVehicle, setNewVehicle] = useState({ make: '', model: '', year: '', license_plate: '', vin: '' })

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

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await servicesApi.getAll()
      return res.data
    },
  })

  const createClientMutation = useMutation({
    mutationFn: clientsApi.create,
    onSuccess: (res) => {
      setClientId(res.data.id)
      setShowNewClient(false)
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      addToast('Клиент создан', 'success')
    },
  })

  const createVehicleMutation = useMutation({
    mutationFn: vehiclesApi.create,
    onSuccess: (res) => {
      setVehicleId(res.data.id)
      setShowNewVehicle(false)
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      addToast('Авто добавлено', 'success')
    },
  })

  const createOrderMutation = useMutation({
    mutationFn: workOrdersApi.create,
    onSuccess: () => {
      addToast('Заказ-наряд создан', 'success')
      queryClient.invalidateQueries({ queryKey: ['workOrders'] })
      onClose()
    },
    onError: () => {
      addToast('Ошибка при создании', 'error')
    },
  })

  const filteredClients = useMemo(() => {
    if (!clients) return []
    if (!searchClient.trim()) return clients
    return clients.filter((c: any) =>
      c.name.toLowerCase().includes(searchClient.toLowerCase()) ||
      c.phone.includes(searchClient)
    )
  }, [clients, searchClient])

  const selectedClient = clients?.find((c: any) => c.id === clientId)
  const filteredVehicles = vehicles?.filter((v: any) => v.client_id === clientId) || []
  const selectedVehicle = vehicles?.find((v: any) => v.id === vehicleId)
  const selectedService = services?.find((s: any) => s.id === serviceId)

  const totalCost = selectedService?.price || 0

  const handleSubmit = () => {
    if (!clientId || !vehicleId || !serviceId) return
    createOrderMutation.mutate({
      client_id: clientId,
      vehicle_id: vehicleId,
      service_id: serviceId,
      description,
      scheduled_date: scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
      status: 'pending',
      source,
    })
  }

  const canSubmit = clientId && vehicleId && serviceId

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg max-h-[85vh] overflow-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Новый заказ-наряд</h3>
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
            {!showNewClient ? (
              <>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Поиск клиента..."
                    value={searchClient}
                    onChange={(e) => setSearchClient(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100"
                  />
                </div>
                <select
                  value={clientId}
                  onChange={(e) => {
                    setClientId(e.target.value)
                    setVehicleId('')
                  }}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100"
                >
                  <option value="">Выберите клиента</option>
                  {filteredClients.map((client: any) => (
                    <option key={client.id} value={client.id}>{client.name} — {client.phone}</option>
                  ))}
                </select>
                <button
                  onClick={() => setShowNewClient(true)}
                  className="mt-2 w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:border-primary-400 hover:text-primary-600"
                >
                  <Plus className="w-4 h-4" />
                  Новый клиент
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Новый клиент</h4>
                <input
                  placeholder="ФИО *"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100"
                />
                <input
                  placeholder="Телефон *"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100"
                />
                <div className="flex gap-2">
                  <button onClick={() => setShowNewClient(false)} className="flex-1 py-2 text-sm text-gray-600">Отмена</button>
                  <button
                    onClick={() => createClientMutation.mutate(newClient)}
                    disabled={!newClient.name || !newClient.phone}
                    className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm disabled:opacity-50"
                  >
                    {createClientMutation.isPending ? 'Создание...' : 'Создать'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Vehicle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <span className="flex items-center gap-1">
                <Car className="w-3.5 h-3.5" />
                Автомобиль
              </span>
            </label>
            {!showNewVehicle ? (
              <>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  disabled={!clientId}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100 disabled:opacity-50"
                >
                  <option value="">Выберите автомобиль</option>
                  {filteredVehicles.map((vehicle: any) => (
                    <option key={vehicle.id} value={vehicle.id}>{vehicle.make} {vehicle.model} — {vehicle.license_plate}</option>
                  ))}
                </select>
                {clientId && (
                  <button
                    onClick={() => setShowNewVehicle(true)}
                    className="mt-2 w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:border-primary-400 hover:text-primary-600"
                  >
                    <Plus className="w-4 h-4" />
                    Добавить авто
                  </button>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Новое авто ({selectedClient?.name})</h4>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Марка *" value={newVehicle.make} onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100" />
                  <input placeholder="Модель *" value={newVehicle.model} onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Год" value={newVehicle.year} onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100" />
                  <input placeholder="Гос. номер *" value={newVehicle.license_plate} onChange={(e) => setNewVehicle({ ...newVehicle, license_plate: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100" />
                </div>
                <input placeholder="VIN" value={newVehicle.vin} onChange={(e) => setNewVehicle({ ...newVehicle, vin: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100" />
                <div className="flex gap-2">
                  <button onClick={() => setShowNewVehicle(false)} className="flex-1 py-2 text-sm text-gray-600">Отмена</button>
                  <button
                    onClick={() => createVehicleMutation.mutate({ ...newVehicle, client_id: clientId, year: Number(newVehicle.year) || new Date().getFullYear() })}
                    disabled={!newVehicle.make || !newVehicle.model || !newVehicle.license_plate}
                    className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm disabled:opacity-50"
                  >
                    {createVehicleMutation.isPending ? 'Создание...' : 'Добавить'}
                  </button>
                </div>
              </div>
            )}
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
              {services?.map((service: any) => (
                <option key={service.id} value={service.id}>{service.name} — {service.price?.toLocaleString()} ₽ ({service.duration}ч)</option>
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

          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <span className="flex items-center gap-1">
                <Megaphone className="w-3.5 h-3.5" />
                Источник
              </span>
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100"
            >
              <option value="direct">Прямое обращение</option>
              <option value="repeat">Повторный визит</option>
              <option value="yandex">Яндекс</option>
              <option value="google">Google</option>
              <option value="avito">Авито</option>
              <option value="instagram">Instagram</option>
              <option value="telegram">Telegram</option>
              <option value="referral">Рекомендация</option>
              <option value="other">Другое</option>
            </select>
            {source === 'repeat' && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                Не засчитывается в маркетинговый бюджет
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Описание проблемы</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100"
              rows={3}
              placeholder="Опишите проблему..."
            />
          </div>

          {/* Total */}
          {selectedService && (
            <div className="flex items-center justify-between p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <span className="text-sm text-primary-700 dark:text-primary-300">Сумма:</span>
              <span className="text-lg font-bold text-primary-800 dark:text-primary-200">{totalCost.toLocaleString()} ₽</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || createOrderMutation.isPending}
              className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2"
            >
              {createOrderMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {createOrderMutation.isPending ? 'Создание...' : 'Создать заказ'}
            </button>
            <button onClick={onClose} className="px-4 py-2.5 text-gray-600 text-sm">Отмена</button>
          </div>
        </div>
      </div>
    </div>
  )
}
