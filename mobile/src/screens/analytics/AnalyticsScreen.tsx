import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../../api/analytics'
import { Colors } from '../../constants/colors'
import { formatCurrency } from '../../utils/format'

export function AnalyticsScreen() {
  const { data: rfmData } = useQuery({
    queryKey: ['analytics', 'rfm'],
    queryFn: () => analyticsApi.getRfm().then((r) => r.data),
  })

  const { data: revenueData } = useQuery({
    queryKey: ['analytics', 'revenue'],
    queryFn: () => analyticsApi.getRevenue().then((r) => r.data),
  })

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Аналитика</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>RFM-сегментация</Text>
        {rfmData ? (
          Object.entries(rfmData).map(([segment, count]: [string, any]) => (
            <View key={segment} style={styles.statRow}>
              <Text style={styles.statLabel}>{segment}</Text>
              <Text style={styles.statValue}>{count} клиентов</Text>
            </View>
          ))
        ) : (
          <Text style={styles.placeholder}>Нет данных</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Выручка</Text>
        {revenueData ? (
          <Text style={styles.bigValue}>{formatCurrency(revenueData.total || 0)}</Text>
        ) : (
          <Text style={styles.placeholder}>Нет данных</Text>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { fontSize: 24, fontWeight: 'bold', color: Colors.text, padding: 16 },
  card: {
    backgroundColor: Colors.card,
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 12 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  statLabel: { fontSize: 14, color: Colors.text },
  statValue: { fontSize: 14, fontWeight: '500', color: Colors.textMuted },
  bigValue: { fontSize: 28, fontWeight: 'bold', color: Colors.text },
  placeholder: { color: Colors.textMuted, fontSize: 14 },
})
