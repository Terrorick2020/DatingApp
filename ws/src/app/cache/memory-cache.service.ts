import { Injectable, OnModuleInit, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as NodeCache from 'node-cache'

@Injectable()
export class MemoryCacheService implements OnModuleInit {
	private readonly logger = new Logger(MemoryCacheService.name)
	private cache: NodeCache

	constructor(private readonly configService: ConfigService) {}

	onModuleInit() {
		// Настройка TTL по умолчанию и опций проверки в секундах
		const stdTTL = this.configService.get<number>('CACHE_TTL', 300) // 5 минут
		const checkperiod = this.configService.get<number>(
			'CACHE_CHECK_PERIOD',
			600
		) // 10 минут

		this.cache = new NodeCache({
			stdTTL,
			checkperiod,
			useClones: false, // Не клонировать объекты для улучшения производительности
			deleteOnExpire: true,
		})

		this.logger.log(`Memory cache initialized with TTL: ${stdTTL}s`)

		// Настройка лимита для избежания утечек памяти
		const maxKeys = this.configService.get<number>('CACHE_MAX_KEYS', 10000)

		// Слушаем события кеша
		this.cache.on('set', (key, value) => {
			const keysCount = this.cache.keys().length

			if (keysCount > maxKeys) {
				this.logger.warn(`Cache key limit approached: ${keysCount}/${maxKeys}`)
				// Удаляем 10% самых старых ключей, если превышен лимит
				if (keysCount >= maxKeys) {
					this.pruneOldestEntries(Math.floor(maxKeys * 0.1))
				}
			}
		})
	}

	/**
	 * Получение значения из кеша
	 */
	get<T>(key: string): T | undefined {
		return this.cache.get<T>(key)
	}

	/**
	 * Установка значения в кеш
	 * @param key Ключ
	 * @param value Значение
	 * @param ttl Время жизни в секундах (опционально)
	 */
	set<T>(key: string, value: T, ttl?: number): boolean {
		// Исправляем проблему с undefined ttl с помощью явной проверки
		if (ttl !== undefined) {
			return this.cache.set(key, value, ttl)
		}
		return this.cache.set(key, value)
	}

	/**
	 * Проверка существования ключа
	 */
	has(key: string): boolean {
		return this.cache.has(key)
	}

	/**
	 * Удаление ключа из кеша
	 */
	delete(key: string): boolean {
		return this.cache.del(key) > 0
	}

	/**
	 * Получение нескольких значений
	 */
	getMultiple<T>(keys: string[]): Record<string, T> {
		return this.cache.mget<T>(keys)
	}

	/**
	 * Очистка всего кеша
	 */
	clear(): void {
		this.cache.flushAll()
	}

	/**
	 * Получение всех ключей
	 */
	keys(): string[] {
		return this.cache.keys()
	}

	/**
	 * Получение количества ключей
	 */
	size(): number {
		return this.cache.keys().length
	}

	/**
	 * Удаление самых старых записей из кеша
	 */
	private pruneOldestEntries(count: number): void {
		const keys = this.cache.keys()
		const keysInfo = keys.map(key => {
			const ttl = this.cache.getTtl(key)
			return { key, ttl: ttl || Infinity } // Если ttl undefined, используем Infinity
		})

		// Сортируем по TTL (меньше TTL - скорее всего, более старая запись)
		keysInfo.sort((a, b) => a.ttl - b.ttl)

		// Удаляем самые старые записи
		const keysToDelete = keysInfo.slice(0, count).map(ki => ki.key)
		this.logger.debug(`Pruning ${keysToDelete.length} oldest cache entries`)
		this.cache.del(keysToDelete)
	}
}
