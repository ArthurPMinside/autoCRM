import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Package, AlertTriangle, ArrowDownLeft, ArrowUpRight, Loader2, X, Pencil, Trash2 } from 'lucide-react'
import { useToastStore } from '../components/Toast'
import { warehouseApi } from '../api/warehouse'

interface Part {
  id: string
  name: string
  category: string
  quantity: number
  min_quantity: number
  price: number
  supplier: string
  location: string
}

const categories = ['Все', 'Масла', 'Фильтры', 'Тормоза', 'Свечи', 'Жидкости', 'Ремни', 'Подвеска', 'Шины']

export default function WarehousePage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Все')
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showMovement, setShowMovement] = useState<string | null>(null)
  const [newPart, setNewPart] = useState({ name: '', category: 'Масла', quantity: 0, min_quantity: 5, price: 0, supplier: '', location: '' })
  const [editPart, setEditPart] = useState({ name: '', category: '', quantity: 0, min_quantity: 5, price: 0, supplier: '', location: '' })
  const { addToast } = useToastStore()
  const queryClient = useQueryClient()

  const { data: partsData, isLoading } = useQuery<Part[]>({
    queryKey: ['parts'],
    queryFn: async () => {
      const res = await warehouseApi.getParts()
      return res.data
    },
  })
  const parts = partsData || []

  const createMutation = useMutation({
    mutationFn: warehouseApi.createPart,
    onSuccess: () => {
      addToast('Запчасть добавлена', 'success')
      setShowCreate(false)
      setNewPart({ name: '', category: 'Масла', quantity: 0, min_quantity: 5, price: 0, supplier: '', location: '' })
      queryClient.invalidateQueries({ queryKey: ['parts'] })
    },
    onError: () => {
      addToast('Ошибка при добавлении запчасти', 'error')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => warehouseApi.updatePart(id, data),
    onSuccess: () => {
      addToast('Запчасть обновлена', 'success')
      setShowEdit(false)
      queryClient.invalidateQueries({ queryKey: ['parts'] })
    },
    onError: () => {
      addToast('Ошибка при обновлении запчасти', 'error')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: warehouseApi.deletePart,
    onSuccess: () => {
      addToast('Запчасть удалена', 'success')
      queryClient.invalidateQueries({ queryKey: ['parts'] })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || 'Ошибка при удалении запчасти'
      addToast(msg, 'error')
    },
  })

  const filteredParts = parts.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'Все' || p.category === category
    return matchesSearch && matchesCategory
  })

  const lowStock = filteredParts.filter((p) => p.quantity <= p.min_quantity)

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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Склад запчастей</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Новая запчасть
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-primary-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Всего позиций</span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{parts.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Низкий остаток</span>
          </div>
          <div className="text-xl font-bold text-red-600">{lowStock.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Приход (мес.)</span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">142</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Расход (мес.)</span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">128</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по названию или поставщику..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm dark:text-gray-100 placeholder-gray-400"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm dark:text-gray-100"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Название</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Категория</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Остаток</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Мин.</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Цена</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Поставщик</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Место</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredParts.map((part) => (
                <tr key={part.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{part.name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{part.category}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      part.quantity <= part.min_quantity
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    }`}>
                      {part.quantity <= part.min_quantity && <AlertTriangle className="w-3 h-3" />}
                      {part.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">{part.min_quantity}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-gray-100">{part.price.toLocaleString()} ₽</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{part.supplier}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{part.location}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowMovement(part.id)}
                        className="text-primary-600 hover:text-primary-700 text-xs font-medium"
                      >
                        Движение
                      </button>
                      <button
                        onClick={() => {
                          setEditPart({ ...part })
                          setShowEdit(true)
                        }}
                        className="text-gray-400 hover:text-primary-600"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Удалить запчасть?')) {
                            deleteMutation.mutate(part.id)
                          }
                        }}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredParts.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Запчасти не найдены</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Новая запчасть</h3>
              <button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Название</label>
                <input className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Категория</label>
                <select
                  value={newPart.category}
                  onChange={(e) => setNewPart({ ...newPart, category: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100"
                >
                  {categories.filter(c => c !== 'Все').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Цена</label>
                <input type="number" value={newPart.price} onChange={(e) => setNewPart({ ...newPart, price: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Остаток</label>
                <input type="number" value={newPart.quantity} onChange={(e) => setNewPart({ ...newPart, quantity: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Мин. остаток</label>
                <input type="number" value={newPart.min_quantity} onChange={(e) => setNewPart({ ...newPart, min_quantity: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Поставщик</label>
                <input value={newPart.supplier} onChange={(e) => setNewPart({ ...newPart, supplier: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Место хранения</label>
                <input value={newPart.location} onChange={(e) => setNewPart({ ...newPart, location: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm">Отмена</button>
              <button
                onClick={() => createMutation.mutate(newPart)}
                disabled={!newPart.name}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm"
              >
                {createMutation.isPending ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Редактировать запчасть</h3>
              <button onClick={() => setShowEdit(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Название</label>
                <input value={editPart.name} onChange={(e) => setEditPart({ ...editPart, name: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Категория</label>
                <select value={editPart.category} onChange={(e) => setEditPart({ ...editPart, category: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100">
                  {categories.filter(c => c !== 'Все').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Цена</label>
                <input type="number" value={editPart.price} onChange={(e) => setEditPart({ ...editPart, price: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Остаток</label>
                <input type="number" value={editPart.quantity} onChange={(e) => setEditPart({ ...editPart, quantity: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Мин. остаток</label>
                <input type="number" value={editPart.min_quantity} onChange={(e) => setEditPart({ ...editPart, min_quantity: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Поставщик</label>
                <input value={editPart.supplier} onChange={(e) => setEditPart({ ...editPart, supplier: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Место хранения</label>
                <input value={editPart.location} onChange={(e) => setEditPart({ ...editPart, location: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setShowEdit(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm">Отмена</button>
              <button
                onClick={() => updateMutation.mutate({ id: (editPart as any).id, data: editPart })}
                disabled={!editPart.name}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm"
              >
                {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
