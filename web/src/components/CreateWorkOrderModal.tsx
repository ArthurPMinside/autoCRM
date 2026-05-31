import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, ChevronRight, Loader2, Plus } from 'lucide-react'
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
  const [step, setStep] = useState(1)
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [description, setDescription] = useState('')
  const [scheduledDate, setScheduledDate] = useState(initialDate || '')
  const [searchClient, setSearchClient] = useState('')
  const [showNewClient, setShowNewClient] = useState(false)
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '' })
  const [newVehicle, setNewVehicle] = useState({ make: '', model: '', year: '', license_plate: '', vin: '' })
  const [showNewVehicle, setShowNewVehicle] = useState(false)

  const { addToast } = useToastStore()
  const queryClient = useQueryClient()

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await clientsApi.getAll()
      return res.data
    },
  })

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles', selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return []
      const res = await vehiclesApi.getByClient(selectedClient.id)
      return res.data
    },
    enabled: !!selectedClient,
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
      setSelectedClient(res.data)
      setShowNewClient(false)
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      addToast('Клиент создан', 'success')
    },
  })

  const createVehicleMutation = useMutation({
    mutationFn: vehiclesApi.create,
    onSuccess: (res) => {
      setSelectedVehicle(res.data)
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

  const filteredClients = clients?.filter((c: any) =>
    c.name.toLowerCase().includes(searchClient.toLowerCase()) ||
    c.phone.includes(searchClient)
  ) || []

  const handleSubmit = () => {
    if (!selectedClient || !selectedVehicle || !selectedService) return
    createOrderMutation.mutate({
      client_id: selectedClient.id,
      vehicle_id: selectedVehicle.id,
      service_id: selectedService.id,
      description,
      scheduled_date: scheduledDate || undefined,
      status: 'pending',
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg max-h-[80vh] overflow-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Новый заказ-наряд</h3>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`w-8 h-1 rounded-full ${s <= step ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
              ))}
            </div>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Step 1: Client */}
          {step === 1 && (
            <div className="space-y-4">
              {!showNewClient ? (
                <>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Поиск клиента..."
                      value={searchClient}
                      onChange={(e) => setSearchClient(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100"
                    />
                  </div>
                  <div className="space-y-2 max-h-64 overflow-auto">
                    {filteredClients.map((client: any) => (
                      <button
                        key={client.id}
                        onClick={() => { setSelectedClient(client); setStep(2) }}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedClient?.id === client.id
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="font-medium text-gray-900 dark:text-gray-100">{client.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{client.phone}</div>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowNewClient(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:border-primary-400 hover:text-primary-600"
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
          )}

          {/* Step 2: Vehicle */}
          {step === 2 && (
            <div className="space-y-4">
              {!showNewVehicle ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Клиент: {selectedClient?.name}</span>
                    <button onClick={() => setStep(1)} className="text-sm text-primary-600">Изменить</button>
                  </div>
                  <div className="space-y-2">
                    {vehicles?.map((vehicle: any) => (
                      <button
                        key={vehicle.id}
                        onClick={() => { setSelectedVehicle(vehicle); setStep(3) }}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedVehicle?.id === vehicle.id
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="font-medium text-gray-900 dark:text-gray-100">{vehicle.make} {vehicle.model}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{vehicle.year} г. • {vehicle.license_plate}</div>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowNewVehicle(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:border-primary-400 hover:text-primary-600"
                  >
                    <Plus className="w-4 h-4" />
                    Добавить авто
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Новое авто</h4>
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
                      onClick={() => createVehicleMutation.mutate({ ...newVehicle, client_id: selectedClient.id, year: Number(newVehicle.year) || new Date().getFullYear() })}
                      disabled={!newVehicle.make || !newVehicle.model || !newVehicle.license_plate}
                      className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm disabled:opacity-50"
                    >
                      {createVehicleMutation.isPending ? 'Создание...' : 'Добавить'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Service */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedVehicle?.make} {selectedVehicle?.model}
                </span>
                <button onClick={() => setStep(2)} className="text-sm text-primary-600">Изменить</button>
              </div>
              <div className="space-y-2 max-h-48 overflow-auto">
                {services?.map((service: any) => (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedService?.id === service.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{service.name}</span>
                      <span className="text-sm font-medium text-primary-600">{service.price?.toLocaleString()} ₽</span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{service.duration} ч.</div>
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Дата записи</label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100"
                />
              </div>
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
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={onClose} className="px-4 py-2 text-gray-600 text-sm">Отмена</button>
                <button
                  onClick={handleSubmit}
                  disabled={!selectedService || createOrderMutation.isPending}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm flex items-center gap-2"
                >
                  {createOrderMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {createOrderMutation.isPending ? 'Создание...' : 'Создать заказ'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
