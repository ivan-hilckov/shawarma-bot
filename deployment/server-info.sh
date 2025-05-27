#!/bin/bash

# 🔍 Скрипт сбора информации о VPS сервере
# Создает подробный отчет об инфраструктуре для документации

set -e

LOG_FILE="server-info-$(date +%Y%m%d_%H%M%S).log"
echo "🔍 Сбор информации о VPS сервере..."
echo "📄 Лог файл: $LOG_FILE"
echo ""

# Функция для добавления разделителя
section() {
    echo "" >> "$LOG_FILE"
    echo "===========================================" >> "$LOG_FILE"
    echo "🔹 $1" >> "$LOG_FILE"
    echo "===========================================" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
}

# Функция для выполнения команды с обработкой ошибок
safe_exec() {
    local cmd="$1"
    local desc="$2"

    echo "  ✓ $desc"
    echo "# $desc" >> "$LOG_FILE"
    echo "$ $cmd" >> "$LOG_FILE"

    if eval "$cmd" >> "$LOG_FILE" 2>&1; then
        echo "" >> "$LOG_FILE"
    else
        echo "❌ Ошибка выполнения команды" >> "$LOG_FILE"
        echo "" >> "$LOG_FILE"
    fi
}

# Начало сбора информации
{
    echo "🔍 ОТЧЕТ О VPS СЕРВЕРЕ"
    echo "Дата создания: $(date)"
    echo "Хост: $(hostname)"
    echo "Пользователь: $(whoami)"
    echo ""
} > "$LOG_FILE"

# 1. Основная информация о системе
section "ОСНОВНАЯ ИНФОРМАЦИЯ О СИСТЕМЕ"
safe_exec "uname -a" "Информация о ядре системы"
safe_exec "cat /etc/os-release" "Информация об операционной системе"
safe_exec "hostnamectl" "Детальная информация о хосте"
safe_exec "uptime" "Время работы системы"
safe_exec "date" "Текущая дата и время"
safe_exec "timedatectl" "Настройки времени"

# 2. Аппаратные ресурсы
section "АППАРАТНЫЕ РЕСУРСЫ"
safe_exec "lscpu" "Информация о процессоре"
safe_exec "free -h" "Использование памяти"
safe_exec "df -h" "Использование дискового пространства"
safe_exec "lsblk" "Блочные устройства"
safe_exec "cat /proc/meminfo | head -20" "Детальная информация о памяти"
safe_exec "cat /proc/cpuinfo | grep -E '(processor|model name|cpu MHz|cache size)' | head -20" "Детали процессора"

# 3. Сетевая конфигурация
section "СЕТЕВАЯ КОНФИГУРАЦИЯ"
safe_exec "ip addr show" "Сетевые интерфейсы"
safe_exec "ip route show" "Таблица маршрутизации"
safe_exec "ss -tuln" "Открытые порты"
safe_exec "curl -s ifconfig.me" "Внешний IP адрес"
safe_exec "cat /etc/resolv.conf" "DNS настройки"

# 4. Установленное ПО
section "УСТАНОВЛЕННОЕ ПРОГРАММНОЕ ОБЕСПЕЧЕНИЕ"
safe_exec "which docker && docker --version" "Docker"
safe_exec "which docker-compose && docker-compose --version" "Docker Compose"
safe_exec "which nginx && nginx -v" "Nginx"
safe_exec "which node && node --version" "Node.js"
safe_exec "which npm && npm --version" "NPM"
safe_exec "which git && git --version" "Git"
safe_exec "which curl && curl --version | head -1" "cURL"
safe_exec "which wget && wget --version | head -1" "wget"
safe_exec "which htop && htop --version" "htop"
safe_exec "which vim && vim --version | head -1" "Vim"

# 5. Системные сервисы
section "СИСТЕМНЫЕ СЕРВИСЫ"
safe_exec "systemctl list-units --type=service --state=running | grep -E '(nginx|docker|ssh)'" "Активные сервисы"
safe_exec "systemctl status nginx" "Статус Nginx"
safe_exec "systemctl status docker" "Статус Docker"
safe_exec "systemctl status ssh" "Статус SSH"

# 6. Docker информация
section "DOCKER ИНФРАСТРУКТУРА"
safe_exec "docker system info" "Информация о Docker системе"
safe_exec "docker images" "Docker образы"
safe_exec "docker ps -a" "Docker контейнеры"
safe_exec "docker network ls" "Docker сети"
safe_exec "docker volume ls" "Docker тома"
safe_exec "docker system df" "Использование места Docker"

