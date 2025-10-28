#!/bin/bash

echo "🛑 Остановка всех сервисов..."

# Остановка ELK Stack
echo "📊 Остановка ELK Stack..."
docker-compose -f docker-compose.elk.yml down

# Остановка основного приложения
echo "📱 Остановка основного приложения..."
docker-compose down

echo "✅ Все сервисы остановлены!"
