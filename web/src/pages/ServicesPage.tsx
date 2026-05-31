import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Wrench, Clock, Loader2, X, Pencil, Trash2 } from 'lucide-react'
import { servicesApi } from '../api/services'
import { useToastStore } from '../components/Toast'

interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number
}

export default function ServicesPage() {
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const { addToast } = useToastStore()
  const queryClient = useQueryClient()

  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await servicesApi.getAll()
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: servicesApi.create,
    onSuccess: () => {
      addToast('Услуга добавлена', 'success')
      setShowCreate(false)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
    onError: () => addToast('Ошибка при создании', 'error'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => servicesApi.update(id, data),
    onSuccess: () => {
      addToast('Услуга обновлена', 'success')
      setEditingId(null)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
    onError: () => addToast('Ошибка при обновлении', 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: servicesApi.delete,
    onSuccess: () => {
      addToast('Услуга удалена', 'success')
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
    onError: () => addToast('Ошибка при удалении', 'error'),
  })

  const [form, setForm] = useState({ name: '', description: '', price: '', duration: '1' })

  const resetForm = () => setForm({ name: '', description: '', price: '', duration: '1' })

  const filteredServices = services?.filter((s: Service) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description?.toLowerCase().includes(search.toLowerCase())
  ) || []

  const totalRevenue = services?.reduce((sum: number, s: Service) => sum + (s.price || 0), 0) || 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
      </div>
    )
  }

  const openEdit = (service: Service) => {
    setEditingId(service.id)
    setForm({
      name: service.name,
      description: service.description || '',
      price: String(service.price || ''),
      duration: String(service.duration || '1'),
    })
    setShowCreate(true)
  }

  const handleSubmit = () => {
    const data = {
      name: form.name,
      description: form.description,
      price: Number(form.price) || 0,
      duration: Number(form.duration) || 1,
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Услуги</h2>
        <button
          onClick={() => { setShowCreate(true); setEditingId(null); resetForm() }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Новая услуга
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Wrench className="w-4 h-4 text-primary-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Всего услуг</span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{services?.length || 0}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Среднее время</span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {services?.length ? (services.reduce((s: number, svc: Service) => s + (svc.duration || 0), 0) / services.length).toFixed(1) : 0} ч
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Средняя цена</span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {services?.length ? Math.round(totalRevenue / services.length).toLocaleString() : 0} ₽
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Макс. цена</span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {services?.length ? Math.max(...services.map((s: Service) => s.price || 0)).toLocaleString() : 0} ₽
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Поиск услуги..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm dark:text-gray-100 placeholder-gray-400"
        />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((service: Service) => (
          <div key={service.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{service.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{service.description || 'Нет описания'}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(service)} className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => deleteMutation.mutate(service.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                {service.duration || 1} ч
              </div>
              <div className="text-lg font-bold text-primary-600 dark:text-primary-400">
                {service.price?.toLocaleString()} ₽
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Wrench className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Услуги не найдены</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {editingId ? 'Редактировать услугу' : 'Новая услуга'}
              </h3>
              <button onClick={() => { setShowCreate(false); setEditingId(null) }}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Название *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100"
                placeholder="Например: ТО-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Описание</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100"
                rows={3}
                placeholder="Что входит в услугу..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Цена (₽) *</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Время (ч) *</label>
                <input
                  type="number"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100"
                  placeholder="1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => { setShowCreate(false); setEditingId(null) }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
              >
                Отмена
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.name || !form.price}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm"
              >
                {createMutation.isPending || updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
