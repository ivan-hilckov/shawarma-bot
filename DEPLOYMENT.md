# 🚀 Инструкция по настройке деплоя на VPS

## Предварительные требования

### На VPS сервере:
- Ubuntu 20.04+ или аналогичная Linux система
- Docker и Docker Compose установлены
- Git установлен
- SSH доступ настроен

### В GitHub репозитории:
- Настроенные GitHub Secrets
- Активированные GitHub Actions

## 1. Подготовка VPS сервера

### Установка Docker

```bash
# Обновляем систему
sudo apt update && sudo apt upgrade -y

# Устанавливаем Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Добавляем пользователя в группу docker
sudo usermod -aG docker $USER

# Устанавливаем Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Перезагружаемся для применения изменений
sudo reboot
```

### Настройка проекта на сервере

```bash
# Клонируем репозиторий
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

# Создаем .env файл
cp docker.env.example .env
nano .env
```

Заполните `.env` файл:
```env
BOT_TOKEN=your_telegram_bot_token
NODE_ENV=production
REDIS_URL=redis://redis:6379
DATABASE_URL=postgresql://shawarma_user:shawarma_pass@postgres:5432/shawarma_db
NOTIFICATIONS_CHAT_ID=-1001234567890
ADMIN_USER_IDS=123456789,987654321
```

### Первый запуск

```bash
# Запускаем контейнеры
docker-compose up -d

# Проверяем статус
docker-compose ps

# Смотрим логи
docker-compose logs -f bot
```

## 2. Настройка GitHub Secrets

В настройках GitHub репозитория (Settings → Secrets and variables → Actions) добавьте:

### Обязательные секреты:

| Секрет | Описание | Пример |
|--------|----------|---------|
| `VPS_HOST` | IP адрес или домен VPS | `192.168.1.100` |
| `VPS_USER` | Пользователь для SSH | `ubuntu` |
| `VPS_SSH_KEY` | Приватный SSH ключ | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `VPS_PROJECT_PATH` | Путь к проекту на VPS | `/home/ubuntu/shawarma-bot` |

### Опциональные секреты:

| Секрет | Описание |
|--------|----------|
| `TELEGRAM_BOT_TOKEN` | Токен бота для уведомлений о деплое |
| `TELEGRAM_CHAT_ID` | ID чата для уведомлений |
| `SNYK_TOKEN` | Токен для сканирования безопасности |

## 3. Настройка SSH ключей

### Генерация SSH ключей (на локальной машине):

```bash
# Генерируем новую пару ключей
ssh-keygen -t ed25519 -C "github-actions@your-domain.com" -f ~/.ssh/github_actions

# Копируем публичный ключ на VPS
ssh-copy-id -i ~/.ssh/github_actions.pub user@your-vps-ip

# Тестируем подключение
ssh -i ~/.ssh/github_actions user@your-vps-ip
```

### Добавление приватного ключа в GitHub Secrets:

```bash
# Выводим приватный ключ
cat ~/.ssh/github_actions

# Копируем весь вывод и добавляем в GitHub Secret VPS_SSH_KEY
```

## 4. Структура CI/CD Pipeline

### Этапы деплоя:

1. **Test** - запуск тестов с PostgreSQL и Redis
2. **Lint** - проверка качества кода ESLint и Prettier
3. **Security** - сканирование безопасности
4. **Build** - сборка и публикация Docker образа
5. **Deploy** - деплой на VPS сервер
6. **Health Check** - проверка работоспособности
7. **Notify** - уведомление в Telegram

### Триггеры деплоя:

- Коммит в ветку `master` или `main`
- Все тесты прошли успешно
- Код прошел проверки качества

## 5. Мониторинг и логи

### Просмотр логов на VPS:

```bash
# Логи всех сервисов
docker-compose logs -f

# Логи конкретного сервиса
docker-compose logs -f bot
docker-compose logs -f postgres
docker-compose logs -f redis

# Статус контейнеров
docker-compose ps

# Использование ресурсов
docker stats
```

### Health checks:

```bash
# Проверка health checks
docker-compose ps

# Ручная проверка здоровья
curl -f http://localhost:3000/health || echo "Service unhealthy"
```

## 6. Обновление и откат

### Автоматическое обновление:
Просто сделайте коммит в ветку `master` - деплой произойдет автоматически.

### Ручное обновление:

```bash
# На VPS сервере
cd /path/to/project
git pull origin master
docker-compose pull
docker-compose up -d
```

### Откат к предыдущей версии:

```bash
# Откат к предыдущему коммиту
git reset --hard HEAD~1
docker-compose down
docker-compose up -d
```

## 7. Безопасность

### Настройка файрвола:

```bash
# Устанавливаем ufw
sudo apt install ufw

# Разрешаем SSH
sudo ufw allow ssh

# Разрешаем только необходимые порты
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Включаем файрвол
sudo ufw enable
```

### Обновления безопасности:

```bash
# Автоматические обновления безопасности
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 8. Резервное копирование

### Бэкап базы данных:

```bash
# Создание бэкапа
docker exec shawarma-postgres pg_dump -U shawarma_user shawarma_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление из бэкапа
docker exec -i shawarma-postgres psql -U shawarma_user -d shawarma_db < backup_file.sql
```

### Автоматический бэкап (crontab):

```bash
# Добавляем в crontab
crontab -e

# Бэкап каждый день в 2:00
0 2 * * * cd /home/ubuntu/shawarma-bot && docker exec shawarma-postgres pg_dump -U shawarma_user shawarma_db > backups/backup_$(date +\%Y\%m\%d_\%H\%M\%S).sql
```

## 9. Troubleshooting

### Частые проблемы:

#### Контейнеры не запускаются:
```bash
# Проверяем логи
docker-compose logs

# Проверяем конфигурацию
docker-compose config

# Пересоздаем контейнеры
docker-compose down -v
docker-compose up -d
```

#### SSH подключение не работает:
```bash
# Проверяем SSH ключи
ssh -vvv -i ~/.ssh/github_actions user@vps-ip

# Проверяем права на ключи
chmod 600 ~/.ssh/github_actions
chmod 644 ~/.ssh/github_actions.pub
```

#### Деплой падает:
```bash
# Проверяем GitHub Actions логи
# Проверяем доступность VPS
ping your-vps-ip

# Проверяем место на диске
df -h
```

## 10. Полезные команды

```bash
# Очистка Docker
docker system prune -a

# Просмотр использования места
du -sh /var/lib/docker

# Перезапуск всех сервисов
docker-compose restart

# Обновление образов
docker-compose pull && docker-compose up -d

# Просмотр переменных окружения
docker-compose exec bot env
```

---

## ✅ Чек-лист готовности к продакшену

- [ ] VPS сервер настроен и доступен
- [ ] Docker и Docker Compose установлены
- [ ] SSH ключи настроены
- [ ] GitHub Secrets добавлены
- [ ] .env файл создан на сервере
- [ ] Первый деплой выполнен успешно
- [ ] Health checks работают
- [ ] Логи доступны и информативны
- [ ] Мониторинг настроен
- [ ] Бэкапы настроены
- [ ] Файрвол настроен
- [ ] SSL сертификаты установлены (если нужно)

После выполнения всех пунктов ваш бот готов к продакшену! 🚀 
