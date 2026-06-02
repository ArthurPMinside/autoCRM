import React from 'react'
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { financeApi } from '../../api/finance'
import { Colors } from '../../constants/colors'
import { formatCurrency, formatDate } from '../../utils/format'

export function FinanceScreen() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['finance'],
    queryFn: () => financeApi.getAll().then((r) => r.data),
  })

  const transactions = data || []

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowTitle}>{item.description || 'Транзакция'}</Text>
        <Text style={styles.rowDate}>{formatDate(item.date || item.created_at)}</Text>
      </View>
      <Text style={[styles.rowAmount, { color: item.type === 'income' ? Colors.success : Colors.danger }]}>
        {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount || 0)}
      </Text>
    </View>
  )

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Финансы</Text>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 16 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        ListEmptyComponent={<Text style={styles.empty}>Транзакции не найдены</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { fontSize: 24, fontWeight: 'bold', color: Colors.text, padding: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 10,
  },
  rowLeft: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '500', color: Colors.text },
  rowDate: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  rowAmount: { fontSize: 16, fontWeight: '600' },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
})
