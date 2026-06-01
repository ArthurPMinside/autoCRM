import { useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'

interface DateRangePickerProps {
  startDate: string
  endDate: string
  onChange: (start: string, end: string) => void
}

const PRESETS = [
  { label: 'Сегодня', days: 0 },
  { label: 'Вчера', days: 1 },
  { label: 'Неделя', days: 7 },
  { label: 'Месяц', days: 30 },
  { label: 'Квартал', days: 90 },
  { label: 'Год', days: 365 },
]

function formatDateInput(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeDate(dateStr: string): string {
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  // DD.MM.YYYY
  const ddmmyyyy = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`
  // MM/DD/YYYY
  const mmddyyyy = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (mmddyyyy) return `${mmddyyyy[3]}-${mmddyyyy[1]}-${mmddyyyy[2]}`
  return dateStr
}

export default function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  const [showPresets, setShowPresets] = useState(false)

  const applyPreset = (days: number) => {
    const end = new Date()
    const start = new Date()
    if (days === 0) {
      onChange(formatDateInput(start), formatDateInput(end))
    } else if (days === 1) {
      start.setDate(start.getDate() - 1)
      end.setDate(end.getDate() - 1)
      onChange(formatDateInput(start), formatDateInput(end))
    } else {
      start.setDate(start.getDate() - days)
      onChange(formatDateInput(start), formatDateInput(end))
    }
    setShowPresets(false)
  }

  const handleStartChange = (value: string) => {
    onChange(normalizeDate(value), endDate)
  }

  const handleEndChange = (value: string) => {
    onChange(startDate, normalizeDate(value))
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>Период</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>
        {showPresets && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowPresets(false)} />
            <div className="absolute left-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg z-20 py-1">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p.days)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <input
        type="date"
        value={startDate}
        onChange={(e) => handleStartChange(e.target.value)}
        className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      <span className="text-gray-400 text-sm">—</span>
      <input
        type="date"
        value={endDate}
        onChange={(e) => handleEndChange(e.target.value)}
        className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
    </div>
  )
}
