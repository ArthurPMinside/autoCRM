import React from 'react'
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { staffApi } from '../../api/staff'
import { Colors } from '../../constants/colors'
import { formatPhone } from '../../utils/format'

export function StaffScreen() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffApi.getAll().then((r) => r.data),
  })

  const staff = data || []

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.row}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.role}>{item.role || 'Сотрудник'}</Text>
      {item.phone ? <Text style={styles.phone}>{formatPhone(item.phone)}</Text> : null}
    </View>
  )

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Персонал</Text>
      <FlatList
        data={staff}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 16 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        ListEmptyComponent={<Text style={styles.empty}>Сотрудники не найдены</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { fontSize: 24, fontWeight: 'bold', color: Colors.text, padding: 16 },
  row: {
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 10,
  },
  name: { fontSize: 16, fontWeight: '600', color: Colors.text },
  role: { fontSize: 14, color: Colors.primary, marginTop: 2 },
  phone: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
})
