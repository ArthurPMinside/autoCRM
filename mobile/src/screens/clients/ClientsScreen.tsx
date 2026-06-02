import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useNavigation } from '@react-navigation/native'
import { clientsApi } from '../../api/clients'
import { Colors } from '../../constants/colors'
import { formatPhone } from '../../utils/format'
import { Search, Plus, Phone, Mail, ChevronRight } from 'lucide-react-native'

export function ClientsScreen() {
  const navigation = useNavigation()
  const [search, setSearch] = useState('')
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getAll().then((r) => r.data),
  })

  const clients = (data || []).filter((c: any) => {
    const q = search.toLowerCase()
    return (
      c.name?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    )
  })

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => (navigation as any).navigate('ClientDetail', { id: item.id })}
    >
      <View style={styles.rowContent}>
        <Text style={styles.name}>{item.name}</Text>
        <View style={styles.metaRow}>
          {item.phone ? (
            <View style={styles.metaItem}>
              <Phone size={12} color={Colors.textMuted} />
              <Text style={styles.metaText}>{formatPhone(item.phone)}</Text>
            </View>
          ) : null}
          {item.email ? (
            <View style={styles.metaItem}>
              <Mail size={12} color={Colors.textMuted} />
              <Text style={styles.metaText}>{item.email}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <ChevronRight size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Клиенты</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => (navigation as any).navigate('ClientForm')}
        >
          <Plus color={Colors.white} size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Search size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск по имени, телефону..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={clients}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 16 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        ListEmptyComponent={
          <Text style={styles.empty}>Клиенты не найдены</Text>
        }
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, marginLeft: 8, color: Colors.text },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 10,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  rowContent: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: Colors.text },
  metaRow: { flexDirection: 'row', marginTop: 4, gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: Colors.textMuted },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
})
