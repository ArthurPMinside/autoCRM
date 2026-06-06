# 🚀 Деплой autoCRM на VDS (Production)

## Что будет развёрнуто

| Сервис | Описание | Порт (внутри Docker) |
|--------|----------|----------------------|
| **Backend** | FastAPI + Uvicorn | `8001` |
| **Frontend** | Nginx + собранный React | `80` |
| **База данных** | SQLite (файл `./data/autocrm.db`) | — |

Мобильное приложение (React Native) работает по API — на сервере оно **не хостится**, пользователи устанавливают `.apk` на телефоны.

---

## 📋 Требования к серверу

- **OS**: Ubuntu 22.04 LTS (рекомендуется)
- **RAM**: 2 GB минимум (тариф «Старт» подойдёт для начала)
- **CPU**: 1 ядро
- **Диск**: 20 GB+ свободного места
- **Docker + Docker Compose** установлены

---

## 🔧 Шаг 1. Подготовка сервера

### 1.1 Установка Docker и Docker Compose

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Проверка
docker --version
docker compose version
```

### 1.2 Установка базовых утилит

```bash
sudo apt install -y git curl
```

---

## 📦 Шаг 2. Загрузка проекта на сервер

### Вариант A — через Git (если репозиторий на GitHub/GitLab)

```bash
git clone https://github.com/YOUR_USERNAME/autoCRM.git
cd autoCRM/autoCRM
```

### Вариант B — через SCP / SFTP

Загрузите папку `autoCRM/` на сервер (например, через FileZilla или `scp`).

---

## ⚙️ Шаг 3. Настройка окружения

### 3.1 Создайте `.env`

```bash
cp .env.example .env
nano .env
```

**Обязательно измените:**

```env
# Сгенерируйте случайный ключ (64 символа):
# openssl rand -hex 32
SECRET_KEY=your-very-long-random-secret-key-here

# Количество worker-процессов FastAPI
# 1 CPU → WORKERS=1
# 2 CPU → WORKERS=2
WORKERS=1
```

> ⚠️ **Никогда не используйте `dev-secret-key` в продакшене!**

### 3.2 Проверьте структуру

Убедитесь, что рядом с `docker-compose.prod.yml` лежат папки:

```
.
├── backend/
│   ├── Dockerfile.prod
│   └── ...
├── web/
│   ├── Dockerfile.prod
│   ├── nginx.conf
│   └── ...
├── nginx/
│   └── nginx-ssl.conf      ← шаблон SSL-конфига
├── docker-compose.prod.yml
├── deploy.sh
├── init-ssl.sh             ← получение SSL-сертификата
├── renew-ssl.sh            ← автообновление SSL
├── .env
├── data/                   ← SQLite (создаётся автоматически)
└── logs/                   ← логи обновления SSL
```

---

## 🐳 Шаг 4. Запуск

```bash
chmod +x deploy.sh
./deploy.sh
```

Или вручную:

```bash
mkdir -p data
docker compose -f docker-compose.prod.yml up -d --build
```

Первый запуск займёт 2–5 минут (сборка Docker-образов).

---

## ✅ Шаг 5. Проверка

```bash
# Статус контейнеров
docker compose -f docker-compose.prod.yml ps

# Логи backend
docker logs autocrm-backend

# Логи frontend
docker logs autocrm-frontend

# Health check
curl http://localhost/health
```

Откройте в браузере: `http://YOUR_SERVER_IP/`

---

## 🔒 Шаг 6. SSL / HTTPS (Let's Encrypt)

> **Рекомендуется сделать сразу**, даже если сейчас используете IP.

### 6.1 Привяжите домен к серверу

В DNS вашего домена создайте A-запись:
```
crm.yourdomain.com → YOUR_SERVER_IP
```

Подождите 5–10 минут, пока DNS обновится.

### 6.2 Получите сертификат (одной командой)

```bash
cd ~/autoCRM/autoCRM
chmod +x init-ssl.sh
./init-ssl.sh crm.yourdomain.com admin@yourdomain.com
```

Скрипт автоматически:
- Установит Certbot (если нет)
- Получит сертификат Let's Encrypt
- Создаст SSL-конфиг Nginx
- Перезапустит контейнер с HTTPS
- Настроит автообновление через cron

После этого CRM доступна по **`https://crm.yourdomain.com/`**

