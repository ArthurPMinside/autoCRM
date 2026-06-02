import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Colors } from '../../constants/colors'
import {
  DollarSign,
  Package,
  Users,
  Briefcase,
  BarChart3,
  Settings,
  Megaphone,
  ChevronRight,
} from 'lucide-react-native'

const MENU_ITEMS = [
  { icon: DollarSign, label: 'Финансы', screen: 'Finance', color: Colors.success },
  { icon: Package, label: 'Склад', screen: 'Warehouse', color: Colors.warning },
  { icon: Users, label: 'Персонал', screen: 'Staff', color: Colors.info },
  { icon: Briefcase, label: 'Услуги', screen: 'Services', color: Colors.primary },
  { icon: BarChart3, label: 'Аналитика', screen: 'Analytics', color: Colors.primary },
  { icon: Megaphone, label: 'Маркетинг', screen: 'Marketing', color: Colors.danger },
  { icon: Settings, label: 'Настройки', screen: 'Settings', color: Colors.textMuted },
]

export function MoreScreen() {
  const navigation = useNavigation()

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Ещё</Text>
      <View style={styles.grid}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.item}
            onPress={() => navigation.navigate(item.screen as never)}
          >
            <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
              <item.icon size={24} color={item.color} />
            </View>
            <Text style={styles.label}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { fontSize: 24, fontWeight: 'bold', color: Colors.text, padding: 16 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  item: {
    width: '30%',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: { fontSize: 13, color: Colors.text, textAlign: 'center' },
})
