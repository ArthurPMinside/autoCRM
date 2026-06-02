import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { useAuthStore } from '../../stores/authStore'
import { Colors } from '../../constants/colors'
import { LogOut, Server, Info } from 'lucide-react-native'

export function SettingsScreen() {
  const { logout, user } = useAuthStore()

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
  profileName: { fontSize: 18, fontWeight: '600', color: Colors.text },
  profileEmail: { fontSize: 14, color: Colors.textMuted, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  rowText: { fontSize: 16, color: Colors.text },
  rowTextDanger: { fontSize: 16, color: Colors.danger, fontWeight: '500' },
})
