#!/bin/bash

# Скрипт для тестирования Brotli сжатия
# Использование: ./test-brotli.sh

set -e

echo "🧪 Тестируем Brotli сжатие..."

# Получаем домен из docker-compose.yml
DOMAIN=$(grep -o 'VITE_API_URL=https://[^/]*' docker-compose.yml | cut -d'/' -f3 | head -1)

if [ -z "$DOMAIN" ]; then
    echo "❌ Не удалось определить домен. Проверьте docker-compose.yml"
    exit 1
fi

echo "🌐 Тестируем домен: $DOMAIN"

# Проверяем, что nginx запущен
if ! docker-compose ps proxy | grep -q "Up"; then
    echo "❌ Nginx контейнер не запущен. Запустите: docker-compose up -d proxy"
    exit 1
fi

echo ""
echo "📊 Тестируем сжатие статических файлов..."

# Тестируем gzip
echo "🔍 Проверяем gzip сжатие:"
curl -H "Accept-Encoding: gzip" -I "https://$DOMAIN" 2>/dev/null | grep -i "content-encoding\|content-length" || echo "gzip не обнаружен"

echo ""
echo "🔍 Проверяем Brotli сжатие:"
curl -H "Accept-Encoding: br" -I "https://$DOMAIN" 2>/dev/null | grep -i "content-encoding\|content-length" || echo "Brotli не обнаружен"

echo ""
echo "📈 Сравнение размеров файлов:"

# Тестируем API
echo "🔍 Тестируем API сжатие:"
API_RESPONSE=$(curl -s -H "Accept-Encoding: gzip" "https://$DOMAIN/api/health" 2>/dev/null | wc -c)
BROTLI_RESPONSE=$(curl -s -H "Accept-Encoding: br" "https://$DOMAIN/api/health" 2>/dev/null | wc -c)

if [ "$API_RESPONSE" -gt 0 ] && [ "$BROTLI_RESPONSE" -gt 0 ]; then
    echo "📊 API ответ:"
    echo "  Gzip: $API_RESPONSE байт"
    echo "  Brotli: $BROTLI_RESPONSE байт"
    
    if [ "$BROTLI_RESPONSE" -lt "$API_RESPONSE" ]; then
        SAVINGS=$(( (API_RESPONSE - BROTLI_RESPONSE) * 100 / API_RESPONSE ))
        echo "  💰 Экономия: $SAVINGS%"
    else
        echo "  ⚠️ Brotli не активен для API"
    fi
else
    echo "❌ API недоступен или не отвечает"
fi

echo ""
echo "🔧 Проверяем модули nginx:"
docker-compose exec proxy nginx -V 2>&1 | grep -i brotli && echo "✅ Brotli модуль найден" || echo "❌ Brotli модуль не найден"

echo ""
echo "📋 Логи nginx (последние 10 строк):"
docker-compose logs --tail=10 proxy

echo ""
echo "🎯 Для детального тестирования используйте:"
echo "curl -H 'Accept-Encoding: br' -v https://$DOMAIN"
echo "curl -H 'Accept-Encoding: gzip' -v https://$DOMAIN"
