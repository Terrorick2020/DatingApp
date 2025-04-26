#!/bin/sh
echo "requirepass $REDIS_PASSWORD" > /usr/local/etc/redis.conf
exec redis-server /usr/local/etc/redis.conf
