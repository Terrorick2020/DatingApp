#!/bin/sh
# Перезапишем пароль в конфиге
sed -i "s|\${REDIS_PASSWORD}|$REDIS_PASSWORD|" /usr/local/etc/redis.conf
exec redis-server /usr/local/etc/redis.conf
