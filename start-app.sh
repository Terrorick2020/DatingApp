#!/bin/bash

echo "🚀 Запуск основного приложения Dating App..."

# Запуск основного приложения
docker-compose up -d --build

echo "✅ Основное приложение запущено!"
echo "🌐 API: http://localhost:3000"
echo "🤖 Bot: http://localhost:9000"
echo "💬 WebSocket: http://localhost:7000"
echo "🖥️ Client: http://localhost:4178"
