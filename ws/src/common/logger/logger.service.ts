import { Injectable, LoggerService } from '@nestjs/common'
import { createLogger, format, transports, Logger } from 'winston'
import * as os from 'os'

@Injectable()
export class AppLogger implements LoggerService {
	private logger: Logger
	private readonly instanceId: string

	constructor() {
		// Генерируем уникальный ID для инстанса
		this.instanceId = `${os.hostname()}-${process.pid}-${Math.random()
			.toString(36)
			.slice(2, 7)}`

		const { combine, timestamp, printf, colorize, errors, json } = format

		// Формат для разработки (человекочитаемый)
		const developmentFormat = combine(
			colorize({ all: true }),
			timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
			errors({ stack: true }),
			printf(({ level, message, timestamp, context, instanceId, ...rest }) => {
				let logMessage = `${timestamp} [${level}]`

				if (instanceId) {
					logMessage += ` [${instanceId}]`
				}

				if (context) {
					logMessage += ` [${context}]`
				}

				logMessage += `: ${message}`

				// Добавляем метаданные, если они есть
				if (Object.keys(rest).length > 0) {
					// Фильтруем большие объекты и ошибки для более чистого вывода
					const cleanedData = Object.entries(rest).reduce(
						(acc, [key, value]) => {
							if (key === 'stack' || key === 'error') return acc
							if (typeof value === 'object' && value !== null) {
								// Ограничиваем размер объектов в логах
								acc[key] = '[Object]'
							} else {
								acc[key] = value
							}
							return acc
						},
						{}
					)

					logMessage += ` ${JSON.stringify(cleanedData)}`
				}

				return logMessage
			})
		)

		// Формат для продакшн (структурированный JSON для систем логирования)
		const productionFormat = combine(
			timestamp(),
			errors({ stack: true }),
			json()
		)

		// Транспорты для логов
		const logTransports = [
			// Консольный транспорт
			new transports.Console({
				level: process.env.LOG_LEVEL || 'debug',
				format:
					process.env.NODE_ENV === 'production'
						? productionFormat
						: developmentFormat,
			}),
		]

		// Добавляем файловый транспорт, если настроен
		if (process.env.LOG_FILE_PATH) {
			logTransports.push(
				new transports.File({
					filename: process.env.LOG_FILE_PATH,
					level: process.env.LOG_FILE_LEVEL || 'info',
					format: productionFormat,
					maxsize: 10 * 1024 * 1024, // 10 МБ
					maxFiles: 5,
				})
			)
		}

		// Создаем логгер
		this.logger = createLogger({
			levels: {
				error: 0,
				warn: 1,
				info: 2,
				http: 3,
				verbose: 4,
				debug: 5,
				silly: 6,
			},
			level: process.env.LOG_LEVEL || 'debug',
			defaultMeta: {
				instanceId: this.instanceId,
				service: 'websocket-service',
			},
			transports: logTransports,
		})
	}

	log(message: string, context?: string, ...args: any[]) {
		this.logger.info(message, { context, ...this.extractMetadata(args) })
	}

	error(message: string, trace?: string, context?: string, ...args: any[]) {
		this.logger.error(message, {
			context,
			trace,
			...this.extractMetadata(args),
		})
	}

	warn(message: string, context?: string, ...args: any[]) {
		this.logger.warn(message, { context, ...this.extractMetadata(args) })
	}

	debug(message: string, context?: string, ...args: any[]) {
		this.logger.debug(message, { context, ...this.extractMetadata(args) })
	}

	verbose(message: string, context?: string, ...args: any[]) {
		this.logger.verbose(message, { context, ...this.extractMetadata(args) })
	}

	// Извлечение метаданных из аргументов
	private extractMetadata(args: any[]): object {
		if (args.length === 0) return {}

		// Если передан объект в качестве первого аргумента, используем его
		if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
			return args[0]
		}

		// Если передано несколько аргументов, преобразуем их в объект
		return { args }
	}

	// Методы для логирования HTTP-запросов
	logHttpRequest(
		method: string,
		url: string,
		statusCode?: number,
		responseTime?: number
	) {
		this.logger.http(
			`${method} ${url} ${statusCode || '-'} ${responseTime || '-'}ms`,
			{
				method,
				url,
				statusCode,
				responseTime,
			}
		)
	}

	// Метод для логирования WebSocket-событий
	logWsEvent(
		eventName: string,
		userId?: string,
		roomName?: string,
		data?: any
	) {
		this.logger.debug(`WebSocket event: ${eventName}`, {
			context: 'WebSocket',
			eventName,
			userId,
			roomName,
			data: typeof data === 'object' ? '[Object]' : data,
		})
	}

	// Метод для логирования метрик
	logMetrics(metrics: Record<string, number>) {
		this.logger.info('System metrics', {
			context: 'Metrics',
			...metrics,
		})
	}
}
