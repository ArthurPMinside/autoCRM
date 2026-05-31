import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Phone, Wrench, Loader2, X, Percent, UserCheck } from 'lucide-react'
import { staffApi } from '../api/staff'
import { useToastStore } from '../components/Toast'

interface StaffMember {
  id: string
  name: string
  phone: string
  role: string
  commission_rate: number
  is_active: boolean
}

export default function StaffPage() {
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const { addToast } = useToastStore()
  const queryClient = useQueryClient()

  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const res = await staffApi.getAll()
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: staffApi.create,
    onSuccess: () => {
      addToast('Механик добавлен', 'success')
      setShowCreate(false)
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => staffApi.update(id, data),
    onSuccess: () => {
      addToast('Данные обновлены', 'success')
      setEditingId(null)
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: staffApi.delete,
    onSuccess: () => {
      addToast('Механик удалён', 'success')
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
  })

  const filteredStaff = staff?.filter((s: StaffMember) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.includes(search)
  ) || []

  const [form, setForm] = useState({ name: '', phone: '', role: 'mechanic', commission_rate: 30, is_active: true })

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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Механики</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Новый механик
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="w-4 h-4 text-primary-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Всего</span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{staff?.length || 0}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Wrench className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Механиков</span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {staff?.filter((s: StaffMember) => s.role === 'mechanic').length || 0}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Percent className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Средний %</span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {staff?.length ? (staff.reduce((s: number, m: StaffMember) => s + m.commission_rate, 0) / staff.length).toFixed(0) : 0}%
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Активных</span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {staff?.filter((s: StaffMember) => s.is_active).length || 0}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Поиск по имени или телефону..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm dark:text-gray-100 placeholder-gray-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Имя</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Телефон</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Роль</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-400">%</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Статус</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((member: StaffMember) => (
                <tr key={member.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{member.name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{member.phone || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      member.role === 'mechanic'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                    }`}>
                      {member.role === 'mechanic' ? 'Механик' : 'Админ'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-medium text-gray-900 dark:text-gray-100">{member.commission_rate}%</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      member.is_active
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {member.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingId(member.id); setForm({ ...member }) }}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(member.id)}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredStaff.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Wrench className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Механики не найдены</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreate || editingId) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {editingId ? 'Редактировать' : 'Новый механик'}
              </h3>
              <button onClick={() => { setShowCreate(false); setEditingId(null) }}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ФИО *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Телефон</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Роль</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100"
              >
                <option value="mechanic">Механик</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Процент от работ (%)</label>
              <input
                type="number"
                value={form.commission_rate}
                onChange={(e) => setForm({ ...form, commission_rate: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_active !== false}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Активен</span>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => { setShowCreate(false); setEditingId(null) }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  if (editingId) {
                    updateMutation.mutate({ id: editingId, data: form })
                  } else {
                    createMutation.mutate(form)
                  }
                }}
                disabled={!form.name}
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
