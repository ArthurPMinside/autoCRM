import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useNavigation } from '@react-navigation/native'
import { workOrdersApi } from '../../api/workOrders'
import { Colors } from '../../constants/colors'
import { formatCurrency, formatDate } from '../../utils/format'
import { Plus, ChevronRight, Circle } from 'lucide-react-native'

const STATUS_COLORS: Record<string, string> = {
  pending: Colors.warning,
  in_progress: Colors.info,
  completed: Colors.success,
  cancelled: Colors.danger,
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает',
  in_progress: 'В работе',
  completed: 'Выполнен',
  cancelled: 'Отменён',
}

export function WorkOrdersScreen() {
  const navigation = useNavigation()
  const [filter, setFilter] = useState<string | null>(null)
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['workOrders'],
    queryFn: () => workOrdersApi.getAll().then((r) => r.data),
  })

  const orders = (data || []).filter((o: any) => (filter ? o.status === filter : true))

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => (navigation as any).navigate('WorkOrderDetail', { id: item.id })}
    >
      <View style={styles.rowLeft}>
        <Circle size={10} color={STATUS_COLORS[item.status] || Colors.textMuted} fill={STATUS_COLORS[item.status]} />
        <View style={styles.rowContent}>
          <Text style={styles.rowTitle}>{item.client_name || 'Клиент'}</Text>
          <Text style={styles.rowSubtitle}>
            {item.vehicle_info || 'Авто'} · {formatDate(item.created_at)}
          </Text>
        </View>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowPrice}>{formatCurrency(item.total || 0)}</Text>
        <ChevronRight size={16} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Заказы</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => (navigation as any).navigate('WorkOrderForm')}
        >
          <Plus color={Colors.white} size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        {[
          { key: null, label: 'Все' },
          { key: 'pending', label: 'Ожидают' },
          { key: 'in_progress', label: 'В работе' },
          { key: 'completed', label: 'Выполнены' },
        ].map((f) => (
          <TouchableOpacity
            key={f.label}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            onPress={() => setFilter(f.key as any)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 16 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        ListEmptyComponent={<Text style={styles.empty}>Заказы не найдены</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.text },
  addBtn: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 13, color: Colors.textMuted },
  filterTextActive: { color: Colors.white, fontWeight: '500' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 10,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
  rowSubtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowPrice: { fontSize: 15, fontWeight: '600', color: Colors.text },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
})
