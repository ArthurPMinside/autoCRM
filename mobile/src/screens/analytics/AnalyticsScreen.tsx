import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../../api/analytics'
import { clientsApi } from '../../api/clients'
import { Colors } from '../../constants/colors'
import { formatCurrency, formatDate } from '../../utils/format'
import { Users, Repeat, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react-native'

type TabKey = 'sources' | 'rfm' | 'retention' | 'revenue'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'sources', label: 'Источники' },
  { key: 'rfm', label: 'RFM' },
  { key: 'retention', label: 'Удержание' },
  { key: 'revenue', label: 'Выручка' },
]

const RFM_SEGMENTS = [
  { key: 'champions', label: 'Чемпионы', color: '#10b981', desc: 'Частые, новые, высокий чек' },
  { key: 'loyal', label: 'Лояльные', color: '#3b82f6', desc: 'Регулярные клиенты' },
  { key: 'potential', label: 'Потенциал', color: '#8b5cf6', desc: 'Новые с высоким чеком' },
  { key: 'new', label: 'Новые', color: '#06b6d4', desc: 'Недавно пришли' },
  { key: 'at_risk', label: 'В зоне риска', color: '#f59e0b', desc: 'Не были давно' },
  { key: 'lost', label: 'Потерянные', color: '#ef4444', desc: 'Давно не посещали' },
]

function getDefaultDates() {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  return { start: fmt(start), end: fmt(end) }
}

export function AnalyticsScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('sources')
  const defaultDates = getDefaultDates()
  const [startDate] = useState(defaultDates.start)
  const [endDate] = useState(defaultDates.end)
  const dateParams = { start_date: startDate, end_date: endDate }

  const { data: clients, isLoading: clientsLoading, refetch: refetchClients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getAll().then((r) => r.data),
  })

  const { data: sourcesData, isLoading: sourcesLoading, refetch: refetchSources } = useQuery({
    queryKey: ['analyticsSources', dateParams],
    queryFn: () => analyticsApi.getSources(dateParams).then((r) => r.data),
  })

  const { data: rfmData, isLoading: rfmLoading, refetch: refetchRfm } = useQuery({
    queryKey: ['analyticsRfm', dateParams],
    queryFn: () => analyticsApi.getRfm(dateParams).then((r) => r.data),
  })

  const { data: retentionData, isLoading: retentionLoading, refetch: refetchRetention } = useQuery({
    queryKey: ['analyticsRetention'],
    queryFn: () => analyticsApi.getRetention().then((r) => r.data),
  })

  const { data: revenueData, isLoading: revenueLoading, refetch: refetchRevenue } = useQuery({
    queryKey: ['analyticsRevenue', dateParams],
    queryFn: () => analyticsApi.getRevenue(dateParams).then((r) => r.data),
  })

  const isLoading = clientsLoading || sourcesLoading || rfmLoading || retentionLoading || revenueLoading

  const refetchAll = () => {
    refetchClients()
    refetchSources()
    refetchRfm()
    refetchRetention()
    refetchRevenue()
  }

  const sources = sourcesData?.items || []
  const totalRevenue = sourcesData?.total_revenue || 0
  const totalOrders = sourcesData?.total_orders || 0
  const totalClients = sourcesData?.total_clients || 0

  const avgVisits = clients ? (clients.reduce((sum: number, c: any) => sum + (c.total_visits || 0), 0) / clients.length).toFixed(1) : '0'
  const avgRevenue = clients ? (clients.reduce((sum: number, c: any) => sum + (c.total_revenue || 0), 0) / clients.length).toFixed(0) : '0'

  const cohorts = retentionData?.cohorts || []
  const revenueItems = revenueData?.items || []
  const revenueTotal = revenueData?.total_revenue || 0

  const renderTabContent = () => {
    switch (activeTab) {
      case 'sources':
        return (
          <>
            <View style={styles.kpiRow}>
              <KpiCard icon={<TrendingUp size={18} color={Colors.success} />} label="Всего выручки" value={formatCurrency(totalRevenue)} />
              <KpiCard icon={<BarChart3 size={18} color={Colors.primary} />} label="Всего заказов" value={totalOrders.toString()} />
              <KpiCard icon={<Users size={18} color={Colors.info} />} label="Уникальных клиентов" value={totalClients.toString()} />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Источники клиентов</Text>
              {sources.map((s: any) => {
                const share = totalRevenue > 0 ? Math.round((s.revenue / totalRevenue) * 100) : 0
                return (
                  <View key={s.source} style={styles.sourceRow}>
                    <View style={styles.sourceLeft}>
                      <Text style={styles.sourceLabel}>{s.source_label}</Text>
                      <Text style={styles.sourceMeta}>{s.orders} заказов · {s.clients} клиентов</Text>
                    </View>
                    <View style={styles.sourceRight}>
                      <Text style={styles.sourceRevenue}>{formatCurrency(s.revenue)}</Text>
                      <View style={styles.shareBarBg}>
                        <View style={[styles.shareBarFill, { width: `${share}%` }]} />
                      </View>
                      <Text style={styles.sourceShare}>{share}%</Text>
                    </View>
                  </View>
                )
              })}
              {sources.length === 0 && <Text style={styles.placeholder}>Нет данных за выбранный период</Text>}
            </View>
          </>
        )

      case 'rfm':
        return (
          <>
            <View style={styles.kpiRow}>
              <KpiCard icon={<Users size={18} color={Colors.primary} />} label="Всего клиентов" value={(clients?.length || 0).toString()} />
              <KpiCard icon={<Repeat size={18} color={Colors.success} />} label="Среднее визитов" value={avgVisits} />
              <KpiCard icon={<TrendingUp size={18} color={Colors.info} />} label="LTV средний" value={`${Number(avgRevenue).toLocaleString()} ₽`} />
              <KpiCard icon={<AlertTriangle size={18} color={Colors.warning} />} label="Отток (30 дн.)" value="12%" />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>RFM-сегменты</Text>
              {RFM_SEGMENTS.map((segment) => {
                const count = rfmData?.[segment.key] || 0
                return (
                  <View key={segment.key} style={styles.segmentRow}>
                    <View style={[styles.segmentDot, { backgroundColor: segment.color }]} />
                    <View style={styles.segmentContent}>
                      <View style={styles.segmentHeader}>
                        <Text style={styles.segmentName}>{segment.label}</Text>
                        <Text style={styles.segmentCount}>{count} чел.</Text>
                      </View>
                      <Text style={styles.segmentDesc}>{segment.desc}</Text>
                    </View>
                  </View>
                )
              })}
            </View>
          </>
        )

      case 'retention':
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Когортный анализ удержания</Text>
            {cohorts.map((c: any) => (
              <View key={c.cohort} style={styles.cohortRow}>
                <View style={styles.cohortHeader}>
                  <Text style={styles.cohortName}>{c.cohort}</Text>
                  <Text style={styles.cohortClients}>{c.initial} клиентов</Text>
                </View>
                <View style={styles.cohortRates}>
                  <RetentionPill label="1м" value={c.return_1m} color="#3b82f6" />
                  <RetentionPill label="3м" value={c.return_3m} color="#8b5cf6" />
                  <RetentionPill label="6м" value={c.return_6m} color="#f59e0b" />
                  <RetentionPill label="12м" value={c.return_12m} color="#10b981" />
                </View>
              </View>
            ))}
            {cohorts.length === 0 && <Text style={styles.placeholder}>Нет данных для анализа удержания</Text>}
          </View>
        )

      case 'revenue':
        return (
          <>
            <View style={styles.kpiRow}>
              <KpiCard icon={<TrendingUp size={18} color={Colors.success} />} label="Общая выручка" value={formatCurrency(revenueTotal)} />
              <KpiCard icon={<BarChart3 size={18} color={Colors.primary} />} label="Услуг" value={revenueItems.length.toString()} />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Топ услуг по выручке</Text>
              {revenueItems.slice(0, 5).map((item: any, i: number) => {
                const share = revenueTotal > 0 ? Math.round((item.revenue / revenueTotal) * 100) : 0
                return (
                  <View key={item.service_name} style={styles.topServiceRow}>
                    <View style={styles.topRank}>
                      <Text style={styles.topRankText}>{i + 1}</Text>
                    </View>
                    <View style={styles.topServiceContent}>
                      <Text style={styles.topServiceName}>{item.service_name}</Text>
                      <Text style={styles.topServiceMeta}>{item.orders} заказов</Text>
                    </View>
                    <View style={styles.topServiceRight}>
                      <Text style={styles.topServiceRevenue}>{formatCurrency(item.revenue)}</Text>
                      <Text style={styles.topServiceShare}>{share}% от общей</Text>
                    </View>
                  </View>
                )
              })}
              {revenueItems.length === 0 && <Text style={styles.placeholder}>Нет данных за выбранный период</Text>}
            </View>
          </>
        )
    }
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetchAll} />}
    >
      <Text style={styles.header}>Аналитика</Text>

      {/* Tabs */}
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

function RetentionPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.retentionPill, { backgroundColor: color + '18' }]}>
      <Text style={[styles.retentionLabel, { color }]}>{label}</Text>
      <Text style={[styles.retentionValue, { color }]}>{value}%</Text>
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
    width: '31%',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  kpiIcon: { marginBottom: 6 },
  kpiValue: { fontSize: 15, fontWeight: 'bold', color: Colors.text },
  kpiLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2, textAlign: 'center' },
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
  placeholder: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 8 },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  sourceLeft: { flex: 1 },
  sourceLabel: { fontSize: 14, fontWeight: '500', color: Colors.text },
  sourceMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  sourceRight: { alignItems: 'flex-end', width: 140 },
  sourceRevenue: { fontSize: 14, fontWeight: '600', color: Colors.text },
  shareBarBg: {
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    width: '100%',
    marginTop: 4,
  },
  shareBarFill: { height: 4, backgroundColor: Colors.primary, borderRadius: 2 },
  sourceShare: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  segmentDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  segmentContent: { flex: 1 },
  segmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  segmentName: { fontSize: 14, fontWeight: '500', color: Colors.text },
  segmentCount: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  segmentDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  cohortRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  cohortHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cohortName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  cohortClients: { fontSize: 13, color: Colors.textMuted },
  cohortRates: { flexDirection: 'row', gap: 8 },
  retentionPill: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 52,
  },
  retentionLabel: { fontSize: 10, fontWeight: '600' },
  retentionValue: { fontSize: 14, fontWeight: 'bold', marginTop: 2 },
  topServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  topRank: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRankText: { fontSize: 13, fontWeight: 'bold', color: Colors.primary },
  topServiceContent: { flex: 1 },
  topServiceName: { fontSize: 14, fontWeight: '500', color: Colors.text },
  topServiceMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  topServiceRight: { alignItems: 'flex-end' },
  topServiceRevenue: { fontSize: 14, fontWeight: '600', color: Colors.text },
  topServiceShare: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
})
