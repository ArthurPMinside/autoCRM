import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRoute, useNavigation } from '@react-navigation/native'
import { workOrdersApi } from '../../api/workOrders'
import { staffApi } from '../../api/staff'
import { smsApi } from '../../api/sms'
import { receiptsApi } from '../../api/receipts'
import { Colors } from '../../constants/colors'
import { formatCurrency, formatDate, formatDateTime, formatPhone } from '../../utils/format'
import {
  Trash2,
  Edit3,
  CheckCircle,
  Play,
  XCircle,
  Clock,
  AlertCircle,
  User,
  Car,
  Wrench,
  Phone,
  Calendar,
  MessageSquare,
  Printer,
  Megaphone,
  FileText,
} from 'lucide-react-native'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает',
  in_progress: 'В работе',
  completed: 'Готово',
  cancelled: 'Отменено',
}

const STATUS_COLORS: Record<string, string> = {
  pending: Colors.warning,
  in_progress: Colors.info,
  completed: Colors.success,
  cancelled: Colors.danger,
}

const STATUS_BG_COLORS: Record<string, string> = {
  pending: '#fffbeb',
  in_progress: '#eff6ff',
  completed: '#f0fdf4',
  cancelled: '#fef2f2',
}

const SOURCE_LABELS: Record<string, string> = {
  direct: 'Прямое обращение',
  repeat: 'Повторный визит',
  yandex: 'Яндекс',
  google: 'Google',
  avito: 'Авито',
  instagram: 'Instagram',
  telegram: 'Telegram',
  referral: 'Рекомендация',
  other: 'Другое',
}

