#!/bin/bash

echo "🔄 Повторный запуск ELK Stack..."

# Останавливаем текущий ELK Stack
echo "🛑 Остановка текущего ELK Stack..."
docker-compose -f docker-compose.elk.yml down 2>/dev/null || true

# Очищаем неиспользуемые образы
echo "🧹 Очистка неиспользуемых образов..."
docker image prune -f

# Пробуем скачать образы по одному
echo "📥 Скачивание образов Elasticsearch..."
docker pull elasticsearch:8.10.0

echo "📥 Скачивание образов Kibana..."
docker pull kibana:8.10.0

echo "📥 Скачивание образов Logstash..."
docker pull logstash:8.10.0

echo "📥 Скачивание образов Filebeat..."
docker pull filebeat:8.10.0

# Запускаем ELK Stack
echo "🚀 Запуск ELK Stack..."
docker-compose -f docker-compose.elk.yml up -d

echo "✅ ELK Stack перезапущен!"
echo "🌐 Kibana: http://localhost:5601"
echo "🔍 Elasticsearch: http://localhost:9200"
