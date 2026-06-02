import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { servicesApi } from '../../api/services'
import { Colors } from '../../constants/colors'
import { formatCurrency } from '../../utils/format'
import { Plus, X, Edit3, Trash2 } from 'lucide-react-native'

export function ServicesScreen() {
  const queryClient = useQueryClient()
  const [modalVisible, setModalVisible] = useState(false)
  const [editingService, setEditingService] = useState<any>(null)

  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [duration, setDuration] = useState('')
  const [category, setCategory] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.getAll().then((r) => r.data),
  })

  const services = data || []

  const createMutation = useMutation({
    mutationFn: (payload: any) => servicesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => servicesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => servicesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })

  const openCreate = () => {
    setEditingService(null)
    setName('')
    setPrice('')
    setDuration('')
    setCategory('')
    setModalVisible(true)
  }

  const openEdit = (item: any) => {
    setEditingService(item)
    setName(item.name || '')
    setPrice(item.price ? String(item.price) : '')
    setDuration(item.duration ? String(item.duration) : '')
    setCategory(item.category || '')
    setModalVisible(true)
  }

  const closeModal = () => {
    setModalVisible(false)
    setEditingService(null)
  }

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Ошибка', 'Введите название услуги')
      return
    }
    const payload = {
      name: name.trim(),
      price: price ? parseFloat(price) : 0,
      duration: duration ? parseFloat(duration) : 1,
      category: category.trim() || undefined,
    }
    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = (item: any) => {
    Alert.alert('Удалить услугу?', item.name, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(item.id),
      },
    ])
  }

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.row}>
      <View style={styles.rowContent}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>
          {item.category || 'Услуга'} • {item.duration || 1}ч
        </Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.price}>{formatCurrency(item.price || 0)}</Text>
        <View style={styles.rowActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => openEdit(item)}
          >
            <Edit3 size={16} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => handleDelete(item)}
          >
            <Trash2 size={16} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Услуги</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Plus size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 16 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        ListEmptyComponent={<Text style={styles.empty}>Услуги не найдены</Text>}
      />

      {/* Create/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.sheet}>
            <View style={modalStyles.header}>
              <Text style={modalStyles.headerTitle}>
                {editingService ? 'Редактировать услугу' : 'Новая услуга'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <X size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={modalStyles.form}>
              <View style={modalStyles.field}>
                <Text style={modalStyles.label}>Название *</Text>
                <TextInput
                  style={modalStyles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Например, Замена масла"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={modalStyles.row}>
                <View style={[modalStyles.field, { flex: 1 }]}>
                  <Text style={modalStyles.label}>Стоимость (₽)</Text>
                  <TextInput
                    style={modalStyles.input}
                    value={price}
                    onChangeText={setPrice}
                    placeholder="0"
                    keyboardType="numeric"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
                <View style={[modalStyles.field, { flex: 1 }]}>
                  <Text style={modalStyles.label}>Длительность (ч)</Text>
                  <TextInput
                    style={modalStyles.input}
                    value={duration}
                    onChangeText={setDuration}
                    placeholder="1"
                    keyboardType="numeric"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </View>

              <View style={modalStyles.field}>
                <Text style={modalStyles.label}>Категория</Text>
                <TextInput
                  style={modalStyles.input}
                  value={category}
                  onChangeText={setCategory}
                  placeholder="Например, ТО"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <TouchableOpacity
                style={[
                  modalStyles.saveBtn,
                  !name.trim() && modalStyles.disabledBtn,
                ]}
                onPress={handleSave}
                disabled={!name.trim() || createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={modalStyles.saveText}>
                    {editingService ? 'Сохранить' : 'Создать'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  header: { fontSize: 24, fontWeight: 'bold', color: Colors.text },
  addBtn: {
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowContent: { flex: 1 },
  name: { fontSize: 15, fontWeight: '500', color: Colors.text },
  meta: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  rowRight: { alignItems: 'flex-end', marginLeft: 12 },
  price: { fontSize: 15, fontWeight: '600', color: Colors.text },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
})

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.text },
  form: { padding: 16, gap: 12 },
  field: {},
  label: { fontSize: 13, color: Colors.textMuted, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: Colors.card,
    color: Colors.text,
  },
  row: { flexDirection: 'row', gap: 12 },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledBtn: { opacity: 0.5 },
  saveText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
})
