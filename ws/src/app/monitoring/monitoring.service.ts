import { Injectable, OnModuleInit } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import { ChatGateway } from '../chats/chat.gateway'
import { MessagesGateway } from '../messages/messages.gateway'
import { LikeGateway } from '../like/like.gateway'
import { ComplaintGateway } from '../complaint/complaint.gateway'
import { MatchGateway } from '../match/match.gateway'
import { RedisService } from '../redis/redis.service'
import { AppLogger } from '../../common/logger/logger.service'
import * as os from 'os'

@Injectable()
export class MonitoringService implements OnModuleInit {
	constructor(
		private readonly schedulerRegistry: SchedulerRegistry,
		private readonly chatGateway: ChatGateway,
		private readonly messagesGateway: MessagesGateway,
		private readonly likeGateway: LikeGateway,
		private readonly complaintGateway: ComplaintGateway,
		private readonly matchGateway: MatchGateway,
		private readonly redisService: RedisService,
		private readonly logger: AppLogger
	) {}

	onModuleInit() {
		// Запускаем сбор метрик каждую минуту
		const interval = setInterval(() => this.collectMetrics(), 60000)
		this.schedulerRegistry.addInterval('metrics-collector', interval)

		this.logger.log('Metrics collection started', 'MonitoringService')
	}

	private async collectMetrics() {
		try {
			// Собираем метрики от gateway
			const chatMetrics = this.chatGateway.getMetrics()
			const messagesMetrics = this.messagesGateway.getMetrics()
			const likeMetrics = this.likeGateway.getMetrics()
			const complaintMetrics = this.complaintGateway.getMetrics()
			const matchMetrics = this.matchGateway.getMetrics()

			// Собираем системные метрики
			const systemMetrics = {
				memory: {
					total: os.totalmem(),
					free: os.freemem(),
					used: os.totalmem() - os.freemem(),
					usedPercent: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
				},
				cpu: os.loadavg(),
				uptime: process.uptime(),
			}

			// Получаем метрики Redis
			const redisInfo = await this.redisService.redis.info()

			// Парсим информацию Redis
			const redisMetrics = this.parseRedisInfo(redisInfo)

			// Комбинируем все метрики
			const metrics = {
				timestamp: Date.now(),
				instance: {
					hostname: os.hostname(),
					pid: process.pid,
				},
				connections: {
					total:
						chatMetrics.connections +
						messagesMetrics.connections +
						likeMetrics.connections +
						complaintMetrics.connections +
						matchMetrics.connections,
					byGateway: {
						chat: chatMetrics.connections,
						messages: messagesMetrics.connections,
						like: likeMetrics.connections,
						complaint: complaintMetrics.connections,
						match: matchMetrics.connections,
					},
				},
				users: {
					total:
						chatMetrics.users +
						messagesMetrics.users +
						likeMetrics.users +
						complaintMetrics.users +
						matchMetrics.users,
					byGateway: {
						chat: chatMetrics.users,
						messages: messagesMetrics.users,
						like: likeMetrics.users,
						complaint: complaintMetrics.users,
						match: matchMetrics.users,
					},
				},
				rooms: {
					total:
						chatMetrics.rooms +
						messagesMetrics.rooms +
						likeMetrics.rooms +
						complaintMetrics.rooms +
						matchMetrics.rooms,
					byGateway: {
						chat: chatMetrics.rooms,
						messages: messagesMetrics.rooms,
						like: likeMetrics.rooms,
						complaint: complaintMetrics.rooms,
						match: matchMetrics.rooms,
					},
				},
				system: systemMetrics,
				redis: redisMetrics,
			}

			// Логируем метрики
			this.logger.logMetrics({
				'connections.total': metrics.connections.total,
				'users.total': metrics.users.total,
				'rooms.total': metrics.rooms.total,
				'memory.usedPercent': systemMetrics.memory.usedPercent,
				'cpu.load': systemMetrics.cpu[0],
				'uptime': systemMetrics.uptime
			  });

			// Публикуем метрики в Redis для агрегации
			await this.redisService.redis.publish(
				'system:metrics',
				JSON.stringify(metrics)
			)

			// Сохраняем некоторые метрики в Redis для мониторинга
			await this.redisService.redis.hset(
				`metrics:${os.hostname()}:${process.pid}`,
				'timestamp',
				Date.now().toString(),
				'connections',
				metrics.connections.total.toString(),
				'users',
				metrics.users.total.toString(),
				'memory_used_percent',
				systemMetrics.memory.usedPercent.toFixed(2),
				'uptime',
				process.uptime().toString()
			)

			// Устанавливаем TTL для метрик (10 минут)
			await this.redisService.redis.expire(
				`metrics:${os.hostname()}:${process.pid}`,
				600
			)
		} catch (error) {
			this.logger.error(
				`Error collecting metrics: ${error.message}`,
				error.stack,
				'MonitoringService'
			)
		}
	}

	// Парсинг информации из Redis
	private parseRedisInfo(info: string): object {
		const result = {}

		if (!info) return result

		// Разбиваем на секции
		const sections = info.split('#')

		for (const section of sections) {
			const lines = section.split('\n').filter(line => line.includes(':'))

			for (const line of lines) {
				const [key, value] = line.split(':')
				if (key && value) {
					const trimmedKey = key.trim()
					const trimmedValue = value.trim()

					// Преобразуем числовые значения
					const numValue = parseFloat(trimmedValue)
					result[trimmedKey] = isNaN(numValue) ? trimmedValue : numValue
				}
			}
		}

		return result
	}
}
