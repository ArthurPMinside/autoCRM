import React, { useState, useEffect, useMemo } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRoute, useNavigation } from '@react-navigation/native'
import { workOrdersApi } from '../../api/workOrders'
import { clientsApi } from '../../api/clients'
import { vehiclesApi } from '../../api/vehicles'
import { servicesApi } from '../../api/services'
import { Colors } from '../../constants/colors'
import { formatCurrency } from '../../utils/format'
import VehicleSelector, { VehicleSelection } from '../../components/VehicleSelector'
import {
  Search,
  Plus,
  X,
  User,
  Car,
  Wrench,
  Calendar,
  Megaphone,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react-native'

export function WorkOrderFormScreen() {
  const route = useRoute() as any
  const navigation = useNavigation()
  const queryClient = useQueryClient()
  const orderId = route.params?.id
  const initialDate = route.params?.initialDate

  const { data: existingOrder } = useQuery({
    queryKey: ['workOrder', orderId],
    queryFn: () => workOrdersApi.getById(orderId).then((r) => r.data),
    enabled: !!orderId,
  })

  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getAll().then((r) => r.data),
  })

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehiclesApi.getAll().then((r) => r.data),
  })

  const { data: servicesData } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.getAll().then((r) => r.data),
  })

  const [clientId, setClientId] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [description, setDescription] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [source, setSource] = useState('direct')
  const [searchClient, setSearchClient] = useState('')
  const [showNewClient, setShowNewClient] = useState(false)
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '' })
  const [showNewVehicle, setShowNewVehicle] = useState(false)
  const [newVehicle, setNewVehicle] = useState<VehicleSelection>({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    license_plate: '',
    vin: '',
  })

  const [clientModalOpen, setClientModalOpen] = useState(false)
  const [serviceModalOpen, setServiceModalOpen] = useState(false)
  const [sourceModalOpen, setSourceModalOpen] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  useEffect(() => {
    if (existingOrder) {
      setClientId(existingOrder.client_id || '')
      setVehicleId(existingOrder.vehicle_id || '')
      setServiceId(existingOrder.service_id || '')
      setDescription(existingOrder.description || '')
      setScheduledDate(existingOrder.scheduled_date || '')
      setSource(existingOrder.source || 'direct')
    } else if (initialDate) {
      setScheduledDate(initialDate)
    }
  }, [existingOrder, initialDate])

  const createClientMutation = useMutation({
    mutationFn: clientsApi.create,
    onSuccess: (res: any) => {
      setClientId(res.data.id)
      setShowNewClient(false)
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      Alert.alert('Успех', 'Клиент создан')
    },
    onError: (err: any) => {
      Alert.alert('Ошибка', err?.response?.data?.detail || err?.message || 'Не удалось создать клиента')
    },
  })

  const createVehicleMutation = useMutation({
    mutationFn: vehiclesApi.create,
    onSuccess: (res: any) => {
      setVehicleId(res.data.id)
      setShowNewVehicle(false)
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      Alert.alert('Успех', 'Автомобиль добавлен')
    },
    onError: (err: any) => {
      Alert.alert('Ошибка', err?.response?.data?.detail || err?.message || 'Не удалось добавить автомобиль')
    },
  })

  const mutation = useMutation({
    mutationFn: (data: any) =>
      orderId ? workOrdersApi.update(orderId, data) : workOrdersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] })
      if (orderId) queryClient.invalidateQueries({ queryKey: ['workOrder', orderId] })
      navigation.goBack()
    },
    onError: (err: any) => {
      Alert.alert('Ошибка', err?.response?.data?.detail || err?.message || 'Не удалось сохранить заказ')
    },
  })

  const filteredClients = useMemo(() => {
    if (!clientsData) return []
    if (!searchClient.trim()) return clientsData
    return clientsData.filter(
      (c: any) =>
        c.name.toLowerCase().includes(searchClient.toLowerCase()) ||
        c.phone.includes(searchClient)
    )
  }, [clientsData, searchClient])

  const selectedClient = clientsData?.find((c: any) => c.id === clientId)
  const filteredVehicles =
    vehiclesData?.filter((v: any) => v.client_id === clientId) || []
  const selectedVehicle = vehiclesData?.find((v: any) => v.id === vehicleId)
  const selectedService = servicesData?.find((s: any) => s.id === serviceId)

  // Auto-select vehicle if client has only one
  useEffect(() => {
    if (filteredVehicles.length === 1 && !vehicleId) {
      setVehicleId(filteredVehicles[0].id)
    }
  }, [filteredVehicles, vehicleId])

  const totalCost = selectedService?.price || 0

  const handleSave = () => {
    const missing: string[] = []
    if (!clientId) missing.push('Клиент')
    if (!vehicleId) missing.push('Автомобиль')
    if (!serviceId) missing.push('Услуга')

    if (missing.length > 0) {
      Alert.alert('Заполните обязательные поля', missing.join(', '))
      return
    }
    mutation.mutate({
      client_id: clientId,
      vehicle_id: vehicleId,
      service_id: serviceId,
      description: description.trim() || undefined,
      scheduled_date: scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
      status: existingOrder?.status || 'pending',
      source,
    })
  }

  const sourceOptions = [
    { value: 'direct', label: 'Прямое обращение' },
    { value: 'repeat', label: 'Повторный визит' },
    { value: 'yandex', label: 'Яндекс' },
    { value: 'google', label: 'Google' },
    { value: 'avito', label: 'Авито' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'telegram', label: 'Telegram' },
    { value: 'referral', label: 'Рекомендация' },
    { value: 'other', label: 'Другое' },
  ]

  const canSubmit = clientId && vehicleId && serviceId

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>
        {orderId ? 'Редактировать заказ' : 'Новый заказ-наряд'}
      </Text>

      {/* Client */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <User size={16} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Клиент</Text>
        </View>

        {!showNewClient ? (
          <>
            <TouchableOpacity
              style={styles.selectBtn}
              onPress={() => setClientModalOpen(true)}
            >
              {selectedClient ? (
                <View>
                  <Text style={styles.selectValue}>{selectedClient.name}</Text>
                  <Text style={styles.selectSubValue}>{selectedClient.phone}</Text>
                </View>
              ) : (
                <Text style={styles.selectPlaceholder}>Выберите клиента</Text>
              )}
              <ChevronRight size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addOutlineBtn}
              onPress={() => setShowNewClient(true)}
            >
              <Plus size={16} color={Colors.textMuted} />
              <Text style={styles.addOutlineText}>Новый клиент</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.newClientBox}>
            <Text style={styles.newClientTitle}>Новый клиент</Text>
            <TextInput
              style={styles.input}
              placeholder="ФИО *"
              value={newClient.name}
              onChangeText={(t) => setNewClient({ ...newClient, name: t })}
              placeholderTextColor={Colors.textMuted}
            />
            <TextInput
              style={styles.input}
              placeholder="Телефон *"
              value={newClient.phone}
              onChangeText={(t) => setNewClient({ ...newClient, phone: t })}
              keyboardType="phone-pad"
              placeholderTextColor={Colors.textMuted}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={newClient.email}
              onChangeText={(t) => setNewClient({ ...newClient, email: t })}
              keyboardType="email-address"
              placeholderTextColor={Colors.textMuted}
            />
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowNewClient(false)}
              >
                <Text style={styles.cancelText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveSmallBtn,
                  (!newClient.name || !newClient.phone) && styles.disabledBtn,
                ]}
                onPress={() => createClientMutation.mutate(newClient)}
                disabled={!newClient.name || !newClient.phone}
              >
                {createClientMutation.isPending ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.saveSmallText}>Создать</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Vehicle */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Car size={16} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Автомобиль</Text>
        </View>

        {!showNewVehicle ? (
          <>
            <TouchableOpacity
              style={[styles.selectBtn, !clientId && styles.disabledBtn]}
              onPress={() => {}}
              disabled={!clientId}
            >
              {selectedVehicle ? (
                <View>
                  <Text style={styles.selectValue}>
                    {selectedVehicle.make} {selectedVehicle.model}
                  </Text>
                  <Text style={styles.selectSubValue}>
                    {selectedVehicle.license_plate}
                  </Text>
                </View>
              ) : (
                <Text style={styles.selectPlaceholder}>
                  {clientId ? 'Выберите автомобиль' : 'Сначала выберите клиента'}
                </Text>
              )}
            </TouchableOpacity>

            {clientId && filteredVehicles.length > 0 && (
              <View style={styles.vehicleList}>
                {filteredVehicles.map((v: any) => (
                  <TouchableOpacity
                    key={v.id}
                    style={[
                      styles.vehicleOption,
                      v.id === vehicleId && styles.vehicleOptionActive,
                    ]}
                    onPress={() => setVehicleId(v.id)}
                  >
                    <Text
                      style={[
                        styles.vehicleOptionText,
                        v.id === vehicleId && styles.vehicleOptionTextActive,
                      ]}
                    >
                      {v.make} {v.model} — {v.license_plate}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {clientId && (
              <TouchableOpacity
                style={styles.addOutlineBtn}
                onPress={() => setShowNewVehicle(true)}
              >
                <Plus size={16} color={Colors.textMuted} />
                <Text style={styles.addOutlineText}>Добавить авто</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.newClientBox}>
            <Text style={styles.newClientTitle}>
              Новое авто ({selectedClient?.name})
            </Text>
            <VehicleSelector value={newVehicle} onChange={setNewVehicle} />
            <View style={[styles.row, { marginTop: 12 }]}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowNewVehicle(false)}
              >
                <Text style={styles.cancelText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveSmallBtn,
                  (!newVehicle.make || !newVehicle.model) && styles.disabledBtn,
                ]}
                onPress={() =>
                  createVehicleMutation.mutate({
                    ...newVehicle,
                    client_id: clientId,
                  })
                }
                disabled={!newVehicle.make || !newVehicle.model}
              >
                {createVehicleMutation.isPending ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.saveSmallText}>Добавить</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Service */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Wrench size={16} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Услуга</Text>
        </View>
        <TouchableOpacity
          style={styles.selectBtn}
          onPress={() => setServiceModalOpen(true)}
        >
          {selectedService ? (
            <View>
              <Text style={styles.selectValue}>{selectedService.name}</Text>
              <Text style={styles.selectSubValue}>
                {formatCurrency(selectedService.price || 0)} ({selectedService.duration}ч)
              </Text>
            </View>
          ) : (
            <Text style={styles.selectPlaceholder}>Выберите услугу</Text>
          )}
          <ChevronRight size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Scheduled date */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Calendar size={16} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Дата и время записи</Text>
        </View>
        <TouchableOpacity
          style={styles.selectBtn}
          onPress={() => setDatePickerOpen(true)}
        >
          <Text style={scheduledDate ? styles.selectValue : styles.selectPlaceholder}>
            {scheduledDate
              ? new Date(scheduledDate).toLocaleString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Выберите дату и время'}
          </Text>
          <ChevronRight size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Custom Date/Time Picker Modal */}
      <DateTimePickerModal
        visible={datePickerOpen}
        initialValue={scheduledDate ? new Date(scheduledDate) : new Date()}
        onSelect={(iso) => {
          setScheduledDate(iso)
          setDatePickerOpen(false)
        }}
        onClose={() => setDatePickerOpen(false)}
      />

      {/* Source */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Megaphone size={16} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Источник</Text>
        </View>
        <TouchableOpacity
          style={styles.selectBtn}
          onPress={() => setSourceModalOpen(true)}
        >
          <Text style={styles.selectValue}>
            {sourceOptions.find((o) => o.value === source)?.label}
          </Text>
          <ChevronRight size={18} color={Colors.textMuted} />
        </TouchableOpacity>
        {source === 'repeat' && (
          <Text style={styles.repeatHint}>
            Не засчитывается в маркетинговый бюджет
          </Text>
        )}
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Описание проблемы</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Опишите проблему..."
          multiline
          numberOfLines={4}
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      {/* Total */}
      {selectedService && (
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Сумма:</Text>
          <Text style={styles.totalValue}>{formatCurrency(totalCost)}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.saveBtn, (!canSubmit || mutation.isPending) && styles.disabledBtn]}
        onPress={handleSave}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.saveText}>
            {orderId ? 'Сохранить изменения' : 'Создать заказ'}
          </Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 32 }} />

      {/* Client Picker Modal */}
      <Modal visible={clientModalOpen} animationType="slide" transparent>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.sheet}>
            <View style={modalStyles.header}>
              <Text style={modalStyles.headerTitle}>Выберите клиента</Text>
              <TouchableOpacity onPress={() => setClientModalOpen(false)}>
                <X size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <View style={modalStyles.searchBox}>
              <Search size={16} color={Colors.textMuted} />
              <TextInput
                style={modalStyles.searchInput}
                placeholder="Поиск клиента..."
                value={searchClient}
                onChangeText={setSearchClient}
                placeholderTextColor={Colors.textMuted}
                autoFocus
              />
            </View>
            {clientsLoading ? (
              <ActivityIndicator style={{ marginTop: 24 }} color={Colors.primary} />
            ) : (
              <FlatList
                data={filteredClients}
                keyExtractor={(item: any) => item.id}
                renderItem={({ item }: { item: any }) => (
                  <TouchableOpacity
                    style={modalStyles.item}
                    onPress={() => {
                      setClientId(item.id)
                      setVehicleId('')
                      setClientModalOpen(false)
                      setSearchClient('')
                    }}
                  >
                    <View>
                      <Text style={modalStyles.itemText}>{item.name}</Text>
                      <Text style={modalStyles.itemSub}>{item.phone}</Text>
                    </View>
                    {item.id === clientId && (
                      <View style={modalStyles.check}>
                        <Text style={{ color: Colors.white, fontSize: 12 }}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={modalStyles.empty}>Клиенты не найдены</Text>
                }
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Service Picker Modal */}
      <Modal visible={serviceModalOpen} animationType="slide" transparent>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.sheet}>
            <View style={modalStyles.header}>
              <Text style={modalStyles.headerTitle}>Выберите услугу</Text>
              <TouchableOpacity onPress={() => setServiceModalOpen(false)}>
                <X size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={servicesData || []}
              keyExtractor={(item: any) => item.id}
              renderItem={({ item }: { item: any }) => (
                <TouchableOpacity
                  style={modalStyles.item}
                  onPress={() => {
                    setServiceId(item.id)
                    setServiceModalOpen(false)
                  }}
                >
                  <View>
                    <Text style={modalStyles.itemText}>{item.name}</Text>
                    <Text style={modalStyles.itemSub}>
                      {formatCurrency(item.price || 0)} • {item.duration}ч
                    </Text>
                  </View>
                  {item.id === serviceId && (
                    <View style={modalStyles.check}>
                      <Text style={{ color: Colors.white, fontSize: 12 }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={modalStyles.empty}>Услуги не найдены</Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Source Picker Modal */}
      <Modal visible={sourceModalOpen} animationType="slide" transparent>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.sheet}>
            <View style={modalStyles.header}>
              <Text style={modalStyles.headerTitle}>Источник</Text>
              <TouchableOpacity onPress={() => setSourceModalOpen(false)}>
                <X size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={sourceOptions}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={modalStyles.item}
                  onPress={() => {
                    setSource(item.value)
                    setSourceModalOpen(false)
                  }}
                >
                  <Text style={modalStyles.itemText}>{item.label}</Text>
                  {item.value === source && (
                    <View style={modalStyles.check}>
                      <Text style={{ color: Colors.white, fontSize: 12 }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { fontSize: 20, fontWeight: 'bold', color: Colors.text, padding: 16, paddingBottom: 8 },
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  disabledBtn: { opacity: 0.5 },
  selectPlaceholder: { fontSize: 15, color: Colors.textMuted },
  selectValue: { fontSize: 15, fontWeight: '600', color: Colors.text },
  selectSubValue: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  addOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  addOutlineText: { fontSize: 14, color: Colors.textMuted },
  newClientBox: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  newClientTitle: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 4 },
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
  textArea: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: Colors.borderLight,
  },
  cancelText: { fontSize: 14, color: Colors.text },
  saveSmallBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  saveSmallText: { fontSize: 14, color: Colors.white, fontWeight: '600' },
  vehicleList: { marginTop: 8, gap: 6 },
  vehicleOption: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  vehicleOptionActive: { borderColor: Colors.primary, backgroundColor: '#eff6ff' },
  vehicleOptionText: { fontSize: 14, color: Colors.text },
  vehicleOptionTextActive: { color: Colors.primary, fontWeight: '600' },
  repeatHint: { fontSize: 12, color: Colors.warning, marginTop: 6 },
  totalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eff6ff',
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  totalLabel: { fontSize: 14, color: Colors.primary },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: Colors.primary },
  saveBtn: {
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
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
    paddingBottom: 24,
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    margin: 12,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 15,
    color: Colors.text,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  itemText: { fontSize: 15, color: Colors.text },
  itemSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 24 },
})

/* ---------- Custom Date/Time Picker ---------- */

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

function DateTimePickerModal({
  visible,
  initialValue,
  onSelect,
  onClose,
}: {
  visible: boolean
  initialValue: Date
  onSelect: (iso: string) => void
  onClose: () => void
}) {
  const [viewDate, setViewDate] = useState(initialValue)
  const [selectedDate, setSelectedDate] = useState(initialValue)
  const [hour, setHour] = useState(initialValue.getHours())
  const [minute, setMinute] = useState(initialValue.getMinutes())

  useEffect(() => {
    setViewDate(initialValue)
    setSelectedDate(initialValue)
    setHour(initialValue.getHours())
    setMinute(initialValue.getMinutes())
  }, [visible])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const startDay = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const days: (number | null)[] = []
  for (let i = 0; i < startDay; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)

  const hours = Array.from({ length: 14 }, (_, i) => i + 8) // 08..21
  const minutes = [0, 15, 30, 45]

  const isSelectedDay = (d: number) =>
    selectedDate.getDate() === d &&
    selectedDate.getMonth() === month &&
    selectedDate.getFullYear() === year

  const isToday = (d: number) => {
    const t = new Date()
    return t.getDate() === d && t.getMonth() === month && t.getFullYear() === year
  }

  const handleConfirm = () => {
    const d = new Date(selectedDate)
    d.setHours(hour, minute, 0, 0)
    const pad = (n: number) => n.toString().padStart(2, '0')
    const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    onSelect(iso)
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={dpStyles.overlay}>
        <View style={dpStyles.sheet}>
          <View style={dpStyles.header}>
            <Text style={dpStyles.headerTitle}>Выберите дату и время</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            {/* Month navigation */}
            <View style={dpStyles.monthRow}>
              <TouchableOpacity
                style={dpStyles.navBtn}
                onPress={() => setViewDate(new Date(year, month - 1, 1))}
              >
                <ChevronLeft size={20} color={Colors.text} />
              </TouchableOpacity>
              <Text style={dpStyles.monthText}>
                {MONTHS[month]} {year}
              </Text>
              <TouchableOpacity
                style={dpStyles.navBtn}
                onPress={() => setViewDate(new Date(year, month + 1, 1))}
              >
                <ChevronRight size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Weekday headers */}
            <View style={dpStyles.weekRow}>
              {WEEKDAYS.map((w) => (
                <Text key={w} style={dpStyles.weekDay}>
                  {w}
                </Text>
              ))}
            </View>

            {/* Days grid */}
            <View style={dpStyles.daysGrid}>
              {days.map((d, i) => (
                <View key={i} style={dpStyles.dayCell}>
                  {d !== null ? (
                    <TouchableOpacity
                      style={[
                        dpStyles.dayBtn,
                        isSelectedDay(d) && dpStyles.dayBtnActive,
                        isToday(d) && !isSelectedDay(d) && dpStyles.dayBtnToday,
                      ]}
                      onPress={() => setSelectedDate(new Date(year, month, d))}
                    >
                      <Text
                        style={[
                          dpStyles.dayText,
                          isSelectedDay(d) && dpStyles.dayTextActive,
                          isToday(d) && !isSelectedDay(d) && dpStyles.dayTextToday,
                        ]}
                      >
                        {d}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}
            </View>

            {/* Hours */}
            <Text style={dpStyles.sectionLabel}>Час</Text>
            <View style={dpStyles.timeRow}>
              {hours.map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[
                    dpStyles.timePill,
                    h === hour && dpStyles.timePillActive,
                  ]}
                  onPress={() => setHour(h)}
                >
                  <Text
                    style={[
                      dpStyles.timePillText,
                      h === hour && dpStyles.timePillTextActive,
                    ]}
                  >
                    {h.toString().padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Minutes */}
            <Text style={dpStyles.sectionLabel}>Минута</Text>
            <View style={dpStyles.timeRow}>
              {minutes.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    dpStyles.timePill,
                    m === minute && dpStyles.timePillActive,
                  ]}
                  onPress={() => setMinute(m)}
                >
                  <Text
                    style={[
                      dpStyles.timePillText,
                      m === minute && dpStyles.timePillTextActive,
                    ]}
                  >
                    {m.toString().padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Actions */}
            <View style={dpStyles.actionsRow}>
              <TouchableOpacity style={dpStyles.cancelBtn} onPress={onClose}>
                <Text style={dpStyles.cancelText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={dpStyles.confirmBtn} onPress={handleConfirm}>
                <Text style={dpStyles.confirmText}>Выбрать</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const dpStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
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
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  navBtn: { padding: 6 },
  monthText: { fontSize: 16, fontWeight: '600', color: Colors.text },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  weekDay: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  dayCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBtnActive: { backgroundColor: Colors.primary },
  dayBtnToday: { borderWidth: 1, borderColor: Colors.primary },
  dayText: { fontSize: 15, color: Colors.text },
  dayTextActive: { color: Colors.white, fontWeight: '600' },
  dayTextToday: { color: Colors.primary, fontWeight: '600' },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
  },
  timePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  timePillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timePillText: { fontSize: 14, color: Colors.text },
  timePillTextActive: { color: Colors.white, fontWeight: '600' },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: Colors.borderLight,
  },
  cancelText: { fontSize: 15, color: Colors.text, fontWeight: '500' },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  confirmText: { fontSize: 15, color: Colors.white, fontWeight: '600' },
})
