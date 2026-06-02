import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { DashboardScreen } from '../screens/dashboard/DashboardScreen'
import { ClientsScreen } from '../screens/clients/ClientsScreen'
import { ClientDetailScreen } from '../screens/clients/ClientDetailScreen'
import { ClientFormScreen } from '../screens/clients/ClientFormScreen'
import { WorkOrdersScreen } from '../screens/workOrders/WorkOrdersScreen'
import { WorkOrderDetailScreen } from '../screens/workOrders/WorkOrderDetailScreen'
import { WorkOrderFormScreen } from '../screens/workOrders/WorkOrderFormScreen'
import { ScheduleScreen } from '../screens/schedule/ScheduleScreen'
import { MoreScreen } from '../screens/settings/MoreScreen'
import { FinanceScreen } from '../screens/finance/FinanceScreen'
import { WarehouseScreen } from '../screens/warehouse/WarehouseScreen'
import { StaffScreen } from '../screens/staff/StaffScreen'
import { ServicesScreen } from '../screens/services/ServicesScreen'
import { AnalyticsScreen } from '../screens/analytics/AnalyticsScreen'
import { SettingsScreen } from '../screens/settings/SettingsScreen'
import { MarketingScreen } from '../screens/marketing/MarketingScreen'
import { Colors } from '../constants/colors'
import { LayoutDashboard, Users, Wrench, Calendar, Menu } from 'lucide-react-native'

const Tab = createBottomTabNavigator()
const ClientsStack = createNativeStackNavigator()
const WorkOrdersStack = createNativeStackNavigator()
const MoreStack = createNativeStackNavigator()

function MoreStackNavigator() {
  return (
    <MoreStack.Navigator>
      <MoreStack.Screen name="MoreMenu" component={MoreScreen} options={{ title: 'Ещё' }} />
      <MoreStack.Screen name="Finance" component={FinanceScreen} options={{ title: 'Финансы' }} />
      <MoreStack.Screen name="Warehouse" component={WarehouseScreen} options={{ title: 'Склад' }} />
      <MoreStack.Screen name="Staff" component={StaffScreen} options={{ title: 'Персонал' }} />
      <MoreStack.Screen name="Services" component={ServicesScreen} options={{ title: 'Услуги' }} />
      <MoreStack.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'Аналитика' }} />
      <MoreStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Настройки' }} />
      <MoreStack.Screen name="Marketing" component={MarketingScreen} options={{ title: 'Маркетинг' }} />
    </MoreStack.Navigator>
  )
}

function ClientsStackNavigator() {
  return (
    <ClientsStack.Navigator>
      <ClientsStack.Screen name="ClientsList" component={ClientsScreen} options={{ title: 'Клиенты' }} />
      <ClientsStack.Screen name="ClientDetail" component={ClientDetailScreen} options={{ title: 'Клиент' }} />
      <ClientsStack.Screen name="ClientForm" component={ClientFormScreen} options={{ title: 'Клиент' }} />
    </ClientsStack.Navigator>
  )
}

function WorkOrdersStackNavigator() {
  return (
    <WorkOrdersStack.Navigator>
      <WorkOrdersStack.Screen name="WorkOrdersList" component={WorkOrdersScreen} options={{ title: 'Заказы' }} />
      <WorkOrdersStack.Screen name="WorkOrderDetail" component={WorkOrderDetailScreen} options={{ title: 'Заказ-наряд' }} />
      <WorkOrdersStack.Screen name="WorkOrderForm" component={WorkOrderFormScreen} options={{ title: 'Заказ-наряд' }} />
    </WorkOrdersStack.Navigator>
  )
}

export function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: { paddingBottom: 4, paddingTop: 4 },
      }}
    >
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{
          title: 'Расписание',
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Clients"
        component={ClientsStackNavigator}
        options={{
          title: 'Клиенты',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="WorkOrders"
        component={WorkOrdersStackNavigator}
        options={{
          title: 'Заказы',
          tabBarIcon: ({ color, size }) => <Wrench color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Главная',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreStackNavigator}
        options={{
          title: 'Ещё',
          tabBarIcon: ({ color, size }) => <Menu color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  )
}
