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
import { clientsApi } from '../../api/clients'
import { workOrdersApi } from '../../api/workOrders'
import { Colors } from '../../constants/colors'
import { formatPhone, formatDate, formatDateTime, formatCurrency } from '../../utils/format'
import {
  Phone,
  Mail,
  Calendar,
  Car,
  Trash2,
  Edit3,
  Wrench,
  ChevronRight,
} from 'lucide-react-native'

export function ClientDetailScreen() {
  const route = useRoute() as any
  const navigation = useNavigation()
  const { id } = route.params
  const queryClient = useQueryClient()

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsApi.getById(id).then((r) => r.data),
  })

  const { data: allOrders } = useQuery({
    queryKey: ['workOrders'],
    queryFn: () => workOrdersApi.getAll().then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: () => clientsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      navigation.goBack()
    },
  })

  const handleDelete = () => {
    Alert.alert('Удалить клиента?', 'Это действие нельзя отменить', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ])
  }

  const handleCall = (phone: string) => {
    const url = `tel:${phone}`
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url)
      } else {
        Alert.alert('Ошибка', 'Не удалось открыть приложение для звонков')
      }
    })
  }

  const clientOrders =
    allOrders?.filter((o: any) => o.client?.id === id).sort(
      (a: any, b: any) =>
        new Date(b.scheduled_date || b.created_at).getTime() -
        new Date(a.scheduled_date || a.created_at).getTime()
    ) || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return Colors.warning
      case 'in_progress':
        return Colors.info
      case 'completed':
        return Colors.success
      case 'cancelled':
        return Colors.danger
      default:
        return Colors.textMuted
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

  if (isLoading || !client) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Загрузка...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.name}>{client.name}</Text>

        {client.phone ? (
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => handleCall(client.phone)}
            activeOpacity={0.7}
          >
            <Phone size={16} color={Colors.primary} />
            <Text style={[styles.infoText, styles.phoneText]}>
              {formatPhone(client.phone)}
            </Text>
            <Text style={styles.callHint}>Позвонить</Text>
          </TouchableOpacity>
        ) : null}

        {client.email ? (
          <View style={styles.infoRow}>
            <Mail size={16} color={Colors.primary} />
            <Text style={styles.infoText}>{client.email}</Text>
          </View>
        ) : null}

        <View style={styles.infoRow}>
          <Calendar size={16} color={Colors.textMuted} />
          <Text style={styles.infoText}>Создан: {formatDate(client.created_at)}</Text>
        </View>
      </View>

      {client.vehicles?.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Автомобили</Text>
          {client.vehicles.map((v: any) => (
            <View key={v.id} style={styles.vehicleCard}>
              <Car size={16} color={Colors.primary} />
              <Text style={styles.vehicleText}>
                {v.make} {v.model} {v.year ? `(${v.year})` : ''}
                {v.license_plate ? ` — ${v.license_plate}` : ''}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Order History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          История заказов {clientOrders.length > 0 ? `(${clientOrders.length})` : ''}
        </Text>
        {clientOrders.length === 0 ? (
          <Text style={styles.emptyHistory}>Заказов пока нет</Text>
        ) : (
          clientOrders.map((order: any) => (
            <TouchableOpacity
              key={order.id}
              style={styles.historyCard}
              onPress={() =>
                (navigation as any).navigate('WorkOrders', {
                  screen: 'WorkOrderDetail',
                  params: { id: order.id },
                })
              }
            >
              <View style={styles.historyHeader}>
                <View style={styles.historyLeft}>
                  <Wrench size={14} color={Colors.textMuted} />
                  <Text style={styles.historyDate}>
                    {order.scheduled_date
                      ? formatDate(order.scheduled_date)
                      : formatDate(order.created_at)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: getStatusColor(order.status) + '22' },
                  ]}
                >
                  <Text
                    style={[styles.statusPillText, { color: getStatusColor(order.status) }]}
                  >
                    {getStatusLabel(order.status)}
                  </Text>
                </View>
              </View>
              <Text style={styles.historyService}>{order.service?.name || 'Услуга'}</Text>
              <View style={styles.historyMetaRow}>
                <Text style={styles.historyMeta}>
                  {order.vehicle?.make} {order.vehicle?.model}
                </Text>
                <Text style={styles.historyCost}>{formatCurrency(order.total_cost || 0)}</Text>
              </View>
              <Text style={styles.historyCreated}>
                Дата и время записи: {formatDateTime(order.created_at)}
              </Text>
              {order.scheduled_date && (
                <Text style={styles.historyPlanned}>
                  Плановая дата готовности: {formatDateTime(order.scheduled_date)}
                </Text>
              )}
              {order.staff_id && (
                <Text style={styles.historyStaff}>Мастер: {order.staff_id}</Text>
              )}
              <Text style={styles.historySource}>Источник: {order.source || 'direct'}</Text>
              <ChevronRight
                size={16}
                color={Colors.textMuted}
                style={styles.historyArrow}
              />
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.editBtn]}
          onPress={() => (navigation as any).navigate('ClientForm', { id })}
        >
          <Edit3 size={18} color={Colors.primary} />
          <Text style={styles.editText}>Редактировать</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={handleDelete}>
          <Trash2 size={18} color={Colors.danger} />
          <Text style={styles.deleteText}>Удалить</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loading: { textAlign: 'center', marginTop: 40, color: Colors.textMuted },
  card: {
    backgroundColor: Colors.card,
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  name: { fontSize: 22, fontWeight: 'bold', color: Colors.text, marginBottom: 12 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: { fontSize: 15, color: Colors.text, flex: 1 },
  phoneText: { color: Colors.primary, fontWeight: '600' },
  callHint: { fontSize: 12, color: Colors.success, fontWeight: '500' },
  section: { marginHorizontal: 16, marginTop: 8, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  vehicleText: { fontSize: 15, color: Colors.text },
  emptyHistory: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  historyCard: {
    backgroundColor: Colors.card,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  historyLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  historyDate: { fontSize: 13, color: Colors.textMuted },
  statusPill: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusPillText: { fontSize: 11, fontWeight: '600' },
  historyService: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  historyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  historyMeta: { fontSize: 13, color: Colors.textMuted },
  historyCost: { fontSize: 14, fontWeight: '700', color: Colors.text },
  historyCreated: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  historyPlanned: { fontSize: 12, color: Colors.primary, marginTop: 2 },
  historyStaff: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  historySource: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  historyArrow: { position: 'absolute', right: 12, top: '50%', marginTop: -8 },
  actions: { flexDirection: 'row', gap: 12, margin: 16, marginTop: 24, marginBottom: 32 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  editBtn: { borderColor: Colors.primary, backgroundColor: Colors.card },
  editText: { color: Colors.primary, fontWeight: '600' },
  deleteBtn: { borderColor: Colors.danger, backgroundColor: Colors.card },
  deleteText: { color: Colors.danger, fontWeight: '600' },
})
