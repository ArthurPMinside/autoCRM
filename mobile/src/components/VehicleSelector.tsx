import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  TextInput,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { catalogApi, CatalogMake, CatalogModel, CatalogGeneration, CatalogBody } from '../api/catalog'
import { Colors } from '../constants/colors'
import { X, Search, ChevronRight } from 'lucide-react-native'

export interface VehicleSelection {
  make: string
  model: string
  year: number
  license_plate: string
  vin: string
}

interface Props {
  value: VehicleSelection
  onChange: (value: VehicleSelection) => void
}

function PickerModal({
  visible,
  title,
  items,
  onSelect,
  onClose,
  loading,
}: {
  visible: boolean
  title: string
  items: { id: number; label: string }[]
  onSelect: (id: number, label: string) => void
  onClose: () => void
  loading: boolean
}) {
  const [search, setSearch] = useState('')
  const filtered = search.trim()
    ? items.filter((i) => i.label.toLowerCase().includes(search.toLowerCase()))
    : items

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={pickerStyles.overlay}>
        <View style={pickerStyles.sheet}>
          <View style={pickerStyles.header}>
            <Text style={pickerStyles.headerTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <View style={pickerStyles.searchBox}>
            <Search size={16} color={Colors.textMuted} />
            <TextInput
              style={pickerStyles.searchInput}
              placeholder="Поиск..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor={Colors.textMuted}
            />
          </View>
          {loading ? (
            <ActivityIndicator style={{ marginTop: 24 }} color={Colors.primary} />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={pickerStyles.item}
                  onPress={() => {
                    onSelect(item.id, item.label)
                    setSearch('')
                  }}
                >
                  <Text style={pickerStyles.itemText}>{item.label}</Text>
                  <ChevronRight size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={pickerStyles.empty}>Ничего не найдено</Text>}
            />
          )}
        </View>
      </View>
    </Modal>
  )
}

