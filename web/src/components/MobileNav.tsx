import { useLocation, useNavigate } from 'react-router-dom'
import { Calendar, Users, ClipboardList, Wallet, MoreHorizontal } from 'lucide-react'

export default function MobileNav() {
  const location = useLocation()
  const navigate = useNavigate()

  const items = [
    { path: '/', icon: Calendar, label: 'Расписание' },
    { path: '/clients', icon: Users, label: 'Клиенты' },
    { path: '/workorders', icon: ClipboardList, label: 'Заказы' },
    { path: '/finance', icon: Wallet, label: 'Финансы' },
    { path: '/dashboard', icon: MoreHorizontal, label: 'Ещё' },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 safe-area-pb">
      <div className="flex items-center justify-around">
        {items.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center py-2 px-3 ${
                isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
