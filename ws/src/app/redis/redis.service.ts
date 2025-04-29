// ws/src/app/redis/redis.service.ts
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class RedisService {
	private readonly redisClient: Redis

	constructor(private readonly configService: ConfigService) {
		this.redisClient = new Redis({
			host: this.configService.get('REDIS_HOST', 'localhost'),
			port: this.configService.get('REDIS_PORT', 6379),
			password: this.configService.get('REDIS_PASSWORD'),
			db: this.configService.get('REDIS_DB', 0),
		})
	}

	async get(key: string): Promise<string | null> {
		return this.redisClient.get(key)
	}

	async set(key: string, value: string, ttl?: number): Promise<string> {
		if (ttl) {
			return this.redisClient.set(key, value, 'EX', ttl)
		}
		return this.redisClient.set(key, value)
	}

	async del(key: string): Promise<number> {
		return this.redisClient.del(key)
	}

	async hset(key: string, field: string, value: string): Promise<number> {
		return this.redisClient.hset(key, field, value)
	}

	async expire(key: string, seconds: number): Promise<number> {
		return this.redisClient.expire(key, seconds)
	}

	async hget(key: string, field: string): Promise<string | null> {
		return this.redisClient.hget(key, field)
	}

	async hgetall(key: string): Promise<Record<string, string>> {
		return this.redisClient.hgetall(key)
	}

	async hdel(key: string, field: string): Promise<number> {
		return this.redisClient.hdel(key, field)
	}

	// Методы для работы со списками
	async addToList(key: string, value: string): Promise<number> {
		return this.redisClient.sadd(key, value)
	}

	async removeFromList(key: string, value: string): Promise<number> {
		return this.redisClient.srem(key, value)
	}

	async getList(key: string): Promise<string[]> {
		return this.redisClient.smembers(key)
	}

	// Методы для работы с сортированными множествами
	async addToSortedSet(
		key: string,
		score: number,
		value: string
	): Promise<number> {
		return this.redisClient.zadd(key, score, value)
	}

	async getSortedSet(key: string, start = 0, end = -1): Promise<string[]> {
		return this.redisClient.zrange(key, start, end)
	}
}
