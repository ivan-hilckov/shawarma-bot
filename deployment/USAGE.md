# 🚀 Быстрое руководство по анализу сервера

## 📋 Пошаговая инструкция

### 1. Запуск сбора информации

```bash
# Подключитесь к серверу
ssh user@your-server

# Перейдите в папку проекта
cd ~/shawarma-bot/deployment

# Запустите сбор информации
./server-info.sh
```

### 2. Скачивание отчета

```bash
# На локальной машине
scp user@your-server:~/shawarma-bot/deployment/server-info-*.log ./
```

### 3. Анализ данных

Откройте файл `SERVER_ANALYSIS.md` и заполните его на основе данных из лог файла:

```bash
# Просмотр лога
cat server-info-20241228_120000.log

# Поиск конкретной информации
grep "Docker" server-info-*.log
grep "nginx" server-info-*.log
grep "ERROR\|FAIL" server-info-*.log
```

## 🔍 Что искать в логе

### Системная информация

- **ОС**: ищите `ОСНОВНАЯ ИНФОРМАЦИЯ О СИСТЕМЕ`
- **Ресурсы**: ищите `АППАРАТНЫЕ РЕСУРСЫ`
- **Сеть**: ищите `СЕТЕВАЯ КОНФИГУРАЦИЯ`

### Docker

- **Контейнеры**: ищите `docker ps -a`
- **Образы**: ищите `docker images`
- **Использование**: ищите `docker system df`

### Nginx

- **Статус**: ищите `systemctl status nginx`
- **Конфигурация**: ищите `nginx -t`
- **Логи**: ищите `/var/log/nginx/`

### Проект

- **Версия**: ищите `package.json`
- **Git**: ищите `git status`
- **Логи**: ищите `docker-compose logs`

## ⚠️ Проблемы и решения

### Скрипт не запускается

```bash
chmod +x server-info.sh
```

### Нет доступа к Docker

```bash
sudo usermod -aG docker $USER
# Перелогиньтесь
```

### Большой размер лога

```bash
# Сжать лог
gzip server-info-*.log

# Скачать сжатый
scp user@server:~/shawarma-bot/deployment/server-info-*.log.gz ./
```

## 📊 Полезные команды для анализа

```bash
# Размер лога
du -h server-info-*.log

# Количество строк
wc -l server-info-*.log

# Поиск ошибок
grep -i "error\|fail\|warning" server-info-*.log

# Информация о Docker
grep -A 10 "DOCKER ИНФРАСТРУКТУРА" server-info-*.log

# Статус сервисов
grep -A 5 "systemctl status" server-info-*.log
```

## 📝 Заполнение документации

1. Откройте `SERVER_ANALYSIS.md`
2. Найдите соответствующие разделы в логе
3. Скопируйте важную информацию
4. Добавьте свои комментарии и рекомендации
5. Сохраните документ для команды

---

**Время выполнения**: ~2-3 минуты  
**Размер лога**: обычно 50-200KB  
**Периодичность**: рекомендуется раз в месяц или при проблемах
