import { IoAdapter } from '@nestjs/platform-socket.io'
import { ServerOptions, Socket } from 'socket.io'
import { INestApplicationContext } from '@nestjs/common'
import { Logger } from '@nestjs/common'

interface ShardingOptions {
	instanceId: number
	totalInstances: number
	userShardResolver: (userId: string) => number
}

export class AppAdapter extends IoAdapter {
	private readonly logger = new Logger('AppAdapter')
	private readonly shardingOptions?: ShardingOptions

	constructor(app: INestApplicationContext, shardingOptions?: ShardingOptions) {
		super(app)
		this.shardingOptions = shardingOptions

		if (shardingOptions) {
			this.logger.log(
				`WebSocket adapter initialized with sharding: instance ${shardingOptions.instanceId} of ${shardingOptions.totalInstances}`
			)
		}
	}

	createIOServer(port: number, options?: ServerOptions): any {
		const server = super.createIOServer(port, {
			...options,
			cors: {
				origin: '*',
				methods: ['GET', 'POST'],
				credentials: true,
			},
			transports: ['websocket', 'polling'],
			pingInterval: 25000, // 25 секунд
			pingTimeout: 10000, // 10 секунд
			connectTimeout: 10000, // 10 секунд
			maxHttpBufferSize: 1e6, // 1 MB
			// Включаем адаптеры для редис только если инстансов больше 1
			...(this.shardingOptions && this.shardingOptions.totalInstances > 1
				? this.createRedisAdapters()
				: {}),
		})

		// Если включено шардирование
		// Если включено шардирование
		// Если включено шардирование
		if (this.shardingOptions) {
			// Добавляем middleware для проверки, должен ли этот инстанс обрабатывать подключение
			server.use((socket: Socket, next: (err?: Error) => void) => {
				try {
					// Получаем telegramId из query параметров
					const telegramId = socket.handshake.query.telegramId as string

					if (!telegramId) {
						// Если telegramId не указан, принимаем подключение
						return next()
					}

					// Сохраняем ссылку на shardingOptions в локальную переменную
					// и используем утверждение типа TypeScript (as), чтобы указать, что он точно определен
					const shardOptions = this.shardingOptions as ShardingOptions

					// Теперь TypeScript знает, что shardOptions - это определенно ShardingOptions (не undefined)
					const targetInstance = shardOptions.userShardResolver(telegramId)

					// Теперь это тоже будет работать без ошибок
					if (targetInstance !== shardOptions.instanceId) {
						this.logger.debug(
							`Connection from user ${telegramId} rejected - belongs to instance ${targetInstance}`
						)
						return next(
							new Error(`Please connect to instance ${targetInstance}`)
						)
					}

					// Иначе принимаем подключение
					this.logger.debug(`Accepted connection from user ${telegramId}`)
					next()
				} catch (err) {
					this.logger.error(`Error in sharding middleware: ${err.message}`)
					next(err)
				}
			})
		}

		return server
	}

	private createRedisAdapters() {
		try {
			// Динамический импорт для избежания проблем с зависимостями
			const { createAdapter } = require('@socket.io/redis-adapter')
			const Redis = require('ioredis')

			// Создаем подключения к Redis для адаптера
			const pubClient = new Redis({
				host: process.env.REDIS_HOST || 'localhost',
				port: parseInt(process.env.REDIS_PORT || '6379'),
				password: process.env.REDIS_PASSWORD || '',
			})

			const subClient = pubClient.duplicate()

			return {
				adapter: createAdapter(pubClient, subClient, {
					// Префикс для разделения разных окружений
					prefix: process.env.REDIS_PREFIX || 'ws-adapter:',
					// Опции для Redis Pub/Sub
					requestsTimeout: 5000,
				}),
			}
		} catch (error) {
			this.logger.error(`Failed to create Redis adapter: ${error.message}`)
			return {}
		}
	}
}
