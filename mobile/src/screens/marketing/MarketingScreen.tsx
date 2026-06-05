import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Colors } from '../../constants/colors'
import { Megaphone, Send, MessageSquare, CheckCircle, Clock, Users, Mail } from 'lucide-react-native'

type TabKey = 'campaigns' | 'templates' | 'audience'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'campaigns', label: 'Кампании' },
  { key: 'templates', label: 'Шаблоны' },
  { key: 'audience', label: 'Аудитория' },
]

interface Campaign {
  id: string
  name: string
  type: 'sms' | 'email' | 'telegram'
  status: 'active' | 'draft' | 'completed'
  sent: number
  delivered: number
  opened: number
  date: string
}

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: '1', name: 'Напоминание о ТО', type: 'sms', status: 'active', sent: 45, delivered: 43, opened: 38, date: '2025-05-28' },
  { id: '2', name: 'Скидка 10% на шиномонтаж', type: 'telegram', status: 'completed', sent: 120, delivered: 118, opened: 89, date: '2025-05-20' },
  { id: '3', name: 'Поздравление с Днём рождения', type: 'email', status: 'draft', sent: 0, delivered: 0, opened: 0, date: '2025-06-01' },
  { id: '4', name: 'Акция "Летнее ТО"', type: 'sms', status: 'active', sent: 80, delivered: 78, opened: 65, date: '2025-05-25' },
]

const TEMPLATES = [
  { name: 'Напоминание о ТО', type: 'sms', text: 'Здравствуйте, {name}! Напоминаем, что вашему автомобилю {car} требуется ТО. Запишитесь: +7 (495) 123-45-67' },
  { name: 'Готовность заказа', type: 'sms', text: 'Здравствуйте, {name}! Ваш заказ #{order} готов к выдаче. Сумма: {amount} ₽. Ждём вас!' },
  { name: 'Скидка 10%', type: 'email', text: 'Уважаемый {name}! Специально для вас скидка 10% на {service}. Действует до {date}.' },
  { name: 'Поздравление с ДР', type: 'telegram', text: '{name}, поздравляем с Днём рождения! 🎉 Скидка 15% на все услуги в ваш день!' },
]

const AUDIENCE_FILTERS = {
  status: ['Все клиенты', 'Активные', 'Неактивные (30+ дн.)', 'Новые (7 дн.)'],
  auto: ['Все марки', 'Toyota', 'BMW', 'Hyundai', 'Kia'],
  service: ['Все услуги', 'ТО', 'Диагностика', 'Ремонт', 'Шиномонтаж'],
}

