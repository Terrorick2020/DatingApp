import { Injectable } from '@nestjs/common'
import { BaseWsService } from '@/abstract/abstract.service'
import { ConfigService } from '@nestjs/config'
import { RedisService } from '../redis/redis.service'
import { ConnectionDto } from '@/abstract/dto/connection.dto'
import { ResConnectionDto } from '@/abstract/dto/response.dto'
import { ConnectionStatus } from '@/types/base.types'
import { Logger } from '@nestjs/common'
import { MatchTriggerDto } from './dto/trigger.dto'
import { MatchServerMethods } from '@/types/match.type'

// Определим интерфейсы для типизации результатов API
export interface MatchItem {
	userId: string
	matchUserId: string
	matchUserName?: string
	matchUserAvatar?: string
	createdAt?: number
	seen?: boolean
	chatId?: string 
}

// Интерфейс для ответа со списком матчей
export interface MatchesResponse {
	matches: MatchItem[]
	count: number
	success?: boolean
	error?: string
	message?: string
	status?: string
}

// Интерфейс для ответа при создании/удалении матча
export interface MatchActionResponse {
	success: boolean
	isMatch?: boolean
	chatId?: string
	message?: string
	status?: string
	otherUserId?: string
}

// Интерфейс для уведомления о матче
export interface MatchNotificationResponse {
	message?: string
	status?: string
	alreadySent?: boolean
}

// Базовый интерфейс для всех ответов от сервиса матчей
export interface MatchServiceResponse {
	message?: string
	status?: string
	[key: string]: any
}

@Injectable()
export class MatchService extends BaseWsService {
	// Изменяем модификатор доступа с private на protected
	protected readonly logger = new Logger(MatchService.name)
	private readonly MATCH_NOTIFICATION_TTL = 86400 // 24 часа в секундах

	constructor(
		protected readonly configService: ConfigService,
		private readonly redisService: RedisService
	) {
		super(configService)
	}

	/**
	 * Отправка уведомления о матче пользователю
	 */
	async sendMatchTrigger(triggerDto: MatchTriggerDto): Promise<any> {
		try {
			this.logger.debug(
				`Отправка уведомления о матче пользователю ${triggerDto.telegramId} от ${triggerDto.fromUser.id}`,
				'MatchService'
			)

			// Проверяем, не было ли уже отправлено такое уведомление
			const notificationKey = `match:notification:${triggerDto.telegramId}:${triggerDto.fromUser.id}`
			const existingNotification = await this.redisService.redis.exists(
				notificationKey
			)

			if (existingNotification) {
				this.logger.debug(
					`Уведомление о матче уже было отправлено ранее`,
					'MatchService'
				)
				return {
					message: 'Уведомление уже было отправлено',
					alreadySent: true,
				}
			}

			// Отправляем уведомление через TCP запрос
			const response: { message?: string; status?: string } =
				await this.sendRequest(MatchServerMethods.Trigger, triggerDto)

			// Сохраняем информацию об отправке уведомления
			if (response && (!response.message || response.status !== 'error')) {
				await this.redisService.redis.set(
					notificationKey,
					'sent',
					'EX',
					this.MATCH_NOTIFICATION_TTL
				)

				// Сохраняем данные о матче в Redis для использования в других частях приложения
				const matchKey = `match:${triggerDto.telegramId}:${triggerDto.fromUser.id}`
				await this.redisService.redis.hmset(
					matchKey,
					'userId',
					triggerDto.telegramId,
					'matchUserId',
					triggerDto.fromUser.id,
					'matchUserName',
					triggerDto.fromUser.name,
					'matchUserAvatar',
					triggerDto.fromUser.avatar,
					'createdAt',
					Date.now().toString(),
					'seen',
					'false'
				)

				// Установка TTL для данных о матче
				await this.redisService.redis.expire(
					matchKey,
					this.MATCH_NOTIFICATION_TTL
				)

				// Также публикуем событие в Redis для других сервисов
				this.redisService.redis.publish(
					'match:new',
					JSON.stringify({
						userId: triggerDto.telegramId,
						matchUserId: triggerDto.fromUser.id,
						timestamp: Date.now(),
					})
				)
			}

			return response
		} catch (error) {
			this.logger.error(
				`Ошибка при отправке уведомления о матче: ${error.message}`,
				error.stack
			)
			return {
				message: `Ошибка при отправке уведомления о матче: ${error.message}`,
				status: 'error',
			}
		}
	}

