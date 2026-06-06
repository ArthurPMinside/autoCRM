# 📱 Деплой мобильного приложения autoCRM

## 🔗 API URL (куда подключается приложение)

| Режим | URL |
|-------|-----|
| **Production** | `https://crmio.ru/api/v1` |
| Android эмулятор | `http://10.0.2.2:8001/api/v1` |
| LAN (локальная разработка) | `http://YOUR_LAN_IP:8001/api/v1` |

> URL встроен в APK при сборке. Для смены сервера нужно **пересобрать APK**.

---

## ⚡ Быстрая сборка (рекомендуется)

### Способ 1: EAS Cloud (простой, не требует Android SDK)

```bash
cd mobile
npm run build:apk:prod
```

Или через скрипт:
```bash
cd mobile
chmod +x build-apk.sh
./build-apk.sh eas
```

Результат: ссылка на скачивание APK придёт в консоль и на email (если настроен EAS).

### Способ 2: Локальная сборка (требует Android Studio / SDK)

```bash
cd mobile
chmod +x build-apk.sh
./build-apk.sh local
```

Результат: `mobile/autocrm-prod.apk`

---

## 🔧 Ручная сборка (если скрипт не подходит)

### EAS Cloud

```bash
cd mobile
npx eas build --platform android --profile preview
```

Профиль `preview` в `eas.json` уже настроен на:
- `buildType: apk`
- `API_URL: https://crmio.ru/api/v1`

### Локально через Gradle

```bash
cd mobile

# 1. Prebuild (генерация Android проекта)
API_URL=https://crmio.ru/api/v1 npx expo prebuild --platform android --clean

# 2. Сборка APK
cd android
./gradlew assembleRelease

# 3. APK будет здесь:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 🧪 Локальная разработка (эмулятор / устройство в LAN)

```bash
# Android эмулятор
cd mobile
npm run start:android-emulator

# Реальное устройство в той же Wi-Fi сети
cd mobile
npm run start:android-device
```

---

## 📋 Проверка перед сборкой

Убедитесь, что в `app.config.js` правильный URL:

```js
extra: {
  apiUrl: 'https://crmio.ru/api/v1',
}
```

Проверьте доступность сервера:
```bash
curl https://crmio.ru/health
curl https://crmio.ru/api/v1/
```

---

## 🚀 Установка APK на устройства

### Через ADB (для разработчиков)
```bash
adb install -r autocrm-prod.apk
```

### Через Telegram / Google Drive / Email
1. Загрузите APK
2. Откройте на Android-устройстве
3. Разрешите установку из неизвестных источников
4. Установите

### Через QR-код (EAS)
При сборке через EAS будет ссылка — отсканируйте QR-код камерой телефона.

---

## 🔄 Обновление приложения

Когда выйдет новая версия:
1. Пересоберите APK
2. Разошлите сотрудникам новый файл
3. Установите поверх старого (данные сохранятся, если `package` не менялся)

> Для OTA (over-the-air) обновлений без переустановки APK рассмотрите Expo Updates — требует дополнительной настройки.

---

## 🆘 Проблемы

### "Network Error" при входе
- Проверьте, что `https://crmio.ru/api/v1/` доступен из браузера телефона
- Проверьте SSL-сертификат (Let's Encrypt должен быть валидным)
- Убедитесь, что домен резолвится правильно (`nslookup crmio.ru`)

### Старый APK не подключается к новому серверу
- APK содержит захардкоженный URL
- **Нужно пересобрать APK** с новым URL и переустановить

### EAS build завершается с ошибкой
```bash
# Очистка кеша
npx eas build --platform android --profile preview --clear-cache
```
