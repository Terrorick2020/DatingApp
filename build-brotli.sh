#!/bin/bash

# Скрипт для сборки nginx с поддержкой Brotli
# Использование: ./build-brotli.sh

set -e

echo "🚀 Начинаем сборку nginx с поддержкой Brotli..."

# Проверяем наличие Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не найден. Установите Docker и попробуйте снова."
    exit 1
fi

# Останавливаем текущий контейнер nginx
echo "⏹️ Останавливаем текущий nginx контейнер..."
docker-compose stop proxy || true

# Собираем новый образ с Brotli
echo "🔨 Собираем nginx с поддержкой Brotli (это может занять 10-15 минут)..."
docker-compose build proxy

# Проверяем, что образ собрался успешно
if [ $? -eq 0 ]; then
    echo "✅ Образ nginx с Brotli успешно собран!"
    
    # Запускаем контейнер
    echo "🚀 Запускаем nginx с Brotli..."
    docker-compose up -d proxy
    
    # Проверяем статус
    echo "📊 Проверяем статус контейнера..."
    docker-compose ps proxy
    
    echo ""
    echo "🎉 Brotli успешно настроен!"
    echo "📝 Для проверки используйте: ./test-brotli.sh"
else
    echo "❌ Ошибка при сборке образа. Проверьте логи выше."
    exit 1
fi