export function WorkOrderDetailScreen() {
  const route = useRoute() as any
  const navigation = useNavigation()
  const queryClient = useQueryClient()
  const { id } = route.params

  const { data: order, isLoading } = useQuery({
    queryKey: ['workOrder', id],
    queryFn: () => workOrdersApi.getById(id).then((r) => r.data),
  })

  const { data: staffList } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffApi.getAll().then((r) => r.data),
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => workOrdersApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrder', id] })
      queryClient.invalidateQueries({ queryKey: ['workOrders'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => workOrdersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] })
      navigation.goBack()
    },
  })

  const sendSmsMutation = useMutation({
    mutationFn: () =>
      smsApi.send({
        phone: order.client?.phone,
        message: `Здравствуйте, ${order.client?.name}! Ваш заказ на ${order.service?.name} ${order.status === 'completed' ? 'готов' : 'в работе'}. Сумма: ${(order.total_cost || 0).toLocaleString('ru-RU')} ₽`,
      }),
  })

  const createReceiptMutation = useMutation({
    mutationFn: () => receiptsApi.create({ work_order_id: id }),
  })

  if (isLoading || !order) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Загрузка...</Text>
      </View>
    )
  }

  const clientName = order.client?.name || 'Клиент'
  const phone = order.client?.phone || ''
  const vehicleInfo = order.vehicle
    ? `${order.vehicle.make} ${order.vehicle.model}`
    : 'Автомобиль'
  const licensePlate = order.vehicle?.license_plate || ''
  const serviceName = order.service?.name || 'Услуга'
  const totalCost = order.total_cost || order.service?.price || 0
  const assignedStaff = staffList?.find((s: any) => s.id === order.staff_id)

  const canChangeStatus = order.status !== 'completed' && order.status !== 'cancelled'
  const isCompleted = order.status === 'completed'

  const handleCall = () => {
    if (phone) Linking.openURL(`tel:${phone}`)
  }

  const handleSms = () => {
    if (!phone) {
      Alert.alert('Ошибка', 'У клиента не указан номер телефона')
      return
    }
    sendSmsMutation.mutate(undefined, {
      onSuccess: () => Alert.alert('Успешно', 'SMS отправлено'),
      onError: () => Alert.alert('Ошибка', 'Не удалось отправить SMS'),
    })
  }

  const handleReceipt = () => {
    createReceiptMutation.mutate(undefined, {
      onSuccess: () => Alert.alert('Успешно', 'Чек создан'),
      onError: () => Alert.alert('Ошибка', 'Не удалось создать чек'),
    })
  }

  const handleDelete = () => {
    Alert.alert('Удалить заказ?', 'Это действие нельзя отменить', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ])
  }

  const getStatusIcon = (status: string, size = 14) => {
    const color = STATUS_COLORS[status] || Colors.textMuted
    switch (status) {
      case 'pending':
        return <Clock size={size} color={color} />
      case 'in_progress':
        return <AlertCircle size={size} color={color} />
      case 'completed':
        return <CheckCircle size={size} color={color} />
      case 'cancelled':
        return <XCircle size={size} color={color} />
      default:
        return <Clock size={size} color={color} />
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Main info card */}
      <View style={styles.card}>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_BG_COLORS[order.status] || '#f1f5f9' }]}>
          {getStatusIcon(order.status, 14)}
          <Text style={[styles.statusText, { color: STATUS_COLORS[order.status] || Colors.textMuted }]}>
            {STATUS_LABELS[order.status]}
          </Text>
        </View>

        <Text style={styles.clientName}>{clientName}</Text>

        <View style={styles.infoRow}>
          <Car size={15} color={Colors.textMuted} />
          <Text style={styles.infoText}>
            {vehicleInfo}
            {licensePlate ? ` · ${licensePlate}` : ''}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Wrench size={15} color={Colors.textMuted} />
          <Text style={styles.infoText}>{serviceName}</Text>
        </View>

        {phone ? (
          <TouchableOpacity style={styles.infoRow} onPress={handleCall}>
            <Phone size={15} color={Colors.primary} />
            <Text style={[styles.infoText, { color: Colors.primary }]}>{formatPhone(phone)}</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.infoRow}>
          <Calendar size={15} color={Colors.textMuted} />
          <Text style={styles.infoText}>Дата и время записи: {formatDate(order.created_at)}</Text>
        </View>

        {order.scheduled_date ? (
          <View style={styles.infoRow}>
            <Clock size={15} color={Colors.textMuted} />
            <Text style={styles.infoText}>
              Плановая дата готовности: {formatDateTime(order.scheduled_date)}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Details card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Детали заказа</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Механик</Text>
          <View style={styles.staffSelector}>
            <User size={14} color={Colors.textMuted} />
            <Text style={styles.staffName}>{assignedStaff?.name || 'Не назначен'}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {order.source ? (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Источник</Text>
              <View style={styles.infoRow}>
                <Megaphone size={14} color={Colors.textMuted} />
                <Text style={styles.detailValue}>{SOURCE_LABELS[order.source] || order.source}</Text>
              </View>
            </View>
            <View style={styles.divider} />
          </>
        ) : null}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Описание</Text>
        </View>
        <View style={styles.infoRow}>
          <FileText size={14} color={Colors.textMuted} />
          <Text style={styles.detailValue}>{order.description || '—'}</Text>
        </View>
      </View>

      {/* Price card */}
      <View style={[styles.card, styles.priceCard]}>
        <Text style={styles.priceLabel}>Итого</Text>
        <Text style={styles.priceValue}>{formatCurrency(totalCost)}</Text>
      </View>

      {/* Status actions */}
      {canChangeStatus && (
        <View style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Изменить статус</Text>
          <View style={styles.actionsRow}>
            {order.status === 'pending' ? (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: Colors.info }]}
                onPress={() => statusMutation.mutate('in_progress')}
              >
                <Play size={18} color={Colors.white} />
                <Text style={styles.actionText}>В работу</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: Colors.success }]}
                onPress={() => statusMutation.mutate('completed')}
              >
                <CheckCircle size={18} color={Colors.white} />
                <Text style={styles.actionText}>Завершить</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: Colors.danger }]}
              onPress={() => statusMutation.mutate('cancelled')}
            >
              <XCircle size={18} color={Colors.white} />
              <Text style={styles.actionText}>Отменить</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Additional actions */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Действия</Text>
        <View style={styles.extraActions}>
          <TouchableOpacity style={styles.extraBtn} onPress={handleSms}>
            <View style={[styles.extraIcon, { backgroundColor: '#e0f2fe' }]}>
              <MessageSquare size={18} color="#0284c7" />
            </View>
            <Text style={styles.extraText}>SMS</Text>
          </TouchableOpacity>

          {isCompleted && (
            <TouchableOpacity style={styles.extraBtn} onPress={handleReceipt}>
              <View style={[styles.extraIcon, { backgroundColor: '#f3f4f6' }]}>
                <Printer size={18} color="#4b5563" />
              </View>
              <Text style={styles.extraText}>Чек</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.extraBtn}
            onPress={() => (navigation as any).navigate('WorkOrderForm', { id })}
          >
            <View style={[styles.extraIcon, { backgroundColor: '#eff6ff' }]}>
              <Edit3 size={18} color={Colors.primary} />
            </View>
            <Text style={styles.extraText}>Изменить</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.extraBtn} onPress={handleDelete}>
            <View style={[styles.extraIcon, { backgroundColor: '#fef2f2' }]}>
              <Trash2 size={18} color={Colors.danger} />
            </View>
            <Text style={[styles.extraText, { color: Colors.danger }]}>Удалить</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loading: { textAlign: 'center', marginTop: 40, color: Colors.textMuted, fontSize: 16 },
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
  statusBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusText: { fontSize: 13, fontWeight: '600' },
  clientName: { fontSize: 22, fontWeight: 'bold', color: Colors.text, marginBottom: 10 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  infoText: { fontSize: 14, color: Colors.textMuted, flex: 1 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: Colors.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.3 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: { fontSize: 14, color: Colors.textMuted },
  detailValue: { fontSize: 14, color: Colors.text, flex: 1, marginLeft: 8 },
  staffSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  staffName: { fontSize: 14, color: Colors.text, fontWeight: '500' },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 8,
  },
  priceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eff6ff',
  },
  priceLabel: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  priceValue: { fontSize: 24, fontWeight: 'bold', color: Colors.primary },
  actionsCard: {
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
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionText: { color: Colors.white, fontWeight: '600', fontSize: 14 },
  extraActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  extraBtn: {
    alignItems: 'center',
    gap: 6,
    width: 72,
  },
  extraIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  extraText: { fontSize: 12, color: Colors.text, fontWeight: '500' },
})
