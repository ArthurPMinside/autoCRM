import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, ArrowDownLeft, ArrowUpRight, Search, Loader2, X, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { financeApi } from '../api/finance'
import { useToastStore } from '../components/Toast'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
  work_order_id?: string
}

const categories = {
  income: ['Оплата заказа', 'Продажа запчастей', 'Другое'],
  expense: ['Запчасти', 'Зарплата', 'Аренда', 'Коммунальные', 'Налоги', 'Другое'],
}

export default function FinancePage() {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [showCreate, setShowCreate] = useState(false)
  const { addToast } = useToastStore()
  const queryClient = useQueryClient()

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const res = await financeApi.getAll()
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: financeApi.create,
    onSuccess: () => {
      addToast('Транзакция добавлена', 'success')
      setShowCreate(false)
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
    onError: () => {
      addToast('Ошибка при создании', 'error')
    },
  })

  const filteredTransactions = transactions?.filter((t: Transaction) =>
    filter === 'all' || t.type === filter
  ) || []

  const totalIncome = transactions?.filter((t: Transaction) => t.type === 'income').reduce((s: number, t: Transaction) => s + t.amount, 0) || 0
  const totalExpense = transactions?.filter((t: Transaction) => t.type === 'expense').reduce((s: number, t: Transaction) => s + t.amount, 0) || 0
  const balance = totalIncome - totalExpense

  const [newTransaction, setNewTransaction] = useState({
    type: 'income' as 'income' | 'expense',
    amount: '',
    category: '',
    description: '',
  })

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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Финансы</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Новая операция
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Приход</span>
          </div>
          <div className="text-xl font-bold text-emerald-600">{totalIncome.toLocaleString()} ₽</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight className="w-4 h-4 text-red-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Расход</span>
          </div>
          <div className="text-xl font-bold text-red-600">{totalExpense.toLocaleString()} ₽</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-primary-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Баланс</span>
          </div>
          <div className={`text-xl font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {balance.toLocaleString()} ₽
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: 'Все' },
          { key: 'income', label: 'Приход' },
          { key: 'expense', label: 'Расход' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Transactions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Дата</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Тип</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Категория</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Описание</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((t: Transaction) => (
                <tr key={t.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{new Date(t.date).toLocaleDateString('ru-RU')}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      t.type === 'income'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {t.type === 'income' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                      {t.type === 'income' ? 'Приход' : 'Расход'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t.category}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t.description || '-'}</td>
                  <td className={`px-4 py-3 text-right font-medium ${
                    t.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()} ₽
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTransactions.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Операции не найдены</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Новая операция</h3>
              <button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setNewTransaction({ ...newTransaction, type: 'income', category: '' })}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  newTransaction.type === 'income'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                Приход
              </button>
              <button
                onClick={() => setNewTransaction({ ...newTransaction, type: 'expense', category: '' })}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  newTransaction.type === 'expense'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                Расход
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Сумма *</label>
              <input
                type="number"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Категория</label>
              <select
                value={newTransaction.category}
                onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100"
              >
                <option value="">Выберите категорию</option>
                {categories[newTransaction.type].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Описание</label>
              <textarea
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-gray-100"
                rows={3}
                placeholder="Описание операции..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm">Отмена</button>
              <button
                onClick={() => createMutation.mutate({
                  ...newTransaction,
                  amount: Number(newTransaction.amount),
                  date: new Date().toISOString(),
                })}
                disabled={!newTransaction.amount || !newTransaction.category}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm"
              >
                {createMutation.isPending ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
