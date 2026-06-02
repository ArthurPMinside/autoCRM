import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../../api/dashboard'
import { Colors } from '../../constants/colors'
import { formatCurrency } from '../../utils/format'
import { Users, Wrench, TrendingUp, DollarSign } from 'lucide-react-native'

export function DashboardScreen() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.getStats().then((r) => r.data),
  })

  const stats = data || {}

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
    >
      <Text style={styles.header}>Панель управления</Text>

      <View style={styles.statsGrid}>
        <StatCard
          icon={<Users color={Colors.primary} size={24} />}
          label="Клиентов"
          value={stats.total_clients ?? 0}
        />
        <StatCard
          icon={<Wrench color={Colors.warning} size={24} />}
          label="Заказов"
          value={stats.total_work_orders ?? 0}
        />
        <StatCard
          icon={<TrendingUp color={Colors.success} size={24} />}
          label="Выполнено"
          value={stats.completed_work_orders ?? 0}
        />
        <StatCard
          icon={<DollarSign color={Colors.info} size={24} />}
          label="Выручка"
          value={formatCurrency(stats.total_revenue ?? 0)}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Активность</Text>
        <Text style={styles.placeholder}>График активности будет здесь</Text>
      </View>
    </ScrollView>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardIcon}>{icon}</View>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { fontSize: 24, fontWeight: 'bold', color: Colors.text, padding: 16, paddingBottom: 8 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    width: '48%',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardIcon: { marginBottom: 8 },
  cardValue: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  cardLabel: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  section: { padding: 16, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: Colors.text, marginBottom: 12 },
  placeholder: { color: Colors.textMuted, fontSize: 14 },
})
