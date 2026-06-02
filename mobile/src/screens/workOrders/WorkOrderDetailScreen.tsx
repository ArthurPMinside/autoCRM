import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRoute, useNavigation } from '@react-navigation/native'
import { workOrdersApi } from '../../api/workOrders'
import { Colors } from '../../constants/colors'
import { formatCurrency, formatDate } from '../../utils/format'
import { Trash2, Edit3, CheckCircle, Play, XCircle } from 'lucide-react-native'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает',
  in_progress: 'В работе',
  completed: 'Выполнен',
  cancelled: 'Отменён',
}

const STATUS_COLORS: Record<string, string> = {
  pending: Colors.warning,
  in_progress: Colors.info,
  completed: Colors.success,
  cancelled: Colors.danger,
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

  if (isLoading || !order) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Загрузка...</Text>
      </View>
    )
  }

  const clientName = order.client?.name || 'Клиент'
  const vehicleInfo = order.vehicle ? `${order.vehicle.make} ${order.vehicle.model}` : 'Автомобиль'
  const totalCost = order.total_cost || order.service?.price || 0

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.statusBadge}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[order.status] }]}>
            {STATUS_LABELS[order.status]}
          </Text>
        </View>
        <Text style={styles.clientName}>{clientName}</Text>
        <Text style={styles.vehicle}>{vehicleInfo}</Text>
        <Text style={styles.date}>Создан: {formatDate(order.created_at)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Описание</Text>
        <Text style={styles.description}>{order.description || '—'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Стоимость</Text>
        <Text style={styles.price}>{formatCurrency(totalCost)}</Text>
      </View>

      {order.status !== 'completed' && order.status !== 'cancelled' ? (
        <View style={styles.actions}>
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
      ) : null}

      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[styles.bottomBtn, styles.editBtn]}
          onPress={() => (navigation as any).navigate('WorkOrderForm', { id })}
        >
          <Edit3 size={18} color={Colors.primary} />
          <Text style={styles.editText}>Редактировать</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.bottomBtn, styles.deleteBtn]} onPress={() => {
          Alert.alert('Удалить заказ?', '', [
            { text: 'Отмена', style: 'cancel' },
            { text: 'Удалить', style: 'destructive', onPress: () => deleteMutation.mutate() },
          ])
        }}>
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
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
  },
  statusBadge: { alignSelf: 'flex-start', marginBottom: 8 },
  statusText: { fontSize: 14, fontWeight: '600' },
  clientName: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  vehicle: { fontSize: 15, color: Colors.textMuted, marginTop: 4 },
  date: { fontSize: 13, color: Colors.textMuted, marginTop: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: Colors.textMuted, marginBottom: 4 },
  description: { fontSize: 15, color: Colors.text, lineHeight: 20 },
  price: { fontSize: 24, fontWeight: 'bold', color: Colors.text },
  actions: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginTop: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionText: { color: Colors.white, fontWeight: '600' },
  bottomActions: { flexDirection: 'row', gap: 12, margin: 16, marginTop: 24 },
  bottomBtn: {
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
