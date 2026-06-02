import React, { useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
// import { useAuthStore } from '../stores/authStore'
// import { AuthNavigator } from './AuthNavigator'
import { MainNavigator } from './MainNavigator'

const Stack = createNativeStackNavigator()

export function AppNavigator() {
  // const { token, isLoading, loadToken } = useAuthStore()

  // useEffect(() => {
  //   loadToken()
  // }, [])

  // if (isLoading) {
  //   return null
  // }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* AUTH BYPASSED FOR TESTING — uncomment below to restore */}
        <Stack.Screen name="Main" component={MainNavigator} />
        {/* {token ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )} */}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