# 7. Nginx конфигурация
section "NGINX КОНФИГУРАЦИЯ"
safe_exec "nginx -t" "Проверка конфигурации Nginx"
safe_exec "cat /etc/nginx/nginx.conf" "Основная конфигурация Nginx"
safe_exec "ls -la /etc/nginx/sites-enabled/" "Включенные сайты"
safe_exec "ls -la /etc/nginx/conf.d/" "Дополнительные конфигурации"

# 8. Проект Shawarma Bot
section "ПРОЕКТ SHAWARMA BOT"
if [ -d ~/shawarma-bot ]; then
    cd ~/shawarma-bot
    safe_exec "pwd" "Текущая директория проекта"
    safe_exec "ls -la" "Содержимое директории проекта"
    safe_exec "git status" "Статус Git репозитория"
    safe_exec "git log --oneline -10" "Последние коммиты"
    safe_exec "cat package.json | grep -E '(name|version|description)'" "Информация о проекте"
    safe_exec "docker-compose ps" "Статус контейнеров проекта"
    safe_exec "docker-compose logs --tail=20 api" "Последние логи API"
    safe_exec "docker-compose logs --tail=20 bot" "Последние логи бота"
else
    echo "Проект shawarma-bot не найден в домашней директории" >> "$LOG_FILE"
fi

# 9. Процессы и ресурсы
section "ПРОЦЕССЫ И ИСПОЛЬЗОВАНИЕ РЕСУРСОВ"
safe_exec "ps aux --sort=-%cpu | head -20" "Топ процессов по CPU"
safe_exec "ps aux --sort=-%mem | head -20" "Топ процессов по памяти"
safe_exec "iotop -b -n 1 2>/dev/null | head -20 || echo 'iotop не установлен'" "I/O активность"

# 10. Логи системы
section "СИСТЕМНЫЕ ЛОГИ"
safe_exec "journalctl --since='1 hour ago' --no-pager | tail -50" "Системные логи за последний час"
safe_exec "tail -50 /var/log/nginx/access.log" "Логи доступа Nginx"
safe_exec "tail -50 /var/log/nginx/error.log" "Логи ошибок Nginx"

# 11. Безопасность
section "БЕЗОПАСНОСТЬ"
safe_exec "ufw status" "Статус файрвола"
safe_exec "last | head -20" "Последние входы в систему"
safe_exec "who" "Текущие пользователи"
safe_exec "cat /etc/passwd | grep -E '(root|ubuntu|shawarma)'" "Системные пользователи"

# 12. Мониторинг и производительность
section "МОНИТОРИНГ И ПРОИЗВОДИТЕЛЬНОСТЬ"
safe_exec "cat /proc/loadavg" "Средняя нагрузка"
safe_exec "vmstat 1 5" "Статистика виртуальной памяти"
safe_exec "iostat 1 3 2>/dev/null || echo 'iostat не установлен'" "I/O статистика"

# 13. Переменные окружения
section "ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ"
safe_exec "env | grep -E '(PATH|HOME|USER|SHELL|LANG)'" "Основные переменные окружения"
if [ -f ~/.bashrc ]; then
    safe_exec "cat ~/.bashrc | grep -v '^#' | grep -v '^$'" "Настройки bash"
fi

# 14. Cron задачи
section "АВТОМАТИЗАЦИЯ"
safe_exec "crontab -l 2>/dev/null || echo 'Нет cron задач'" "Cron задачи пользователя"
safe_exec "ls -la /etc/cron.d/" "Системные cron задачи"

# 15. API проверки
section "API ПРОВЕРКИ"
safe_exec "curl -s http://localhost:3000/api/health | jq . 2>/dev/null || curl -s http://localhost:3000/api/health" "Health check API"
safe_exec "curl -s http://localhost/health | jq . 2>/dev/null || curl -s http://localhost/health" "Health check через Nginx"

# Завершение
{
    echo ""
    echo "==========================================="
    echo "✅ СБОР ИНФОРМАЦИИ ЗАВЕРШЕН"
    echo "==========================================="
    echo ""
    echo "Дата завершения: $(date)"
    echo "Размер лог файла: $(du -h "$LOG_FILE" | cut -f1)"
    echo ""
    echo "📋 Для анализа используйте:"
    echo "  cat $LOG_FILE"
    echo "  grep 'ERROR\\|FAIL' $LOG_FILE"
    echo "  grep 'docker\\|nginx' $LOG_FILE"
    echo ""
} >> "$LOG_FILE"

echo ""
echo "✅ Сбор информации завершен!"
echo "📄 Лог файл: $LOG_FILE"
echo "📊 Размер: $(du -h "$LOG_FILE" | cut -f1)"
echo ""
echo "🔍 Для просмотра:"
echo "  cat $LOG_FILE"
echo "  less $LOG_FILE"
echo ""
echo "📤 Для отправки:"
echo "  scp $LOG_FILE user@local-machine:~/"
echo ""
