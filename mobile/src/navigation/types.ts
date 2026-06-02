export type RootStackParamList = {
  Auth: undefined
  Main: undefined
}

export type AuthStackParamList = {
  Login: undefined
}

export type MainTabParamList = {
  Dashboard: undefined
  Clients: undefined
  WorkOrders: undefined
  Schedule: undefined
  More: undefined
}

export type ClientsStackParamList = {
  ClientsList: undefined
  ClientDetail: { id: string }
  ClientForm: { id?: string }
}

export type WorkOrdersStackParamList = {
  WorkOrdersList: undefined
  WorkOrderDetail: { id: string }
  WorkOrderForm: { id?: string }
}

export type MoreStackParamList = {
  MoreMenu: undefined
  Finance: undefined
  Warehouse: undefined
  Staff: undefined
  Services: undefined
  Analytics: undefined
  Settings: undefined
  Marketing: undefined
}
