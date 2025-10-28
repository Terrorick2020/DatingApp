#!/bin/bash

echo "🚀 Запуск всего приложения с мониторингом..."

# Запуск основного приложения
echo "📱 Запуск основного приложения..."
docker-compose up -d --build

# Ждем немного
sleep 10

# Запуск ELK Stack
echo "📊 Запуск ELK Stack..."
docker-compose -f docker-compose.elk.yml up -d

echo "✅ Все сервисы запущены!"
echo ""
echo "🌐 Основное приложение:"
echo "  - API: http://localhost:3000"
echo "  - Bot: http://localhost:9000"
echo "  - WebSocket: http://localhost:7000"
echo "  - Client: http://localhost:4178"
echo ""
echo "📊 Мониторинг:"
echo "  - Kibana: http://localhost:5601"
echo "  - Elasticsearch: http://localhost:9200"
echo "  - Logstash: http://localhost:9600"
