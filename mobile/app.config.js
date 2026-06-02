module.exports = {
  expo: {
    name: 'autoCRM',
    slug: 'autocrm-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#2563eb',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.autocrm.mobile',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
      },
      package: 'com.autocrm.mobile',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      // Укажите здесь URL бэкенда или задайте через переменную окружения API_URL
      // Android эмулятор: http://10.0.2.2:8001/api/v1
      // iOS симулятор:   http://localhost:8001/api/v1
      // Реальное устройство: http://ВАШ_LAN_IP:8001/api/v1
      apiUrl:
        process.env.API_URL ||
        'http://10.0.2.2:8001/api/v1',
    },
  },
}