	/**
	 * Подтверждение просмотра уведомления о матче
	 */
	async confirmMatchNotification(
		userId: string,
		matchUserId: string
	): Promise<any> {
		try {
			this.logger.debug(
				`Подтверждение просмотра уведомления о матче пользователем ${userId} с ${matchUserId}`,
				'MatchService'
			)

			// Обновляем статус просмотра
			const matchKey = `match:${userId}:${matchUserId}`
			const exists = await this.redisService.redis.exists(matchKey)

			if (!exists) {
				return {
					message: 'Уведомление о матче не найдено',
					status: 'error',
				}
			}

			await this.redisService.redis.hset(matchKey, 'seen', 'true')

			return {
				message: 'Уведомление о матче отмечено как просмотренное',
				status: 'success',
			}
		} catch (error) {
			this.logger.error(
				`Ошибка при подтверждении просмотра уведомления о матче: ${error.message}`,
				error.stack
			)
			return {
				message: `Ошибка при подтверждении просмотра: ${error.message}`,
				status: 'error',
			}
		}
	}

	/**
	 * Получение непросмотренных уведомлений о матчах для пользователя
	 */
	async getUnseenMatches(userId: string): Promise<any> {
		try {
			this.logger.debug(
				`Получение непросмотренных уведомлений о матчах для пользователя ${userId}`,
				'MatchService'
			)

			// Получаем все ключи матчей для данного пользователя
			const matchKeys = await this.redisService.redis.keys(`match:${userId}:*`)

			if (!matchKeys || matchKeys.length === 0) {
				return {
					matches: [],
					count: 0,
				}
			}

			// Явно определяем тип массива
			interface MatchData {
				userId: string
				matchUserId: string
				matchUserName: string
				matchUserAvatar: string
				createdAt: number
			}

			const unseenMatches: MatchData[] = []

			// Проверяем каждый матч
			for (const key of matchKeys) {
				const matchData = await this.redisService.redis.hgetall(key)

				if (matchData && matchData.seen === 'false') {
					unseenMatches.push({
						userId: matchData.userId,
						matchUserId: matchData.matchUserId,
						matchUserName: matchData.matchUserName,
						matchUserAvatar: matchData.matchUserAvatar,
						createdAt: parseInt(matchData.createdAt) || 0,
					})
				}
			}

			// Сортируем по времени создания (новые первыми)
			unseenMatches.sort((a, b) => b.createdAt - a.createdAt)

			return {
				matches: unseenMatches,
				count: unseenMatches.length,
			}
		} catch (error) {
			this.logger.error(
				`Ошибка при получении непросмотренных уведомлений о матчах: ${error.message}`,
				error.stack
			)
			return {
				matches: [],
				count: 0,
				error: `Произошла ошибка: ${error.message}`,
			}
		}
	}

	/**
	 * Получение всех матчей пользователя
	 */
	async getUserMatches(userId: string): Promise<MatchesResponse> {
		try {
			this.logger.debug(
				`Получение всех матчей для пользователя ${userId}`,
				'MatchService'
			)

			// Получаем все ключи матчей для данного пользователя
			const matchKeys = await this.redisService.redis.keys(`match:${userId}:*`)

			if (!matchKeys || matchKeys.length === 0) {
				// Если в Redis нет данных, запрашиваем через API
				const response: MatchesResponse = await this.sendRequest(
					'getUserMatches',
					{ userId }
				)

				// Если получены данные от API, кэшируем их в Redis
				if (response && response.matches && Array.isArray(response.matches)) {
					// Кэшируем каждый матч
					for (const match of response.matches) {
						const matchKey = `match:${userId}:${match.matchUserId}`
						await this.redisService.redis.hmset(
							matchKey,
							'userId',
							userId,
							'matchUserId',
							match.matchUserId,
							'matchUserName',
							match.matchUserName || '',
							'matchUserAvatar',
							match.matchUserAvatar || '',
							'createdAt',
							match.createdAt?.toString() || Date.now().toString(),
							'seen',
							match.seen?.toString() || 'true'
						)

						// Установка TTL для данных о матче
						await this.redisService.redis.expire(
							matchKey,
							this.MATCH_NOTIFICATION_TTL
						)
					}
				}

				return response || { matches: [], count: 0 }
			}

			// Явно определяем тип массива
			const matches: MatchItem[] = []

			// Получаем данные по каждому матчу
			for (const key of matchKeys) {
				const matchData = await this.redisService.redis.hgetall(key)

				if (matchData) {
					matches.push({
						userId: matchData.userId,
						matchUserId: matchData.matchUserId,
						matchUserName: matchData.matchUserName,
						matchUserAvatar: matchData.matchUserAvatar,
						createdAt: parseInt(matchData.createdAt) || 0,
						seen: matchData.seen === 'true',
					})
				}
			}

			// Сортируем по времени создания (новые первыми)
			matches.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

			return {
				matches,
				count: matches.length,
			}
		} catch (error) {
			this.logger.error(
				`Ошибка при получении всех матчей: ${error.message}`,
				error.stack
			)
			return {
				matches: [],
				count: 0,
				error: `Произошла ошибка: ${error.message}`,
			}
		}
	}

