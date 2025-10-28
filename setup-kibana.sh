#!/bin/bash

echo "🔧 Настройка Kibana индексов и дашбордов..."

# Ждем запуска Elasticsearch
echo "⏳ Ожидание запуска Elasticsearch..."
until curl -f http://localhost:9200/_cluster/health; do
  echo "Elasticsearch еще не готов, ждем..."
  sleep 5
done

echo "✅ Elasticsearch готов!"

# Создаем индекс шаблон для логов
echo "📊 Создание индекс шаблона..."
curl -X PUT "localhost:9200/_index_template/dating-app-logs" \
  -H "Content-Type: application/json" \
  -d '{
    "index_patterns": ["dating-app-logs-*"],
    "template": {
      "settings": {
        "number_of_shards": 1,
        "number_of_replicas": 0
      },
      "mappings": {
        "properties": {
          "@timestamp": {
            "type": "date"
          },
          "level": {
            "type": "keyword"
          },
          "context": {
            "type": "text"
          },
          "log_message": {
            "type": "text"
          },
          "service": {
            "type": "keyword"
          },
          "environment": {
            "type": "keyword"
          },
          "path": {
            "type": "keyword"
          },
          "method": {
            "type": "keyword"
          },
          "status_code": {
            "type": "integer"
          },
          "duration": {
            "type": "integer"
          },
          "client_ip": {
            "type": "ip"
          }
        }
      }
    }
  }'

echo ""
echo "✅ Индекс шаблон создан!"

# Ждем запуска Kibana
echo "⏳ Ожидание запуска Kibana..."
until curl -f http://localhost:5601/api/status; do
  echo "Kibana еще не готов, ждем..."
  sleep 5
done

echo "✅ Kibana готов!"

echo ""
echo "🎉 Настройка завершена!"
echo "🌐 Откройте Kibana: http://localhost:5601"
echo "📊 Создайте индекс паттерн: dating-app-logs-*"
echo "📈 Импортируйте дашборды из elk/kibana/dashboards/"
