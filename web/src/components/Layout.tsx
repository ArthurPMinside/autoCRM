import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import ThemeToggle from './ThemeToggle'

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-auto p-4 md:p-6 pb-24 md:pb-6">
        <Outlet />
      </main>
      <MobileNav />
      <ThemeToggle />
    </div>
  )
}
