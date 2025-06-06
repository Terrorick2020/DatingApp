import {
	ClientProxy,
	ClientProxyFactory,
	Transport,
	TcpClientOptions,
} from '@nestjs/microservices'
import { firstValueFrom } from 'rxjs' // Добавляем импорт firstValueFrom
import { ServerMethods } from '@/types/base.types'
import { ConnectionStatus } from '@/types/base.types'
import { ConfigService } from '@nestjs/config'
import { ConnectionDto } from './dto/connection.dto'
import { ResConnectionDto } from './dto/response.dto'
import { Logger } from '@nestjs/common'

export abstract class BaseWsService {
	protected readonly logger = new Logger(this.constructor.name)
	protected readonly clientProxy: ClientProxy
	protected readonly errRes: ResConnectionDto
	protected readonly configService: ConfigService

	// Количество повторных попыток
	private readonly MAX_RETRIES = 3
	// Базовая задержка (мс) между попытками
	private readonly BASE_RETRY_DELAY = 100

	constructor(configService: ConfigService) {
		const host = configService.get<string>('API_TCP_HOST', 'localhost')
		const port: number = Number(
			configService.get<string>('API_TCP_PORT', '7755')
		)

		// Исправление: корректное создание клиента TCP
		this.clientProxy = ClientProxyFactory.create({
			transport: Transport.TCP,
			options: {
				host,
				port,
				retryAttempts: this.MAX_RETRIES,
				retryDelay: this.BASE_RETRY_DELAY,
			},
		} as TcpClientOptions)

		this.configService = configService

		this.errRes = {
			telegramId: '',
			roomName: '',
			message: 'При выполнении возникла ошибка!',
			status: ConnectionStatus.Error,
		}
	}

	/**
	 * Отправка запроса в API с повторными попытками и экспоненциальной задержкой
	 */
	protected async sendRequest<TPattern, TRequest, TResponse>(
		pattern: TPattern,
		data: TRequest,
		retryCount: number = 0
	): Promise<TResponse | ResConnectionDto> {
		try {
			// Устанавливаем таймаут для запроса
			const timeout = this.configService.get<number>(
				'API_REQUEST_TIMEOUT',
				5000
			)

			// Исправление: использование firstValueFrom вместо toPromise
			const responsePromise = firstValueFrom(
				this.clientProxy.send<TResponse, TRequest>(pattern, data)
			)

			// Обработка таймаута
			const timeoutPromise = new Promise<ResConnectionDto>((_, reject) =>
				setTimeout(() => reject(new Error('API request timeout')), timeout)
			)

			// Ожидаем первый выполненный Promise
			const response = (await Promise.race([
				responsePromise,
				timeoutPromise,
			])) as TResponse | ResConnectionDto
			return response
		} catch (error) {
			// Если еще можно повторить запрос и это не таймаут
			if (retryCount < this.MAX_RETRIES) {
				// Экспоненциальная задержка
				const delay = this.BASE_RETRY_DELAY * Math.pow(2, retryCount)

				this.logger.warn(
					`Повторная попытка запроса к API (${retryCount + 1}/${
						this.MAX_RETRIES
					}) после задержки ${delay}мс...`
				)

				await new Promise(resolve => setTimeout(resolve, delay))

				// Повторяем запрос с увеличенным счетчиком
				return this.sendRequest<TPattern, TRequest, TResponse>(
					pattern,
					data,
					retryCount + 1
				)
			}

			this.logger.error(
				`Не удалось отправить запрос к API после ${this.MAX_RETRIES} попыток: ${error.message}`
			)

			return {
				...this.errRes,
				message: `Ошибка при запросе к API: ${error.message}`,
			}
		}
	}

	/**
	 * Отправка запроса подключения к комнате (логика перенесена в реализацию)
	 */
	abstract joinRoom(connectionDto: ConnectionDto): Promise<ResConnectionDto>

	/**
	 * Отправка запроса отключения от комнаты (логика перенесена в реализацию)
	 */
	abstract leaveRoom(connectionDto: ConnectionDto): Promise<ResConnectionDto>

	/**
	 * Обновление статуса пользователя на оффлайн
	 */
	abstract updateUserOfflineStatus(userId: string): Promise<void>
}
