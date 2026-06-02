import React from 'react'
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { warehouseApi } from '../../api/warehouse'
import { Colors } from '../../constants/colors'
import { formatCurrency } from '../../utils/format'

export function WarehouseScreen() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['warehouse'],
    queryFn: () => warehouseApi.getParts().then((r) => r.data),
  })

  const parts = data || []

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.row}>
      <View>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>Артикул: {item.sku || '—'} · Остаток: {item.quantity || 0}</Text>
      </View>
      <Text style={styles.price}>{formatCurrency(item.price || 0)}</Text>
    </View>
  )

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Склад</Text>
      <FlatList
        data={parts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 16 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        ListEmptyComponent={<Text style={styles.empty}>Запчасти не найдены</Text>}
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
  name: { fontSize: 15, fontWeight: '500', color: Colors.text },
  meta: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  price: { fontSize: 15, fontWeight: '600', color: Colors.text },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
})