export default function VehicleSelector({ value, onChange }: Props) {
  const [makeId, setMakeId] = useState<number | null>(null)
  const [modelId, setModelId] = useState<number | null>(null)
  const [generationId, setGenerationId] = useState<number | null>(null)
  const [bodyId, setBodyId] = useState<number | null>(null)

  const [modalVisible, setModalVisible] = useState(false)
  const [modalType, setModalType] = useState<'make' | 'model' | 'generation' | 'body'>('make')

  const { data: makes, isLoading: makesLoading } = useQuery({
    queryKey: ['catalog', 'makes'],
    queryFn: async () => {
      const res = await catalogApi.getMakes()
      return res.data as CatalogMake[]
    },
  })

  const { data: models, isLoading: modelsLoading } = useQuery({
    queryKey: ['catalog', 'models', makeId],
    queryFn: async () => {
      if (!makeId) return []
      const res = await catalogApi.getModels(makeId)
      return res.data as CatalogModel[]
    },
    enabled: !!makeId,
  })

  const { data: generations, isLoading: generationsLoading } = useQuery({
    queryKey: ['catalog', 'generations', modelId],
    queryFn: async () => {
      if (!modelId) return []
      const res = await catalogApi.getGenerations(modelId)
      return res.data as CatalogGeneration[]
    },
    enabled: !!modelId,
  })

  const { data: bodies, isLoading: bodiesLoading } = useQuery({
    queryKey: ['catalog', 'bodies', generationId],
    queryFn: async () => {
      if (!generationId) return []
      const res = await catalogApi.getBodies(generationId)
      return res.data as CatalogBody[]
    },
    enabled: !!generationId,
  })

  useEffect(() => {
    setModelId(null)
    setGenerationId(null)
    setBodyId(null)
  }, [makeId])

  useEffect(() => {
    setGenerationId(null)
    setBodyId(null)
  }, [modelId])

  useEffect(() => {
    setBodyId(null)
  }, [generationId])

  useEffect(() => {
    const makeName = makes?.find((m) => m.id === makeId)?.name || ''
    const modelName = models?.find((m) => m.id === modelId)?.name || ''
    const generation = generations?.find((g) => g.id === generationId)
    const year = generation?.year_from || new Date().getFullYear()

    if (makeName && modelName && generation) {
      onChange({
        ...value,
        make: makeName,
        model: modelName,
        year,
      })
    }
  }, [makeId, modelId, generationId, makes, models, generations])

  const openModal = (type: 'make' | 'model' | 'generation' | 'body') => {
    setModalType(type)
    setModalVisible(true)
  }

  const closeModal = () => setModalVisible(false)

  const getModalData = () => {
    switch (modalType) {
      case 'make':
        return {
          title: 'Марка',
          items: (makes || []).map((m) => ({ id: m.id, label: m.name })),
          loading: makesLoading,
          onSelect: (id: number) => setMakeId(id),
        }
      case 'model':
        return {
          title: 'Модель',
          items: (models || []).map((m) => ({ id: m.id, label: m.name })),
          loading: modelsLoading,
          onSelect: (id: number) => setModelId(id),
        }
      case 'generation':
        return {
          title: 'Поколение',
          items: (generations || []).map((g) => ({
            id: g.id,
            label: `${g.name} ${g.year_from ? `(${g.year_from}${g.year_to ? `–${g.year_to}` : ''})` : ''}`,
          })),
          loading: generationsLoading,
          onSelect: (id: number) => setGenerationId(id),
        }
      case 'body':
        return {
          title: 'Кузов',
          items: (bodies || []).map((b) => ({ id: b.id, label: b.name })),
          loading: bodiesLoading,
          onSelect: (id: number) => setBodyId(id),
        }
    }
  }

  const modalData = getModalData()

  const selectedMakeName = makes?.find((m) => m.id === makeId)?.name
  const selectedModelName = models?.find((m) => m.id === modelId)?.name
  const selectedGenName = generations?.find((g) => g.id === generationId)
    ? `${generations.find((g) => g.id === generationId)?.name} (${generations.find((g) => g.id === generationId)?.year_from}${generations.find((g) => g.id === generationId)?.year_to ? `–${generations.find((g) => g.id === generationId)?.year_to}` : ''})`
    : ''
  const selectedBodyName = bodies?.find((b) => b.id === bodyId)?.name

  const handleSelect = (id: number) => {
    modalData.onSelect(id)
    // Auto-advance to next picker
    if (modalType === 'make') {
      setModalType('model')
    } else if (modalType === 'model') {
      setModalType('generation')
    } else if (modalType === 'generation') {
      setModalType('body')
    } else {
      closeModal()
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.selectBtn} onPress={() => openModal('make')}>
        <Text style={styles.selectLabel}>Марка</Text>
        <Text style={selectedMakeName ? styles.selectValue : styles.selectPlaceholder}>
          {selectedMakeName || 'Выберите марку'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.selectBtn, !makeId && styles.disabledBtn]}
        onPress={() => makeId && openModal('model')}
        disabled={!makeId}
      >
        <Text style={styles.selectLabel}>Модель</Text>
        <Text style={selectedModelName ? styles.selectValue : styles.selectPlaceholder}>
          {selectedModelName || 'Выберите модель'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.selectBtn, !modelId && styles.disabledBtn]}
        onPress={() => modelId && openModal('generation')}
        disabled={!modelId}
      >
        <Text style={styles.selectLabel}>Поколение</Text>
        <Text style={selectedGenName ? styles.selectValue : styles.selectPlaceholder}>
          {selectedGenName || 'Выберите поколение'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.selectBtn, !generationId && styles.disabledBtn]}
        onPress={() => generationId && openModal('body')}
        disabled={!generationId}
      >
        <Text style={styles.selectLabel}>Кузов</Text>
        <Text style={selectedBodyName ? styles.selectValue : styles.selectPlaceholder}>
          {selectedBodyName || 'Выберите кузов'}
        </Text>
      </TouchableOpacity>

      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={styles.label}>Год</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={value.year ? String(value.year) : ''}
            onChangeText={(t) => onChange({ ...value, year: Number(t) || 0 })}
            placeholder="Год"
            placeholderTextColor={Colors.textMuted}
          />
        </View>
        <View style={styles.halfField}>
          <Text style={styles.label}>Гос. номер</Text>
          <TextInput
            style={styles.input}
            value={value.license_plate}
            onChangeText={(t) => onChange({ ...value, license_plate: t })}
            placeholder="А000АА 77"
            placeholderTextColor={Colors.textMuted}
          />
        </View>
      </View>

      <View style={styles.fullField}>
        <Text style={styles.label}>VIN</Text>
        <TextInput
          style={styles.input}
          value={value.vin}
          onChangeText={(t) => onChange({ ...value, vin: t })}
          placeholder="XTA21100000000000"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="characters"
        />
      </View>

      <PickerModal
        key={modalType}
        visible={modalVisible}
        title={modalData.title}
        items={modalData.items}
        onSelect={handleSelect}
        onClose={closeModal}
        loading={modalData.loading}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  selectBtn: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  disabledBtn: { opacity: 0.5 },
  selectLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 2 },
  selectValue: { fontSize: 15, color: Colors.text },
  selectPlaceholder: { fontSize: 15, color: Colors.textMuted },
  row: { flexDirection: 'row', gap: 10 },
  halfField: { flex: 1 },
  fullField: {},
  label: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
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
})

const pickerStyles = StyleSheet.create({
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
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 24 },
})
