import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { Colors } from '../../constants/colors'

export function MarketingScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Маркетинг</Text>
      <View style={styles.card}>
        <Text style={styles.placeholder}>SMS-рассылки и Telegram-бот</Text>
        <Text style={styles.hint}>Функционал в разработке</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { fontSize: 24, fontWeight: 'bold', color: Colors.text, padding: 16 },
  card: {
    backgroundColor: Colors.card,
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  placeholder: { fontSize: 16, color: Colors.text, marginBottom: 8 },
  hint: { fontSize: 13, color: Colors.textMuted },
})
