import { X, Printer, CheckCircle } from 'lucide-react'

interface Props {
  order: any
  onClose: () => void
}

export default function ReceiptModal({ order, onClose }: Props) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md max-h-[80vh] overflow-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Кассовый чек</h3>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
            >
              <Printer className="w-4 h-4" />
              Печать
            </button>
            <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
          </div>
        </div>

        <div className="p-6 space-y-4 print:p-0">
          {/* Receipt content */}
          <div className="text-center border-b border-dashed border-gray-300 dark:border-gray-600 pb-4">
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">Автосервис "Мастер"</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">г. Москва, ул. Автосервисная, 15</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">+7 (495) 123-45-67</div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Чек №</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{order.id?.slice(0, 8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Дата</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {new Date().toLocaleDateString('ru-RU')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Клиент</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{order.client?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Авто</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {order.vehicle?.make} {order.vehicle?.model}
              </span>
            </div>
          </div>

          <div className="border-t border-b border-gray-200 dark:border-gray-700 py-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400">
                  <th className="pb-2">Услуга</th>
                  <th className="pb-2 text-right">Сумма</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-1 text-gray-900 dark:text-gray-100">{order.service?.name}</td>
                  <td className="py-1 text-right font-medium text-gray-900 dark:text-gray-100">
                    {order.total_cost?.toLocaleString()} ₽
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center text-lg font-bold">
            <span className="text-gray-900 dark:text-gray-100">ИТОГО:</span>
            <span className="text-gray-900 dark:text-gray-100">{order.total_cost?.toLocaleString()} ₽</span>
          </div>

          <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-dashed border-gray-300 dark:border-gray-600">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="w-3 h-3 text-emerald-500" />
              Спасибо за визит!
            </div>
            <div>autoCRM — автоматизация автосервиса</div>
          </div>
        </div>
      </div>
    </div>
  )
}
