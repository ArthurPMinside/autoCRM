import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import SchedulePage from './pages/SchedulePage'
import DashboardPage from './pages/DashboardPage'
import ClientsPage from './pages/ClientsPage'
import WorkOrdersPage from './pages/WorkOrdersPage'
import FinancePage from './pages/FinancePage'
import MarketingPage from './pages/MarketingPage'
import WarehousePage from './pages/WarehousePage'
import AnalyticsPage from './pages/AnalyticsPage'
import ServicesPage from './pages/ServicesPage'
import StaffPage from './pages/StaffPage'
import SalaryPage from './pages/SalaryPage'
import SettingsPage from './pages/SettingsPage'
import ToastContainer from './components/Toast'
import { useThemeStore } from './store/themeStore'

function App() {
  const { initTheme } = useThemeStore()
  useEffect(() => { initTheme() }, [initTheme])
  const isAuthenticated = !!localStorage.getItem('token')

  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<SchedulePage />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="workorders" element={<WorkOrdersPage />} />
          <Route path="finance" element={<FinancePage />} />
          <Route path="marketing" element={<MarketingPage />} />
          <Route path="warehouse" element={<WarehousePage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="salary" element={<SalaryPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
