import React, { useState, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { useNavigation } from '@react-navigation/native'
import { workOrdersApi } from '../../api/workOrders'
import { staffApi } from '../../api/staff'
import { Colors } from '../../constants/colors'
import { formatCurrency } from '../../utils/format'
import { ChevronLeft, ChevronRight, Plus, Clock, User } from 'lucide-react-native'

const START_HOUR = 8
const END_HOUR = 20
const SLOT_MINUTES = 60
const SLOT_HEIGHT = 60
const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatWeekRange(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6)
  const startStr = weekStart.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  const endStr = weekEnd.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  return `${startStr} — ${endStr}`
}

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

interface ScheduledOrder {
  id: string
  client: any
  vehicle: any
  service: any
  staff_id?: string
  status: string
  total_cost: number
  startMinutes: number
  endMinutes: number
  durationHours: number
}

export function ScheduleScreen() {
  const navigation = useNavigation()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const today = new Date()
    return today.getDay() === 0 ? 6 : today.getDay() - 1
  })
  const [refreshing, setRefreshing] = useState(false)

  const weekStart = getWeekStart(currentDate)

  const timeSlots = useMemo(() => {
    const slots: string[] = []
    for (let m = START_HOUR * 60; m < END_HOUR * 60; m += SLOT_MINUTES) {
      slots.push(minutesToTime(m))
    }
    return slots
  }, [])

  const {
    data: orders,
    isLoading: ordersLoading,
    refetch,
  } = useQuery({
    queryKey: ['workOrders'],
    queryFn: async () => {
      const res = await workOrdersApi.getAll()
      return res.data as any[]
    },
  })

  const { data: staff } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const res = await staffApi.getAll()
      return res.data as any[]
    },
  })

  const getStaffName = useCallback(
    (staffId?: string) => {
      if (!staffId) return null
      const s = staff?.find((m: any) => m.id === staffId)
      return s?.name?.split(' ')[0] || null
    },
    [staff]
  )

  const ordersByDay = useMemo(() => {
    const result: ScheduledOrder[][] = Array.from({ length: 7 }, () => [])
    if (!orders) return result

    for (const order of orders) {
      if (!order.scheduled_date) continue
      if (order.status === 'cancelled') continue
      const orderDate = new Date(order.scheduled_date)
      const dayIndex = orderDate.getDay() === 0 ? 6 : orderDate.getDay() - 1
      const slotDate = addDays(weekStart, dayIndex)
      if (!isSameDay(orderDate, slotDate)) continue

      const startMinutes = orderDate.getHours() * 60 + orderDate.getMinutes()
      const durationHours = order.service?.duration || 1
      const endMinutes = startMinutes + durationHours * 60

      result[dayIndex].push({
        ...order,
        startMinutes,
        endMinutes,
        durationHours,
      })
    }
    return result
  }, [orders, weekStart])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return { bg: '#fef3c7', text: '#92400e', border: '#fde68a' }
      case 'in_progress':
        return { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' }
      case 'completed':
        return { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0' }
      case 'cancelled':
        return { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' }
      default:
        return { bg: Colors.borderLight, text: Colors.text, border: Colors.border }
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Ожидает'
      case 'in_progress':
        return 'В работе'
      case 'completed':
        return 'Готово'
      case 'cancelled':
        return 'Отменено'
      default:
        return status
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const weekOrderCount = useMemo(() => {
    if (!orders) return 0
    return orders.filter((o: any) => {
      if (!o.scheduled_date) return false
      if (o.status === 'cancelled') return false
      const d = new Date(o.scheduled_date)
      return d >= weekStart && d < addDays(weekStart, 7)
    }).length
  }, [orders, weekStart])

  const handleSlotPress = (dayIndex: number, time: string) => {
    const slotDate = addDays(weekStart, dayIndex)
    const [slotHour] = time.split(':').map(Number)
    const slotDateTime = new Date(slotDate)
    slotDateTime.setHours(slotHour, 0, 0, 0)
    const initialDateStr = `${slotDateTime.getFullYear()}-${pad(slotDateTime.getMonth() + 1)}-${pad(slotDateTime.getDate())}T${pad(slotDateTime.getHours())}:00`
    ;(navigation as any).navigate('WorkOrders', {
      screen: 'WorkOrderForm',
      params: { initialDate: initialDateStr },
    })
  }

  const handleOrderPress = (order: ScheduledOrder) => {
    ;(navigation as any).navigate('WorkOrders', {
      screen: 'WorkOrderForm',
      params: { id: order.id },
    })
  }

  const handleNewOrder = () => {
    const now = new Date()
    const initialDateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:00`
    ;(navigation as any).navigate('WorkOrders', {
      screen: 'WorkOrderForm',
      params: { initialDate: initialDateStr },
    })
  }

  const dayOrders = ordersByDay[selectedDayIndex]
  const scheduleHeight = (END_HOUR - START_HOUR) * SLOT_HEIGHT

  if (ordersLoading && !orders) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
    <ScrollView
      style={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Расписание</Text>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={handleNewOrder}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Plus size={16} color={Colors.white} />
          <Text style={styles.newBtnText}>Новая запись</Text>
        </TouchableOpacity>
      </View>

      {/* Week Navigation */}
      <View style={styles.weekNav}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => setCurrentDate(addDays(currentDate, -7))}
        >
          <ChevronLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.weekInfo}>
          <Text style={styles.weekRange}>{formatWeekRange(weekStart)}</Text>
          <Text style={styles.weekCount}>{weekOrderCount} записей на неделе</Text>
        </View>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => setCurrentDate(addDays(currentDate, 7))}
        >
          <ChevronRight size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Day Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daySelector}
      >
        {Array.from({ length: 7 }, (_, i) => {
          const dayDate = addDays(weekStart, i)
          const isToday = isSameDay(dayDate, new Date())
          const isSelected = i === selectedDayIndex
          const dayOrders = ordersByDay[i]
          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.dayPill,
                isSelected && styles.dayPillActive,
                isToday && !isSelected && styles.dayPillToday,
              ]}
              onPress={() => setSelectedDayIndex(i)}
            >
              <Text
                style={[
                  styles.dayPillDay,
                  isSelected && styles.dayPillTextActive,
                  isToday && !isSelected && styles.dayPillTextToday,
                ]}
              >
                {weekDays[i]}
              </Text>
              <Text
                style={[
                  styles.dayPillDate,
                  isSelected && styles.dayPillTextActive,
                  isToday && !isSelected && styles.dayPillTextToday,
                ]}
              >
                {dayDate.getDate()}
              </Text>
              {dayOrders.length > 0 && (
                <View style={styles.dayBadge}>
                  <Text style={styles.dayBadgeText}>{dayOrders.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {/* Schedule Grid */}
      <View style={styles.scheduleGrid}>
        {/* Time labels column */}
        <View style={styles.timeColumn}>
          {timeSlots.map((time) => (
            <View key={time} style={[styles.timeCell, { height: SLOT_HEIGHT }]}>
              <Clock size={14} color={Colors.textMuted} />
              <Text style={styles.timeText}>{time}</Text>
            </View>
          ))}
        </View>

        {/* Orders column */}
        <View style={[styles.ordersColumn, { height: scheduleHeight }]}>
          {/* Hour grid lines */}
          {timeSlots.map((time, index) => (
            <View
              key={`grid-${time}`}
              style={[
                styles.gridLine,
                { top: index * SLOT_HEIGHT },
              ]}
            />
          ))}

          {/* Empty slot click areas */}
          {timeSlots.map((time, index) => {
            const slotMinutes = timeToMinutes(time)
            const hasOrder = dayOrders.some(
              (o) => o.startMinutes <= slotMinutes && slotMinutes < o.endMinutes
            )
            if (hasOrder) return null
            return (
              <TouchableOpacity
                key={`empty-${time}`}
                style={[
                  styles.emptySlotArea,
                  { top: index * SLOT_HEIGHT, height: SLOT_HEIGHT },
                ]}
                onPress={() => handleSlotPress(selectedDayIndex, time)}
                activeOpacity={0.7}
              >
                <Text style={styles.emptySlot}>+ Добавить</Text>
              </TouchableOpacity>
            )
          })}

          {/* Order cards */}
          {dayOrders.map((order) => {
            const colors = getStatusColor(order.status)
            const top = ((order.startMinutes - START_HOUR * 60) / 60) * SLOT_HEIGHT
            const height = order.durationHours * SLOT_HEIGHT
            return (
              <TouchableOpacity
                key={order.id}
                style={[
                  styles.orderCard,
                  {
                    top,
                    height: height - 4,
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleOrderPress(order)}
                activeOpacity={0.9}
              >
                <View style={styles.orderHeader}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor:
                          order.status === 'in_progress'
                            ? Colors.info
                            : order.status === 'completed'
                            ? Colors.success
                            : order.status === 'cancelled'
                            ? Colors.danger
                            : Colors.warning,
                      },
                    ]}
                  />
                  <Text style={[styles.orderClient, { color: colors.text }]}>
                    {order.client?.name?.split(' ')[0] || 'Клиент'}
                  </Text>
                </View>
                <Text style={[styles.orderVehicle, { color: colors.text }]}>
                  {order.vehicle?.make} {order.vehicle?.model}
                </Text>
                {getStaffName(order.staff_id) && (
                  <View style={styles.orderStaffRow}>
                    <User size={10} color={colors.text} />
                    <Text style={[styles.orderStaff, { color: colors.text }]}>
                      {getStaffName(order.staff_id)}
                    </Text>
                  </View>
                )}
                <View style={styles.orderFooter}>
                  <Text style={[styles.orderCost, { color: colors.text }]}>
                    {formatCurrency(order.total_cost || 0)}
                  </Text>
                  <Text style={[styles.orderDuration, { color: colors.text }]}>
                    {order.durationHours}ч
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: colors.border },
                  ]}
                >
                  <Text style={[styles.statusBadgeText, { color: colors.text }]}>
                    {getStatusLabel(order.status)}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.text },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  newBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navBtn: { padding: 6 },
  weekInfo: { alignItems: 'center' },
  weekRange: { fontSize: 16, fontWeight: '600', color: Colors.text },
  weekCount: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  daySelector: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  dayPill: {
    width: 52,
    height: 64,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayPillToday: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  dayPillDay: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },
  dayPillDate: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginTop: 2 },
  dayPillTextActive: { color: Colors.white },
  dayPillTextToday: { color: Colors.primary },
  dayBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBadgeText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
  scheduleGrid: {
    marginHorizontal: 16,
    marginTop: 8,
    flexDirection: 'row',
  },
  timeColumn: {
    width: 64,
    borderRightWidth: 1,
    borderRightColor: Colors.borderLight,
  },
  timeCell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.borderLight,
    gap: 4,
  },
  timeText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  ordersColumn: {
    flex: 1,
    position: 'relative',
    backgroundColor: Colors.card,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  emptySlotArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  emptySlot: { fontSize: 13, color: Colors.textMuted },
  orderCard: {
    position: 'absolute',
    left: 4,
    right: 4,
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    overflow: 'hidden',
  },
  orderHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  orderClient: { fontSize: 14, fontWeight: '600' },
  orderVehicle: { fontSize: 12, opacity: 0.85, marginBottom: 2 },
  orderStaffRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  orderStaff: { fontSize: 11, opacity: 0.7 },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  orderCost: { fontSize: 13, fontWeight: '700' },
  orderDuration: { fontSize: 12, opacity: 0.8 },
  statusBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusBadgeText: { fontSize: 10, fontWeight: '600' },
})
