#!/bin/bash

# Упрощенный скрипт деплоя с использованием готового образа nginx с Brotli
# Использование: ./deploy-with-brotli.sh

set -e

echo "🚀 Деплой с готовым образом nginx + Brotli из DockerHub..."

# Проверяем наличие .env файла
if [ ! -f ".env" ]; then
    echo "❌ Файл .env не найден. Создайте его с переменной DOCKER_USER"
    echo "Пример:"
    echo "DOCKER_USER=your-dockerhub-username"
    exit 1
fi

# Загружаем переменные из .env
source .env

if [ -z "$DOCKER_USER" ]; then
    echo "❌ Переменная DOCKER_USER не установлена в .env файле"
    echo "Добавьте в .env: DOCKER_USER=your-dockerhub-username"
    exit 1
fi

echo "📦 Используем образ: $DOCKER_USER/nginx-brotli:latest"

# Проверяем, что образ существует в DockerHub
echo "🔍 Проверяем доступность образа..."
if ! docker pull $DOCKER_USER/nginx-brotli:latest > /dev/null 2>&1; then
    echo "❌ Образ $DOCKER_USER/nginx-brotli:latest не найден в DockerHub"
    echo "📝 Сначала соберите и загрузите образ:"
    echo "   ./build-and-push-brotli.sh $DOCKER_USER"
    exit 1
fi

echo "✅ Образ найден в DockerHub!"

# Создаем бэкап текущей конфигурации
echo "💾 Создаем бэкап текущей конфигурации..."
mkdir -p backups
cp nginx/nginx.conf backups/nginx.conf.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

# Останавливаем текущие сервисы
echo "⏹️ Останавливаем текущие сервисы..."
docker-compose down

# Запускаем с новым образом
echo "🚀 Запускаем сервисы с nginx + Brotli..."
docker-compose up -d

# Ждем запуска
echo "⏳ Ждем запуска сервисов (30 секунд)..."
sleep 30

# Проверяем статус
echo "📊 Проверяем статус сервисов..."
docker-compose ps

# Тестируем Brotli
echo "🧪 Тестируем Brotli..."
if [ -f "test-brotli.sh" ]; then
    ./test-brotli.sh
else
    echo "📝 Для тестирования используйте:"
    echo "   curl -H 'Accept-Encoding: br' -I https://your-domain.com"
fi

echo ""
echo "🎉 Деплой завершен!"
echo "📝 Для мониторинга: docker-compose logs -f proxy"
echo "🔗 Образ: https://hub.docker.com/r/$DOCKER_USER/nginx-brotli"