### 6.3 HTTP → HTTPS redirect

Все запросы на `http://` автоматически редиректятся на `https://`. Проверьте:
```bash
curl -I http://crm.yourdomain.com/
# Должен вернуть: 301 Moved Permanently → https://...
```

### 6.4 Проверка автообновления

Сертификаты Let's Encrypt действуют 90 дней. Автообновление настроено на 03:00 каждый день.

Проверить вручную:
```bash
./renew-ssl.sh
```

Посмотреть логи:
```bash
tail -f logs/ssl-renew.log
```

Проверить дату истечения:
```bash
openssl s_client -connect crm.yourdomain.com:443 -servername crm.yourdomain.com </dev/null 2>/dev/null | openssl x509 -noout -dates
```

---

## 🔄 Шаг 7. Обновление (новая версия)

```bash
# Зайдите в папку проекта
cd ~/autoCRM/autoCRM

# Обновите код (если через git)
git pull origin main

# Пересоберите и перезапустите
./deploy.sh
```

> 💡 База данных SQLite хранится в `./data/` на хосте — она **не пропадёт** при пересборке контейнеров.

---

## 📊 Мониторинг ресурсов

На тарифе **1 CPU / 2 GB RAM** ожидаемое потребление:

| Процесс | RAM |
|---------|-----|
| Backend (1 worker) | ~120 MB |
| Nginx | ~20 MB |
| Docker overhead | ~100 MB |
| OS | ~400 MB |
| **Итого** | **~650 MB** |

Остаётся запас ~1.3 GB на пиковые нагрузки.

---

## 🆘 Частые проблемы

### Контейнеры не стартуют

```bash
# Смотрите логи
docker logs autocrm-backend
docker logs autocrm-frontend

# Пересоберите без кеша
docker compose -f docker-compose.prod.yml build --no-cache
```

### Permission denied для `data/`

```bash
sudo chown -R $USER:$USER ./data
chmod 755 ./data
```

### Порт 80 занят

```bash
sudo lsof -i :80
# Остановите конфликтующий сервис или измените порт в docker-compose.prod.yml
```

---

## 📁 Файлы production-конфигурации

| Файл | Назначение |
|------|------------|
| `docker-compose.prod.yml` | Оркестрация backend + frontend |
| `backend/Dockerfile.prod` | Production-сборка FastAPI |
| `web/Dockerfile.prod` | Multi-stage сборка React → Nginx |
| `web/nginx.conf` | Конфиг Nginx (HTTP) |
| `nginx/nginx-ssl.conf` | Конфиг Nginx (HTTPS + SSL) |
| `.env.example` | Шаблон переменных окружения |
| `deploy.sh` | Автоматический деплой |
| `init-ssl.sh` | Получение SSL от Let's Encrypt |
| `renew-ssl.sh` | Автообновление SSL + reload Nginx |

---

## 📱 Шаг 8. Мобильное приложение

Мобильное приложение уже настроено на подключение к `https://crmio.ru/api/v1`.

### Сборка production APK

```bash
cd mobile
chmod +x build-apk.sh

# Способ 1: EAS Cloud (рекомендуется — не нужен Android SDK)
./build-apk.sh eas

# Способ 2: Локально (требует Android Studio)
./build-apk.sh local
```

Подробная инструкция: [`mobile/MOBILE-DEPLOY.md`](mobile/MOBILE-DEPLOY.md)

### Распространение APK

1. Скачайте собранный APK (из `mobile/autocrm-prod.apk` или по ссылке от EAS)
2. Отправьте сотрудникам через Telegram / Google Drive / Email
3. Установите на Android-устройства (разрешите установку из неизвестных источников)

> ⚠️ **Важно**: APK содержит захардкоженный URL сервера. Если вы смените домен или IP — нужно будет **пересобрать APK и переустановить**.

---

## 🎯 Следующие шаги

1. ✅ Деплой работает
2. 🔒 Настройте SSL (`./init-ssl.sh crmio.ru your@email.com`)
3. 📱 Соберите и разошлите APK сотрудникам
4. 💾 Настройте бэкапы `./data/autocrm.db` (scp/rsync на другой сервер)
5. 📈 При росте нагрузки → миграция на PostgreSQL + тариф «Разгон» (2 CPU / 4 GB)