export function MarketingScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('campaigns')
  const { data: campaigns = MOCK_CAMPAIGNS } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => MOCK_CAMPAIGNS,
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sms': return <MessageSquare size={16} color="#3b82f6" />
      case 'email': return <Mail size={16} color="#8b5cf6" />
      case 'telegram': return <Send size={16} color="#0ea5e9" />
      default: return <MessageSquare size={16} color={Colors.textMuted} />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'sms': return 'SMS'
      case 'email': return 'Email'
      case 'telegram': return 'Telegram'
      default: return type
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active': return { bg: '#f0fdf4', text: '#15803d', label: 'Активна' }
      case 'completed': return { bg: '#f3f4f6', text: '#4b5563', label: 'Завершена' }
      case 'draft': return { bg: '#fffbeb', text: '#a16207', label: 'Черновик' }
      default: return { bg: '#f3f4f6', text: '#4b5563', label: status }
    }
  }

  const totalSent = campaigns.reduce((s, c) => s + c.sent, 0)
  const totalDelivered = campaigns.reduce((s, c) => s + c.delivered, 0)
  const totalOpened = campaigns.reduce((s, c) => s + c.opened, 0)

  const renderTabContent = () => {
    switch (activeTab) {
      case 'campaigns':
        return (
          <>
            {/* KPI */}
            <View style={styles.kpiRow}>
              <KpiCard icon={<Megaphone size={18} color={Colors.primary} />} label="Кампаний" value={campaigns.length.toString()} />
              <KpiCard icon={<Send size={18} color="#3b82f6" />} label="Отправлено" value={totalSent.toString()} />
              <KpiCard icon={<CheckCircle size={18} color={Colors.success} />} label="Доставлено" value={totalDelivered.toString()} />
              <KpiCard icon={<Users size={18} color="#8b5cf6" />} label="Открытий" value={totalOpened.toString()} />
            </View>

            {/* Campaign list */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Кампании</Text>
              {campaigns.map((c) => {
                const status = getStatusStyle(c.status)
                return (
                  <View key={c.id} style={styles.campaignCard}>
                    <View style={styles.campaignHeader}>
                      <View style={styles.campaignLeft}>
                        {getTypeIcon(c.type)}
                        <Text style={styles.campaignName}>{c.name}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                        <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
                      </View>
                    </View>
                    <View style={styles.campaignStats}>
                      <StatItem label="Отправлено" value={c.sent} />
                      <StatItem label="Доставлено" value={c.delivered} />
                      <StatItem label="Открытий" value={c.opened} />
                    </View>
                    <Text style={styles.campaignDate}>{c.date}</Text>
                  </View>
                )
              })}
            </View>
          </>
        )

      case 'templates':
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Шаблоны сообщений</Text>
            {TEMPLATES.map((t, i) => (
              <View key={i} style={styles.templateCard}>
                <View style={styles.templateHeader}>
                  <Text style={styles.templateName}>{t.name}</Text>
                  <View style={styles.typeBadge}>
                    {getTypeIcon(t.type)}
                    <Text style={styles.typeLabel}>{getTypeLabel(t.type)}</Text>
                  </View>
                </View>
                <Text style={styles.templateText}>{t.text}</Text>
                <View style={styles.templateActions}>
                  <TouchableOpacity><Text style={styles.actionLink}>Редактировать</Text></TouchableOpacity>
                  <TouchableOpacity><Text style={styles.actionLink}>Использовать</Text></TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )

      case 'audience':
        return (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>По статусу</Text>
              {AUDIENCE_FILTERS.status.map((item) => (
                <View key={item} style={styles.filterRow}>
                  <Text style={styles.filterLabel}>{item}</Text>
                  <Switch />
                </View>
              ))}
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>По авто</Text>
              {AUDIENCE_FILTERS.auto.map((item) => (
                <View key={item} style={styles.filterRow}>
                  <Text style={styles.filterLabel}>{item}</Text>
                  <Switch />
                </View>
              ))}
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>По услугам</Text>
              {AUDIENCE_FILTERS.service.map((item) => (
                <View key={item} style={styles.filterRow}>
                  <Text style={styles.filterLabel}>{item}</Text>
                  <Switch />
                </View>
              ))}
            </View>
            <View style={[styles.card, styles.launchCard]}>
              <View>
                <Text style={styles.launchLabel}>Выбрано получателей</Text>
                <Text style={styles.launchValue}>42 клиента</Text>
              </View>
              <TouchableOpacity style={styles.launchBtn}>
                <Text style={styles.launchBtnText}>Запустить рассылку</Text>
              </TouchableOpacity>
            </View>
          </>
        )
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Маркетинг</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {renderTabContent()}

      <View style={{ height: 24 }} />
    </ScrollView>
  )
}

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.kpiCard}>
      <View style={styles.kpiIcon}>{icon}</View>
      <Text style={styles.kpiValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.kpiLabel} numberOfLines={1}>{label}</Text>
    </View>
  )
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { fontSize: 24, fontWeight: 'bold', color: Colors.text, padding: 16, paddingBottom: 8 },
  tabsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, paddingBottom: 4 },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  tabTextActive: { color: Colors.white },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
    marginTop: 4,
  },
  kpiCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    width: '23%',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  kpiIcon: { marginBottom: 6 },
  kpiValue: { fontSize: 15, fontWeight: 'bold', color: Colors.text },
  kpiLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2, textAlign: 'center' },
  card: {
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 12 },
  campaignCard: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  campaignHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  campaignLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  campaignName: { fontSize: 14, fontWeight: '600', color: Colors.text, flex: 1 },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: { fontSize: 11, fontWeight: '600' },
  campaignStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 6,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 14, fontWeight: 'bold', color: Colors.text },
  statLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  campaignDate: { fontSize: 12, color: Colors.textMuted },
  templateCard: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  templateName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeLabel: { fontSize: 11, color: Colors.textMuted },
  templateText: {
    fontSize: 13,
    color: Colors.textMuted,
    backgroundColor: Colors.card,
    padding: 10,
    borderRadius: 8,
    lineHeight: 18,
  },
  templateActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  actionLink: { fontSize: 13, color: Colors.primary, fontWeight: '500' },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  filterLabel: { fontSize: 14, color: Colors.text },
  launchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eff6ff',
  },
  launchLabel: { fontSize: 13, color: Colors.primary },
  launchValue: { fontSize: 20, fontWeight: 'bold', color: Colors.primary },
  launchBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  launchBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
})