	/**
	 * Удаление матча
	 */
	async removeMatch(userId: string, matchUserId: string): Promise<any> {
		try {
			this.logger.debug(
				`Удаление матча между пользователями ${userId} и ${matchUserId}`,
				'MatchService'
			)

			// Проверяем существование матча
			const matchKey = `match:${userId}:${matchUserId}`
			const exists = await this.redisService.redis.exists(matchKey)

			if (!exists) {
				return {
					message: 'Матч не найден',
					status: 'error',
				}
			}

			// Удаляем матч из Redis
			await this.redisService.redis.del(matchKey)

			// Удаляем запись о нотификации
			const notificationKey = `match:notification:${userId}:${matchUserId}`
			await this.redisService.redis.del(notificationKey)

			// Отправляем запрос к API для синхронизации (если это необходимо)
			try {
				await this.sendRequest('removeMatch', { userId, matchUserId })
			} catch (apiError) {
				this.logger.warn(
					`Не удалось синхронизировать удаление матча с API: ${apiError.message}`,
					'MatchService'
				)
				// Продолжаем выполнение, так как локальное удаление уже выполнено
			}

			return {
				message: 'Матч успешно удален',
				status: 'success',
			}
		} catch (error) {
			this.logger.error(
				`Ошибка при удалении матча: ${error.message}`,
				error.stack
			)
			return {
				message: `Ошибка при удалении матча: ${error.message}`,
				status: 'error',
			}
		}
	}

	/**
	 * Обработка подключения к комнате для WebSocket
	 */
	async joinRoom(connectionDto: ConnectionDto): Promise<ResConnectionDto> {
		try {
			this.logger.debug(
				`WS: Пользователь ${connectionDto.telegramId} присоединяется к комнате ${connectionDto.roomName}`,
				'MatchService'
			)

			// Обновляем статус пользователя в Redis
			await this.redisService.redis.set(
				`user:${connectionDto.telegramId}:status`,
				'online',
				'EX',
				3600
			)

			// Сохраняем комнату пользователя
			await this.redisService.redis.set(
				`user:${connectionDto.telegramId}:room`,
				connectionDto.roomName,
				'EX',
				3600
			)

			return {
				roomName: connectionDto.roomName,
				telegramId: connectionDto.telegramId,
				status: ConnectionStatus.Success,
			}
		} catch (error) {
			this.logger.error(
				`Ошибка при подключении к комнате: ${error.message}`,
				error.stack
			)
			return {
				roomName: connectionDto.roomName,
				telegramId: connectionDto.telegramId,
				message: 'Ошибка при подключении к комнате',
				status: ConnectionStatus.Error,
			}
		}
	}

	/**
	 * Обработка отключения от комнаты для WebSocket
	 */
	async leaveRoom(connectionDto: ConnectionDto): Promise<ResConnectionDto> {
		try {
			this.logger.debug(
				`WS: Пользователь ${connectionDto.telegramId} покидает комнату ${connectionDto.roomName}`,
				'MatchService'
			)

			// Если пользователь покидает свою личную комнату, обновляем статус на офлайн
			if (connectionDto.roomName === connectionDto.telegramId) {
				await this.updateUserOfflineStatus(connectionDto.telegramId)
			}

			return {
				roomName: connectionDto.roomName,
				telegramId: connectionDto.telegramId,
				status: ConnectionStatus.Success,
			}
		} catch (error) {
			this.logger.error(
				`Ошибка при отключении от комнаты: ${error.message}`,
				error.stack
			)
			return {
				roomName: connectionDto.roomName,
				telegramId: connectionDto.telegramId,
				message: 'Ошибка при отключении от комнаты',
				status: ConnectionStatus.Error,
			}
		}
	}

	/**
	 * Обновление статуса пользователя на оффлайн
	 */
	async updateUserOfflineStatus(userId: string): Promise<void> {
		try {
			this.logger.debug(
				`Обновление статуса пользователя ${userId} на оффлайн`,
				'MatchService'
			)

			// Обновляем статус в Redis
			await this.redisService.redis.set(
				`user:${userId}:status`,
				'offline',
				'EX',
				86400
			)

			// Удаляем привязку к комнате
			await this.redisService.redis.del(`user:${userId}:room`)
		} catch (error) {
			this.logger.error(
				`Ошибка при обновлении статуса пользователя на оффлайн: ${error.message}`,
				error.stack
			)
		}
	}
}
