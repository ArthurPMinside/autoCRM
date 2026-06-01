import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Calendar, Users, Briefcase, Wallet, MoreHorizontal, X } from 'lucide-react'

const mobileGroups = [
  { path: '/', icon: Calendar, label: 'Расписание' },
  { path: '/clients', icon: Users, label: 'Клиенты' },
  { path: '/services', icon: Briefcase, label: 'Каталог' },
  { path: '/finance', icon: Wallet, label: 'Финансы' },
]

const allPages = [
  { path: '/', label: 'Расписание', group: 'Расписание' },
  { path: '/clients', label: 'Клиенты', group: 'Клиенты' },
  { path: '/workorders', label: 'Заказы', group: 'Клиенты' },
  { path: '/services', label: 'Услуги', group: 'Каталог' },
  { path: '/warehouse', label: 'Склад', group: 'Каталог' },
  { path: '/staff', label: 'Механики', group: 'Каталог' },
  { path: '/finance', label: 'Финансы', group: 'Финансы' },
  { path: '/salary', label: 'Зарплаты', group: 'Финансы' },
  { path: '/marketing', label: 'Маркетинг', group: 'Финансы' },
  { path: '/dashboard', label: 'Дашборд', group: 'Отчёты' },
  { path: '/settings', label: 'Настройки', group: 'Отчёты' },
]

export default function MobileNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)

  const handleNavigate = (path: string) => {
    navigate(path)
    setShowMenu(false)
  }

  const groupedPages = allPages.reduce<Record<string, typeof allPages>>((acc, page) => {
    if (!acc[page.group]) acc[page.group] = []
    acc[page.group].push(page)
    return acc
  }, {})

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 safe-area-pb">
        <div className="flex items-center justify-around">
          {mobileGroups.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path
            return (
              <button
                key={path}
                onClick={() => handleNavigate(path)}
                className={`flex flex-col items-center py-2 px-3 ${
                  isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] mt-0.5">{label}</span>
              </button>
            )
          })}
          <button
            onClick={() => setShowMenu(true)}
            className={`flex flex-col items-center py-2 px-3 ${
              showMenu ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Ещё</span>
          </button>
        </div>
      </nav>

      {showMenu && (
        <div className="md:hidden fixed inset-0 z-[60] bg-black/50" onClick={() => setShowMenu(false)}>
          <div
            className="absolute bottom-20 left-4 right-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 max-h-[60vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-gray-900 dark:text-gray-100">Все страницы</span>
              <button onClick={() => setShowMenu(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-3">
              {Object.entries(groupedPages).map(([group, pages]) => (
                <div key={group}>
                  <div className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5 px-1">
                    {group}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {pages.map(({ path, label }) => (
                      <button
                        key={path}
                        onClick={() => handleNavigate(path)}
                        className={`text-left px-3 py-2 rounded-lg text-sm ${
                          location.pathname === path
                            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 font-medium'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
