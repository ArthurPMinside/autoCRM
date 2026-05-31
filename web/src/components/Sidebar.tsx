import { useLocation, useNavigate } from 'react-router-dom'
import {
  Calendar,
  LayoutDashboard,
  Users,
  ClipboardList,
  Wallet,
  Megaphone,
  Package,
  BarChart3,
  Settings,
  LogOut,
  Wrench,
  UserCheck,
  Banknote,
  Briefcase,
} from 'lucide-react'

const menuItems = [
  { path: '/', icon: Calendar, label: 'Расписание' },
  { path: '/dashboard', icon: LayoutDashboard, label: 'Дашборд' },
  { path: '/clients', icon: Users, label: 'Клиенты' },
  { path: '/workorders', icon: ClipboardList, label: 'Заказы' },
  { path: '/services', icon: Briefcase, label: 'Услуги' },
  { path: '/finance', icon: Wallet, label: 'Финансы' },
  { path: '/marketing', icon: Megaphone, label: 'Маркетинг' },
  { path: '/warehouse', icon: Package, label: 'Склад' },
  { path: '/analytics', icon: BarChart3, label: 'Аналитика' },
  { path: '/staff', icon: UserCheck, label: 'Механики' },
  { path: '/salary', icon: Banknote, label: 'Зарплаты' },
  { path: '/settings', icon: Settings, label: 'Настройки' },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen sticky top-0">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
            <Wrench className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 dark:text-gray-100">autoCRM</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Автосервис</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Выйти
        </button>
      </div>
    </aside>
  )
}
