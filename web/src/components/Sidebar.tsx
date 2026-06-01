import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Calendar,
  LayoutDashboard,
  Users,
  ClipboardList,
  Wallet,
  Megaphone,
  Package,
  Settings,
  LogOut,
  Wrench,
  UserCheck,
  Banknote,
  Briefcase,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface SubItem {
  path: string
  label: string
}

interface MenuGroup {
  label: string
  icon: React.ComponentType<{ className?: string }>
  path?: string
  items?: SubItem[]
}

const menuGroups: MenuGroup[] = [
  {
    label: 'Расписание',
    icon: Calendar,
    items: [
      { path: '/', label: 'Расписание' },
      { path: '/workorders', label: 'Заказы' },
    ],
  },
  {
    label: 'Клиенты',
    icon: Users,
    path: '/clients',
  },
  {
    label: 'Каталог',
    icon: Briefcase,
    items: [
      { path: '/services', label: 'Услуги' },
      { path: '/warehouse', label: 'Склад' },
      { path: '/staff', label: 'Механики' },
    ],
  },
  {
    label: 'Финансы',
    icon: Wallet,
    items: [
      { path: '/finance', label: 'Финансы' },
      { path: '/salary', label: 'Зарплаты' },
      { path: '/marketing', label: 'Маркетинг' },
    ],
  },
  {
    label: 'Отчёты',
    icon: LayoutDashboard,
    items: [
      { path: '/dashboard', label: 'Дашборд' },
      { path: '/settings', label: 'Настройки' },
    ],
  },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    menuGroups.forEach((group) => {
      if (group.items) {
        initial[group.label] = group.items.some(
          (item) => location.pathname === item.path
        )
      }
    })
    return initial
  })

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  const isGroupActive = (group: MenuGroup) => {
    if (group.path) return location.pathname === group.path
    if (group.items) return group.items.some((item) => location.pathname === item.path)
    return false
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
        {menuGroups.map((group) => {
          const groupActive = isGroupActive(group)
          const isExpanded = expandedGroups[group.label] || false

          if (group.path) {
            return (
              <button
                key={group.label}
                onClick={() => navigate(group.path!)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  groupActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <group.icon className="w-4 h-4" />
                {group.label}
              </button>
            )
          }

          return (
            <div key={group.label}>
              <button
                onClick={() => toggleGroup(group.label)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  groupActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <group.icon className="w-4 h-4" />
                  {group.label}
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
              {isExpanded && group.items && (
                <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path
                    return (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? 'text-primary-700 dark:text-primary-300 font-medium'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
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
