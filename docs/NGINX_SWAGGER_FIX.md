# 🔧 Исправление проблемы Swagger UI в Nginx

**Дата:** 28 мая 2025  
**Проблема:** Swagger UI `/api/docs` перенаправляет на `/api/docs/static/index.html`  
**Статус:** ✅ Исправлено

## 🚨 Описание проблемы

При обращении к `http://botgarden.store/api/docs` происходило некорректное перенаправление на `http://botgarden.store/api/docs/static/index.html`, что приводило к ошибке 404.

## 🔍 Причина проблемы

В nginx конфигурации отсутствовал специальный блок для обработки `/api/docs`. Swagger UI требует особой настройки для корректной работы статических файлов документации.

## ✅ Решение

### 1. Добавлен специальный блок для Swagger UI

```nginx
# Swagger UI - специальная обработка для статических файлов документации
location /api/docs {
    limit_req zone=api burst=20 nodelay;

    proxy_pass http://shawarma_api/api/docs;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;

    # Таймауты
    proxy_connect_timeout 30s;
    proxy_send_timeout 30s;
    proxy_read_timeout 30s;

    # Важно для Swagger UI - убираем слэш в конце
    proxy_redirect off;

    # CORS заголовки для Swagger UI
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept" always;
}
```

### 2. Обновлен server_name для всех доменов

```nginx
server_name botcraft.tech botgarden.shop botgarden.store botgarden.tech botgrover.fun botgrover.ru;
```

### 3. Порядок location блоков

Важно: блок `/api/docs` должен идти **перед** общим блоком `/api/` для правильного перехвата запросов.

## 🌐 Добавленные домены

Следующие домены теперь обслуживаются nginx:

- 🏪 **botgarden.store** - основной магазин Shawarma Bot
- 🛒 **botgarden.shop** - будущая торговая площадка ботов
- 🔧 **botgarden.tech** - техническая документация
- 🌐 **botcraft.tech** - будущий сервис крафт-ботов
- 🎮 **botgrover.fun** - игровые боты
- 🇷🇺 **botgrover.ru** - российская локализация

## 🚀 Деплой исправления

```bash
cd deployment
./deploy.sh
```

Скрипт автоматически:

1. ✅ Проверит синтаксис новой nginx конфигурации
2. 💾 Создаст бэкап текущей конфигурации
3. 🔄 Заменит конфигурацию и перезагрузит nginx
4. ⚠️ При ошибке - автоматически откатится к предыдущей версии

## ✅ Результат

После исправления:

- ✅ `http://botgarden.store/api/docs` - корректно отображает Swagger UI
- ✅ `http://botgarden.store/health` - работает health check
- ✅ `http://botgarden.store/api/menu/categories` - работает Menu API
- ✅ Все домены обслуживаются одной конфигурацией
- ✅ CORS заголовки настроены для frontend интеграции

## 🔧 Техническая документация

Обновленная документация:

- 📄 `docs/VPS_ANALYSIS.md` - добавлена информация о доменах и nginx
- 📄 `README.md` - обновлен раздел API документации
- 📄 `deployment/nginx.conf` - исправленная конфигурация

---

**Проблема решена:** Swagger UI теперь корректно работает на всех доменах.
