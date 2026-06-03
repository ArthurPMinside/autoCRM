import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native'
import { useAuthStore } from '../../stores/authStore'
import { Colors } from '../../constants/colors'
import { LogOut, Info, Clock } from 'lucide-react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsApi } from '../../api/settings'

export function SettingsScreen() {
  const { logout, user } = useAuthStore()
  const queryClient = useQueryClient()
  const [startHour, setStartHour] = useState('10')
  const [endHour, setEndHour] = useState('20')

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await settingsApi.get()
      return res.data as { work_start_hour: number; work_end_hour: number }
    },
  })

  useEffect(() => {
    if (settings) {
      setStartHour(String(settings.work_start_hour))
      setEndHour(String(settings.work_end_hour))
    }
  }, [settings])

  const updateMutation = useMutation({
    mutationFn: (data: { work_start_hour: number; work_end_hour: number }) =>
      settingsApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      Alert.alert('Сохранено', 'Рабочие часы обновлены')
    },
    onError: () => {
      Alert.alert('Ошибка', 'Не удалось сохранить настройки')
    },
  })

  const handleSaveHours = () => {
    const start = parseInt(startHour, 10)
    const end = parseInt(endHour, 10)
    if (isNaN(start) || isNaN(end) || start < 0 || start > 23 || end < 0 || end > 23 || start >= end) {
      Alert.alert('Ошибка', 'Введите корректные часы (0–23), начало должно быть раньше конца')
      return
    }
    updateMutation.mutate({ work_start_hour: start, work_end_hour: end })
  }

  const handleLogout = () => {
    Alert.alert('Выйти из аккаунта?', '', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: logout },
    ])
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Настройки</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Профиль</Text>
        <Text style={styles.profileName}>{user?.name || 'Пользователь'}</Text>
        <Text style={styles.profileEmail}>{user?.email || ''}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Clock size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Рабочие часы</Text>
        </View>
        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <>
            <View style={styles.hoursRow}>
              <View style={styles.hourInputWrap}>
                <Text style={styles.hourLabel}>Начало</Text>
                <TextInput
                  style={styles.hourInput}
                  value={startHour}
                  onChangeText={setStartHour}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
              <Text style={styles.hourDivider}>—</Text>
              <View style={styles.hourInputWrap}>
                <Text style={styles.hourLabel}>Конец</Text>
                <TextInput
                  style={styles.hourInput}
                  value={endHour}
                  onChangeText={setEndHour}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
            </View>
            <TouchableOpacity
              style={[styles.saveBtn, updateMutation.isPending && { opacity: 0.6 }]}
              onPress={handleSaveHours}
              disabled={updateMutation.isPending}
            >
              <Text style={styles.saveBtnText}>
                {updateMutation.isPending ? 'Сохранение...' : 'Сохранить часы'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.card}>
        <TouchableOpacity style={styles.row} onPress={handleLogout}>
          <LogOut size={20} color={Colors.danger} />
          <Text style={styles.rowTextDanger}>Выйти</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Info size={20} color={Colors.textMuted} />
          <Text style={styles.rowText}>autoCRM v1.0.0</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { fontSize: 24, fontWeight: 'bold', color: Colors.text, padding: 16 },
  card: {
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: Colors.textMuted, marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  profileName: { fontSize: 18, fontWeight: '600', color: Colors.text },
  profileEmail: { fontSize: 14, color: Colors.textMuted, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  rowText: { fontSize: 16, color: Colors.text },
  rowTextDanger: { fontSize: 16, color: Colors.danger, fontWeight: '500' },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  hourInputWrap: { alignItems: 'center' },
  hourLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  hourInput: {
    width: 64,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  hourDivider: { fontSize: 20, fontWeight: 'bold', color: Colors.textMuted, marginTop: 16 },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
})
