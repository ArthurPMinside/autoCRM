import React, { useState, useMemo, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../../api/dashboard'
import { workOrdersApi } from '../../api/workOrders'
import { clientsApi } from '../../api/clients'
import { financeApi } from '../../api/finance'
import { analyticsApi } from '../../api/analytics'
import { Colors } from '../../constants/colors'
import { formatCurrency, formatDate } from '../../utils/format'
import {
  Users,
  Wrench,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Circle,
  Megaphone,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native'

const STATUS_COLORS: Record<string, string> = {
  pending: Colors.warning,
  in_progress: Colors.info,
  completed: Colors.success,
  cancelled: Colors.danger,
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает',
  in_progress: 'В работе',
  completed: 'Готово',
  cancelled: 'Отменено',
}

function getDefaultDates(days = 30) {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  return { start: fmt(start), end: fmt(end) }
}

function shiftDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function isDateInRange(dateStr: string | null | undefined, start: string, end: string): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const s = new Date(start)
  const e = new Date(end)
  e.setHours(23, 59, 59, 999)
  return d >= s && d <= e
}

function calcChange(current: number, previous: number): { value: string; isPositive: boolean | null } {
  if (previous === 0) {
    if (current === 0) return { value: '0%', isPositive: null }
    return { value: 'Новое', isPositive: true }
  }
  const change = ((current - previous) / previous) * 100
  return { value: `${change >= 0 ? '+' : ''}${change.toFixed(0)}%`, isPositive: change >= 0 }
}

const PERIOD_OPTIONS = [
  { label: '7 дн', days: 7 },
  { label: '30 дн', days: 30 },
  { label: '90 дн', days: 90 },
  { label: 'Месяц', days: 'month' as const },
]

function formatDateShort(d: Date): string {
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export function DashboardScreen() {
  const [periodDays, setPeriodDays] = useState<number | 'month' | 'custom'>(30)
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d
  })
  const [customEnd, setCustomEnd] = useState(new Date())
  const [showDateModal, setShowDateModal] = useState(false)
  const [activeDateField, setActiveDateField] = useState<'start' | 'end'>('start')

  const dateRange = useMemo(() => {
    if (periodDays === 'custom') {
      const fmt = (d: Date) => d.toISOString().split('T')[0]
      return { start: fmt(customStart), end: fmt(customEnd) }
    }
    if (periodDays === 'month') {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      const fmt = (d: Date) => d.toISOString().split('T')[0]
      return { start: fmt(start), end: fmt(end) }
    }
    return getDefaultDates(periodDays)
  }, [periodDays, customStart, customEnd])

  const prevRange = useMemo(() => {
    const days = periodDays === 'month' ? 30 : periodDays === 'custom' ? 30 : periodDays
    return {
      start: shiftDays(dateRange.start, -days),
      end: shiftDays(dateRange.end, -days),
    }
  }, [dateRange, periodDays])

  const { data: dashboardData, isLoading: dashLoading, refetch: refetchDash } = useQuery({
    queryKey: ['dashboard', dateRange],
    queryFn: () => dashboardApi.getStats({ start_date: dateRange.start, end_date: dateRange.end }).then((r) => r.data),
  })

  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['workOrders'],
    queryFn: () => workOrdersApi.getAll().then((r) => r.data),
  })

  const { data: clients, isLoading: clientsLoading, refetch: refetchClients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getAll().then((r) => r.data),
  })

  const { data: transactions, isLoading: financeLoading, refetch: refetchFinance } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => financeApi.getAll().then((r) => r.data),
  })

  const { data: activityData, isLoading: activityLoading, refetch: refetchActivity } = useQuery({
    queryKey: ['dashboardActivity'],
    queryFn: () => dashboardApi.getActivity().then((r) => r.data),
  })

  const { data: sourcesData, isLoading: sourcesLoading } = useQuery({
    queryKey: ['analyticsSources', dateRange],
    queryFn: () => analyticsApi.getSources({ start_date: dateRange.start, end_date: dateRange.end }).then((r) => r.data),
  })

  const isLoading = dashLoading || ordersLoading || clientsLoading || financeLoading || activityLoading || sourcesLoading

  const refetchAll = () => {
    refetchDash()
    refetchOrders()
    refetchClients()
    refetchFinance()
    refetchActivity()
  }

  // --- Metrics ---
  const currentOrders = orders?.filter((o: any) => isDateInRange(o.scheduled_date, dateRange.start, dateRange.end)) || []
  const periodRevenue = currentOrders.filter((o: any) => o.status !== 'cancelled').reduce((s: number, o: any) => s + (o.total_cost || 0), 0)
  const periodExpenses = transactions?.filter((t: any) => t.type === 'expense' && isDateInRange(t.date, dateRange.start, dateRange.end)).reduce((s: number, t: any) => s + t.amount, 0) || 0
  const periodActiveOrders = currentOrders.filter((o: any) => o.status === 'pending' || o.status === 'in_progress').length
  const periodNewClients = clients?.filter((c: any) => isDateInRange(c.created_at, dateRange.start, dateRange.end)).length || 0

  const prevOrdersList = orders?.filter((o: any) => isDateInRange(o.scheduled_date, prevRange.start, prevRange.end)) || []
  const prevRevenue = prevOrdersList.filter((o: any) => o.status !== 'cancelled').reduce((s: number, o: any) => s + (o.total_cost || 0), 0)
  const prevExpenses = transactions?.filter((t: any) => t.type === 'expense' && isDateInRange(t.date, prevRange.start, prevRange.end)).reduce((s: number, t: any) => s + t.amount, 0) || 0
  const prevActiveOrders = prevOrdersList.filter((o: any) => o.status === 'pending' || o.status === 'in_progress').length
  const prevNewClients = clients?.filter((c: any) => isDateInRange(c.created_at, prevRange.start, prevRange.end)).length || 0

  const revenueChange = calcChange(periodRevenue, prevRevenue)
  const expensesChange = calcChange(periodExpenses, prevExpenses)
  const activeOrdersChange = calcChange(periodActiveOrders, prevActiveOrders)
  const clientsChange = calcChange(periodNewClients, prevNewClients)

  // Status counts
  const statusCounts: Record<string, number> = {}
  orders?.forEach((o: any) => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1
  })
  const totalOrdersCount = orders?.length || 0

  // Sources
  const sources = sourcesData?.items || []
  const sourcesTotalRevenue = sourcesData?.total_revenue || 0

  const kpiData = [
    { label: 'Выручка', value: formatCurrency(periodRevenue), change: revenueChange, icon: <DollarSign size={20} color={Colors.success} /> },
    { label: 'Расходы', value: formatCurrency(periodExpenses), change: expensesChange, icon: <TrendingUp size={20} color={Colors.danger} /> },
    { label: 'В работе', value: periodActiveOrders, change: activeOrdersChange, icon: <Wrench size={20} color={Colors.info} /> },
    { label: 'Клиентов', value: periodNewClients, change: clientsChange, icon: <Users size={20} color={Colors.primary} /> },
  ]

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetchAll} />}
    >
      <Text style={styles.header}>Панель управления</Text>

      {/* Period selector */}
      <View style={styles.periodRow}>
        {PERIOD_OPTIONS.map((p) => (
          <TouchableOpacity
            key={p.label}
            style={[styles.periodBtn, periodDays === p.days && styles.periodBtnActive]}
            onPress={() => setPeriodDays(p.days as any)}
          >
            <Text style={[styles.periodText, periodDays === p.days && styles.periodTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.periodBtn, periodDays === 'custom' && styles.periodBtnActive]}
          onPress={() => setShowDateModal(true)}
        >
          <Calendar size={14} color={periodDays === 'custom' ? Colors.white : Colors.textMuted} />
          <Text style={[styles.periodText, periodDays === 'custom' && styles.periodTextActive]}>
            Свой
          </Text>
        </TouchableOpacity>
      </View>

      {periodDays === 'custom' && (
        <Text style={styles.customRangeLabel}>
          {formatDateShort(customStart)} — {formatDateShort(customEnd)}
        </Text>
      )}

      {/* Custom Date Modal */}
      <DateRangePickerModal
        visible={showDateModal}
        startDate={customStart}
        endDate={customEnd}
        onChangeStart={setCustomStart}
        onChangeEnd={setCustomEnd}
        onClose={() => setShowDateModal(false)}
        onApply={() => {
          setPeriodDays('custom')
          setShowDateModal(false)
        }}
      />

      {/* KPI Grid */}
      <View style={styles.kpiGrid}>
        {kpiData.map((kpi) => (
          <View key={kpi.label} style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              {kpi.icon}
              {kpi.change.isPositive !== null && (
                <View style={styles.changeRow}>
                  {kpi.change.isPositive ? (
                    <ArrowUpRight size={12} color={Colors.success} />
                  ) : (
                    <ArrowDownRight size={12} color={Colors.danger} />
                  )}
                  <Text style={[styles.changeText, { color: kpi.change.isPositive ? Colors.success : Colors.danger }]}>
                    {kpi.change.value}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.kpiValue}>{kpi.value}</Text>
            <Text style={styles.kpiLabel}>{kpi.label}</Text>
          </View>
        ))}
      </View>

      {/* Status Distribution */}
      {totalOrdersCount > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Статусы заказов</Text>
          <View style={styles.statusList}>
            {Object.entries(statusCounts).map(([status, count]) => {
              const pct = Math.round((count / totalOrdersCount) * 100)
              return (
                <View key={status} style={styles.statusRow}>
                  <View style={styles.statusLeft}>
                    <Circle size={10} color={STATUS_COLORS[status]} fill={STATUS_COLORS[status]} />
                    <Text style={styles.statusLabel}>{STATUS_LABELS[status] || status}</Text>
                  </View>
                  <View style={styles.statusRight}>
                    <View style={styles.progressBg}>
                      <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: STATUS_COLORS[status] }]} />
                    </View>
                    <Text style={styles.statusCount}>{count}</Text>
                  </View>
                </View>
              )
            })}
          </View>
        </View>
      )}

      {/* Top Sources */}
      {sources.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Источники клиентов</Text>
          {sources.slice(0, 5).map((s: any) => {
            const share = sourcesTotalRevenue > 0 ? Math.round((s.revenue / sourcesTotalRevenue) * 100) : 0
            return (
              <View key={s.source} style={styles.sourceRow}>
                <View style={styles.sourceLeft}>
                  <Megaphone size={14} color={Colors.textMuted} />
                  <Text style={styles.sourceName}>{s.source_label}</Text>
                </View>
                <View style={styles.sourceRight}>
                  <Text style={styles.sourceRevenue}>{formatCurrency(s.revenue)}</Text>
                  <Text style={styles.sourceShare}>{share}%</Text>
                </View>
              </View>
            )
          })}
        </View>
      )}

      {/* Recent Activity */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Последняя активность</Text>
        {activityData?.items?.length ? (
          activityData.items.map((item: any, i: number) => (
            <View key={i} style={styles.activityRow}>
              <Circle
                size={8}
                color={STATUS_COLORS[item.status] || Colors.textMuted}
                fill={STATUS_COLORS[item.status]}
              />
              <View style={styles.activityContent}>
                <Text style={styles.activityText} numberOfLines={1}>
                  {item.client_name} — {item.service_name}
                </Text>
                <Text style={styles.activityStatus}>
                  {STATUS_LABELS[item.status] || item.status}
                </Text>
              </View>
              <Text style={styles.activityCost}>{formatCurrency(item.total_cost || 0)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.placeholder}>Нет данных</Text>
        )}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  )
}

/* ---------- Custom Date Range Picker ---------- */

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

function DateRangePickerModal({
  visible,
  startDate,
  endDate,
  onChangeStart,
  onChangeEnd,
  onClose,
  onApply,
}: {
  visible: boolean
  startDate: Date
  endDate: Date
  onChangeStart: (d: Date) => void
  onChangeEnd: (d: Date) => void
  onClose: () => void
  onApply: () => void
}) {
  const [activeField, setActiveField] = useState<'start' | 'end'>('start')
  const [viewDate, setViewDate] = useState(new Date())

  useEffect(() => {
    setViewDate(activeField === 'start' ? startDate : endDate)
  }, [visible, activeField])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const startDay = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const days: (number | null)[] = []
  for (let i = 0; i < startDay; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)

  const selectedDate = activeField === 'start' ? startDate : endDate

  const isSelectedDay = (d: number) =>
    selectedDate.getDate() === d &&
    selectedDate.getMonth() === month &&
    selectedDate.getFullYear() === year

  const isToday = (d: number) => {
    const t = new Date()
    return t.getDate() === d && t.getMonth() === month && t.getFullYear() === year
  }

  const isInRange = (d: number) => {
    const check = new Date(year, month, d)
    const s = new Date(startDate)
    s.setHours(0, 0, 0, 0)
    const e = new Date(endDate)
    e.setHours(23, 59, 59, 999)
    return check >= s && check <= e
  }

  const handleDayPress = (d: number) => {
    const newDate = new Date(year, month, d)
    if (activeField === 'start') {
      onChangeStart(newDate)
      if (newDate > endDate) {
        onChangeEnd(newDate)
      }
      setActiveField('end')
    } else {
      onChangeEnd(newDate)
      if (newDate < startDate) {
        onChangeStart(newDate)
      }
    }
  }

  const formatFull = (d: Date) =>
    d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={dpStyles.overlay}>
        <View style={dpStyles.sheet}>
          <View style={dpStyles.header}>
            <Text style={dpStyles.headerTitle}>Выберите период</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={dpStyles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            {/* Date fields */}
            <View style={dpStyles.fieldsRow}>
              <TouchableOpacity
                style={[dpStyles.fieldBtn, activeField === 'start' && dpStyles.fieldBtnActive]}
                onPress={() => setActiveField('start')}
              >
                <Text style={dpStyles.fieldLabel}>С</Text>
                <Text style={dpStyles.fieldValue}>{formatFull(startDate)}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dpStyles.fieldBtn, activeField === 'end' && dpStyles.fieldBtnActive]}
                onPress={() => setActiveField('end')}
              >
                <Text style={dpStyles.fieldLabel}>По</Text>
                <Text style={dpStyles.fieldValue}>{formatFull(endDate)}</Text>
              </TouchableOpacity>
            </View>

            {/* Month navigation */}
            <View style={dpStyles.monthRow}>
              <TouchableOpacity
                style={dpStyles.navBtn}
                onPress={() => setViewDate(new Date(year, month - 1, 1))}
              >
                <ChevronLeft size={20} color={Colors.text} />
              </TouchableOpacity>
              <Text style={dpStyles.monthText}>
                {MONTHS[month]} {year}
              </Text>
              <TouchableOpacity
                style={dpStyles.navBtn}
                onPress={() => setViewDate(new Date(year, month + 1, 1))}
              >
                <ChevronRight size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Weekday headers */}
            <View style={dpStyles.weekRow}>
              {WEEKDAYS.map((w) => (
                <Text key={w} style={dpStyles.weekDay}>
                  {w}
                </Text>
              ))}
            </View>

            {/* Days grid */}
            <View style={dpStyles.daysGrid}>
              {days.map((d, i) => (
                <View key={i} style={dpStyles.dayCell}>
                  {d !== null ? (
                    <TouchableOpacity
                      style={[
                        dpStyles.dayBtn,
                        isSelectedDay(d) && dpStyles.dayBtnActive,
                        isToday(d) && !isSelectedDay(d) && dpStyles.dayBtnToday,
                        isInRange(d) && !isSelectedDay(d) && dpStyles.dayBtnInRange,
                      ]}
                      onPress={() => handleDayPress(d)}
                    >
                      <Text
                        style={[
                          dpStyles.dayText,
                          isSelectedDay(d) && dpStyles.dayTextActive,
                          isToday(d) && !isSelectedDay(d) && dpStyles.dayTextToday,
                          isInRange(d) && !isSelectedDay(d) && dpStyles.dayTextInRange,
                        ]}
                      >
                        {d}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}
            </View>

            {/* Actions */}
            <View style={dpStyles.actionsRow}>
              <TouchableOpacity style={dpStyles.cancelBtn} onPress={onClose}>
                <Text style={dpStyles.cancelText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={dpStyles.confirmBtn} onPress={onApply}>
                <Text style={dpStyles.confirmText}>Применить</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const dpStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.text },
  closeText: { fontSize: 18, color: Colors.textMuted, fontWeight: '600' },
  fieldsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  fieldBtn: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fieldBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  fieldLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  fieldValue: { fontSize: 14, fontWeight: '600', color: Colors.text },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  navBtn: { padding: 6 },
  monthText: { fontSize: 16, fontWeight: '600', color: Colors.text },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  weekDay: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  dayCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBtnActive: { backgroundColor: Colors.primary },
  dayBtnToday: { borderWidth: 1, borderColor: Colors.primary },
  dayBtnInRange: { backgroundColor: Colors.primary + '15' },
  dayText: { fontSize: 15, color: Colors.text },
  dayTextActive: { color: Colors.white, fontWeight: '600' },
  dayTextToday: { color: Colors.primary, fontWeight: '600' },
  dayTextInRange: { color: Colors.primary },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: Colors.borderLight,
  },
  cancelText: { fontSize: 15, color: Colors.text, fontWeight: '500' },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  confirmText: { fontSize: 15, color: Colors.white, fontWeight: '600' },
})

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { fontSize: 24, fontWeight: 'bold', color: Colors.text, padding: 16, paddingBottom: 8 },
  periodRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  periodBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  periodText: { fontSize: 13, color: Colors.textMuted },
  periodTextActive: { color: Colors.white, fontWeight: '500' },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  kpiCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    width: '48%',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  changeText: { fontSize: 11, fontWeight: '600' },
  kpiValue: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  kpiLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  card: {
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 12 },
  statusList: { gap: 10 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 100 },
  statusLabel: { fontSize: 13, color: Colors.text },
  statusRight: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'flex-end' },
  progressBg: {
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: 3,
    flex: 1,
    maxWidth: 120,
  },
  progressFill: { height: 6, borderRadius: 3 },
  statusCount: { fontSize: 13, fontWeight: '600', color: Colors.text, width: 28, textAlign: 'right' },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  sourceLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sourceName: { fontSize: 14, color: Colors.text },
  sourceRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sourceRevenue: { fontSize: 14, fontWeight: '600', color: Colors.text },
  sourceShare: { fontSize: 12, color: Colors.textMuted, width: 32, textAlign: 'right' },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  activityContent: { flex: 1 },
  activityText: { fontSize: 14, color: Colors.text },
  activityStatus: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  activityCost: { fontSize: 14, fontWeight: '600', color: Colors.text },
  placeholder: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 8 },
  customRangeLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    paddingHorizontal: 16,
    marginTop: -8,
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginBottom: 16 },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: Colors.background,
    borderRadius: 10,
    marginBottom: 10,
    gap: 12,
  },
  dateFieldLabel: { fontSize: 14, color: Colors.textMuted, width: 30 },
  dateFieldValue: { fontSize: 16, fontWeight: '600', color: Colors.text, flex: 1 },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  modalBtnPrimary: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalBtnPrimaryText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
  modalBtnSecondary: {
    flex: 1,
    backgroundColor: Colors.borderLight,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalBtnSecondaryText: { color: Colors.text, fontSize: 15, fontWeight: '500' },
})
