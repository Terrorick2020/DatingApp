#!/bin/bash

# Скрипт для сборки nginx с Brotli и загрузки в DockerHub
# Использование: ./build-and-push-brotli.sh [your-dockerhub-username]

set -e

# Получаем имя пользователя DockerHub
DOCKER_USER=${1:-${DOCKER_USER}}

if [ -z "$DOCKER_USER" ]; then
    echo "❌ Не указано имя пользователя DockerHub"
    echo "Использование: ./build-and-push-brotli.sh your-dockerhub-username"
    echo "Или установите переменную DOCKER_USER"
    exit 1
fi

IMAGE_NAME="nginx-brotli"
FULL_IMAGE_NAME="$DOCKER_USER/$IMAGE_NAME"

echo "🚀 Собираем образ nginx с Brotli..."
echo "📦 Имя образа: $FULL_IMAGE_NAME"

# Проверяем, что Docker запущен
if ! docker info &> /dev/null; then
    echo "❌ Docker не запущен или недоступен"
    exit 1
fi

# Логинимся в DockerHub (если не залогинены)
echo "🔐 Проверяем авторизацию в DockerHub..."
if ! docker info | grep -q "Username"; then
    echo "📝 Войдите в DockerHub:"
    docker login
fi

# Собираем образ
echo "🔨 Собираем образ nginx с Brotli (это займет 10-15 минут)..."
docker build -f nginx/Dockerfile.brotli -t $FULL_IMAGE_NAME:latest .

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при сборке образа"
    exit 1
fi

echo "✅ Образ успешно собран!"

# Тестируем образ
echo "🧪 Тестируем образ..."
docker run --rm $FULL_IMAGE_NAME:latest nginx -V | grep -i brotli && echo "✅ Brotli модуль найден" || echo "❌ Brotli модуль не найден"

# Загружаем в DockerHub
echo "📤 Загружаем образ в DockerHub..."
docker push $FULL_IMAGE_NAME:latest

if [ $? -eq 0 ]; then
    echo "🎉 Образ успешно загружен в DockerHub!"
    echo "📋 Для использования обновите docker-compose.yml:"
    echo "   image: $FULL_IMAGE_NAME:latest"
    echo ""
    echo "🔗 Ссылка на образ: https://hub.docker.com/r/$FULL_IMAGE_NAME"
else
    echo "❌ Ошибка при загрузке образа в DockerHub"
    exit 1
fi

# Создаем тег с версией
VERSION=$(date +%Y%m%d_%H%M%S)
echo "🏷️ Создаем версионный тег: $VERSION"
docker tag $FULL_IMAGE_NAME:latest $FULL_IMAGE_NAME:$VERSION
docker push $FULL_IMAGE_NAME:$VERSION

echo "✅ Версия $VERSION также загружена!"
echo ""
echo "📝 Теперь вы можете использовать образ в docker-compose.yml:"
echo "   image: $FULL_IMAGE_NAME:latest"
echo "   # или"
echo "   image: $FULL_IMAGE_NAME:$VERSION"
