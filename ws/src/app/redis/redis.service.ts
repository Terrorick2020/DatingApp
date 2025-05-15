import { Injectable, Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'
import { Logger } from '@nestjs/common'

@Injectable()
export class RedisService {
	private readonly logger = new Logger(RedisService.name)

	constructor(
		@Inject('REDIS_CLIENT') public readonly redis: Redis,
		private readonly configService: ConfigService
	) {}

	// Экспортируем redis клиент публично для прямого доступа

	// Методы для работы с Redis
	async get(key: string): Promise<string | null> {
		try {
			return await this.redis.get(key)
		} catch (error) {
			this.logger.error(`Error getting key ${key}: ${error.message}`)
			return null
		}
	}

	async set(key: string, value: string, ttl?: number): Promise<string | null> {
		try {
			if (ttl) {
				return await this.redis.set(key, value, 'EX', ttl)
			}
			return await this.redis.set(key, value)
		} catch (error) {
			this.logger.error(`Error setting key ${key}: ${error.message}`)
			return null
		}
	}

	async del(key: string): Promise<number> {
		try {
			return await this.redis.del(key)
		} catch (error) {
			this.logger.error(`Error deleting key ${key}: ${error.message}`)
			return 0
		}
	}

	async hset(key: string, ...args: string[]): Promise<number> {
		try {
			return await this.redis.hset(key, ...args)
		} catch (error) {
			this.logger.error(
				`Error setting hash field for key ${key}: ${error.message}`
			)
			return 0
		}
	}

	async hget(key: string, field: string): Promise<string | null> {
		try {
			return await this.redis.hget(key, field)
		} catch (error) {
			this.logger.error(
				`Error getting hash field ${field} for key ${key}: ${error.message}`
			)
			return null
		}
	}

	async hmget(key: string, ...fields: string[]): Promise<(string | null)[]> {
		try {
			return await this.redis.hmget(key, ...fields)
		} catch (error) {
			this.logger.error(
				`Error getting multiple hash fields for key ${key}: ${error.message}`
			)
			return Array(fields.length).fill(null)
		}
	}

	async hgetall(key: string): Promise<Record<string, string>> {
		try {
			return await this.redis.hgetall(key)
		} catch (error) {
			this.logger.error(
				`Error getting all hash fields for key ${key}: ${error.message}`
			)
			return {}
		}
	}

	async expire(key: string, seconds: number): Promise<number> {
		try {
			return await this.redis.expire(key, seconds)
		} catch (error) {
			this.logger.error(`Error setting expire for key ${key}: ${error.message}`)
			return 0
		}
	}

	async sadd(key: string, ...members: string[]): Promise<number> {
		try {
			return await this.redis.sadd(key, ...members)
		} catch (error) {
			this.logger.error(`Error adding to set ${key}: ${error.message}`)
			return 0
		}
	}

	async srem(key: string, ...members: string[]): Promise<number> {
		try {
			return await this.redis.srem(key, ...members)
		} catch (error) {
			this.logger.error(`Error removing from set ${key}: ${error.message}`)
			return 0
		}
	}

	async smembers(key: string): Promise<string[]> {
		try {
			return await this.redis.smembers(key)
		} catch (error) {
			this.logger.error(`Error getting members of set ${key}: ${error.message}`)
			return []
		}
	}

	async zadd(key: string, score: number, member: string): Promise<number> {
		try {
			return await this.redis.zadd(key, score, member)
		} catch (error) {
			this.logger.error(`Error adding to sorted set ${key}: ${error.message}`)
			return 0
		}
	}

	async zrange(key: string, start: number, stop: number): Promise<string[]> {
		try {
			return await this.redis.zrange(key, start, stop)
		} catch (error) {
			this.logger.error(
				`Error getting range from sorted set ${key}: ${error.message}`
			)
			return []
		}
	}

	async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
		try {
			return await this.redis.zrevrange(key, start, stop)
		} catch (error) {
			this.logger.error(
				`Error getting reverse range from sorted set ${key}: ${error.message}`
			)
			return []
		}
	}

	async exists(key: string): Promise<number> {
		try {
			return await this.redis.exists(key)
		} catch (error) {
			this.logger.error(
				`Error checking existence of key ${key}: ${error.message}`
			)
			return 0
		}
	}

	async publish(channel: string, message: string): Promise<number> {
		try {
			return await this.redis.publish(channel, message)
		} catch (error) {
			this.logger.error(
				`Error publishing to channel ${channel}: ${error.message}`
			)
			return 0
		}
	}

	async pipeline(): Promise<ReturnType<typeof this.redis.pipeline>> {
		return this.redis.pipeline()
	}

	async info(): Promise<string> {
		try {
			return await this.redis.info()
		} catch (error) {
			this.logger.error(`Error getting Redis info: ${error.message}`)
			return ''
		}
	}
}
