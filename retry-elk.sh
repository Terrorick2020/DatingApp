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
docker pull docker.elastic.co/elasticsearch/elasticsearch:8.9.0

echo "📥 Скачивание образов Kibana..."
docker pull docker.elastic.co/kibana/kibana:8.9.0

echo "📥 Скачивание образов Logstash..."
docker pull docker.elastic.co/logstash/logstash:8.9.0

echo "📥 Скачивание образов Filebeat..."
docker pull docker.elastic.co/beats/filebeat:8.9.0

# Запускаем ELK Stack
echo "🚀 Запуск ELK Stack..."
docker-compose -f docker-compose.elk.yml up -d

echo "✅ ELK Stack перезапущен!"
echo "🌐 Kibana: http://localhost:5601"
echo "🔍 Elasticsearch: http://localhost:9200"
