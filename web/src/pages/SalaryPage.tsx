import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Calendar, Wallet, Wrench, TrendingUp, Percent } from 'lucide-react'
import { staffApi } from '../api/staff'

interface StaffMember {
  id: string
  name: string
  commission_rate: number
}

export default function SalaryPage() {
  const [year, setYear] = useState(2026)
  const [month, setMonth] = useState(5)
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null)

  const { data: staff, isLoading: staffLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const res = await staffApi.getAll()
      return res.data
    },
  })

  const { data: salary, isLoading: salaryLoading } = useQuery({
    queryKey: ['salary', selectedStaff, year, month],
    queryFn: async () => {
      if (!selectedStaff) return null
      const res = await staffApi.getSalary(selectedStaff, year, month)
      return res.data
    },
    enabled: !!selectedStaff,
  })

  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ]

  const isLoading = staffLoading

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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Зарплаты</h2>
      </div>

      {/* Period selector */}
      <div className="flex gap-3">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm dark:text-gray-100"
        >
          {months.map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm dark:text-gray-100"
        >
          {[2024, 2025, 2026, 2027].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Staff list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff?.filter((s: StaffMember) => s.commission_rate > 0).map((member: StaffMember) => (
          <button
            key={member.id}
            onClick={() => setSelectedStaff(member.id)}
            className={`text-left p-5 rounded-xl border transition-colors ${
              selectedStaff === member.id
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-300 dark:hover:border-primary-700'
            }`}
          >
            <div className="font-semibold text-gray-900 dark:text-gray-100">{member.name}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{member.commission_rate}% от работ</div>
          </button>
        ))}
      </div>

      {/* Salary details */}
      {selectedStaff && salary && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {salary.staff_name} — {months[month - 1]} {year}
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">{salary.commission_rate}%</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Wrench className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Заказов</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{salary.total_orders}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Выручка</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{salary.total_revenue.toLocaleString()} ₽</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Percent className="w-4 h-4 text-primary-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Процент</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{salary.commission_rate}%</div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 text-center border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Wallet className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-emerald-600 dark:text-emerald-400">Зарплата</span>
              </div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{salary.salary.toLocaleString()} ₽</div>
            </div>
          </div>
        </div>
      )}

      {selectedStaff && salaryLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      )}
    </div>
  )
}
