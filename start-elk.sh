#!/bin/bash

echo "🚀 Запуск ELK Stack для визуализации логов..."

# Создаем необходимые директории
mkdir -p elk/logstash/config
mkdir -p elk/logstash/pipeline
mkdir -p elk/filebeat
mkdir -p logs

# Устанавливаем права на файлы
chmod 644 elk/logstash/config/logstash.yml
chmod 644 elk/logstash/pipeline/logstash.conf
chmod 644 elk/filebeat/filebeat.yml

# Запускаем ELK Stack
echo "📊 Запуск Elasticsearch, Logstash, Kibana и Filebeat..."
docker-compose -f docker-compose.elk.yml up -d

# Ждем запуска сервисов
echo "⏳ Ожидание запуска сервисов..."
sleep 30

# Проверяем статус
echo "🔍 Проверка статуса сервисов..."
docker-compose -f docker-compose.elk.yml ps

echo "✅ ELK Stack запущен!"
echo "🌐 Kibana доступен по адресу: http://localhost:5601"
echo "🔍 Elasticsearch доступен по адресу: http://localhost:9200"
echo "📊 Logstash доступен по адресу: http://localhost:9600"

echo ""
echo "📋 Для остановки ELK Stack выполните:"
echo "docker-compose -f docker-compose.elk.yml down"
