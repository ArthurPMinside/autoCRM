import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRoute, useNavigation } from '@react-navigation/native'
import { clientsApi } from '../../api/clients'
import { Colors } from '../../constants/colors'

export function ClientFormScreen() {
  const route = useRoute() as any
  const navigation = useNavigation()
  const queryClient = useQueryClient()
  const clientId = route.params?.id

  const { data: existingClient } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientsApi.getById(clientId).then((r) => r.data),
    enabled: !!clientId,
  })

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (existingClient) {
      setName(existingClient.name || '')
      setPhone(existingClient.phone || '')
      setEmail(existingClient.email || '')
    }
  }, [existingClient])

  const mutation = useMutation({
    mutationFn: (data: any) =>
      clientId ? clientsApi.update(clientId, data) : clientsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      if (clientId) queryClient.invalidateQueries({ queryKey: ['client', clientId] })
      navigation.goBack()
    },
  })

  const handleSave = () => {
    if (!name.trim() || !phone.trim()) return
    mutation.mutate({ name: name.trim(), phone: phone.trim(), email: email.trim() || undefined })
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{clientId ? 'Редактировать клиента' : 'Новый клиент'}</Text>

      <View style={styles.field}>
        <Text style={styles.label}>ФИО *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Иванов Иван" />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Телефон *</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+7 (999) 000-00-00"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="client@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={mutation.isPending}>
        {mutation.isPending ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.saveText}>Сохранить</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { fontSize: 20, fontWeight: 'bold', color: Colors.text, padding: 16 },
  field: { marginHorizontal: 16, marginBottom: 12 },
  label: { fontSize: 14, color: Colors.text, fontWeight: '500', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: Colors.card,
    color: Colors.text,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
})
