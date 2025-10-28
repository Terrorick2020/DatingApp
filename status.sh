#!/bin/bash

echo "📊 Статус всех сервисов..."
echo ""

echo "📱 Основное приложение:"
docker-compose ps

echo ""
echo "📊 ELK Stack:"
docker-compose -f docker-compose.elk.yml ps

echo ""
echo "💾 Использование дискового пространства:"
docker system df

echo ""
echo "🔍 Проверка здоровья сервисов:"
echo "  - API: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "недоступен")"
echo "  - Elasticsearch: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:9200 || echo "недоступен")"
echo "  - Kibana: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:5601 || echo "недоступен")"
