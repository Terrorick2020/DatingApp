#!/bin/bash

# Скрипт для полного деплоя с Brotli
# Использование: ./deploy-brotli.sh

set -e

echo "🚀 Полный деплой с поддержкой Brotli..."

# Проверяем наличие необходимых файлов
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml не найден. Запустите скрипт из корня проекта."
    exit 1
fi

if [ ! -f "nginx/Dockerfile" ]; then
    echo "❌ nginx/Dockerfile не найден."
    exit 1
fi

# Создаем бэкап текущей конфигурации
echo "💾 Создаем бэкап текущей конфигурации..."
mkdir -p backups
cp nginx/nginx.conf backups/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)

# Останавливаем все сервисы
echo "⏹️ Останавливаем все сервисы..."
docker-compose down

# Очищаем старые образы nginx
echo "🧹 Очищаем старые образы nginx..."
docker images | grep nginx | awk '{print $3}' | xargs -r docker rmi -f || true

# Собираем новый образ
echo "🔨 Собираем nginx с Brotli (это займет 10-15 минут)..."
docker-compose build proxy

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при сборке. Восстанавливаем бэкап..."
    cp backups/nginx.conf.backup.* nginx/nginx.conf
    exit 1
fi

# Запускаем все сервисы
echo "🚀 Запускаем все сервисы..."
docker-compose up -d

# Ждем запуска сервисов
echo "⏳ Ждем запуска сервисов (30 секунд)..."
sleep 30

# Проверяем статус
echo "📊 Проверяем статус всех сервисов..."
docker-compose ps

# Тестируем Brotli
echo "🧪 Тестируем Brotli..."
./test-brotli.sh

echo ""
echo "🎉 Деплой с Brotli завершен!"
echo "📝 Для мониторинга используйте: docker-compose logs -f proxy"
