import {
	MatchClientMethods,
	MatchServerMethods,
	type MatchClientToServerEvents,
	type MatchServerToClientEvents,
} from '@/types/match.type'
import { Injectable } from '@nestjs/common'
import { EventPattern, Payload } from '@nestjs/microservices'
import {
	MessageBody,
	SubscribeMessage,
	WebSocketGateway,
} from '@nestjs/websockets'
import { BaseWsGateway } from '~/src/abstract/abstract.gateway'
import { MemoryCacheService } from '../cache/memory-cache.service'
import { RedisService } from '../redis/redis.service'
import { GetUserMatchesDto } from './dto/match.dto'
import { MatchTriggerDto } from './dto/trigger.dto'
import {
	MatchesResponse,
	MatchService,
	MatchServiceResponse,
} from './match.service'

@WebSocketGateway({
	namespace: 'matches',
	cors: {
		origin: '*',
	},
})
@Injectable()
export class MatchGateway extends BaseWsGateway<
	MatchService,
	MatchClientToServerEvents,
	MatchServerToClientEvents
> {
	constructor(
		private readonly matchService: MatchService,
		protected readonly cacheService: MemoryCacheService,
		private readonly redisService: RedisService
	) {
		super(matchService, cacheService)
	}

	@EventPattern(MatchServerMethods.Trigger)
	async handleMatchTrigger(
		@Payload() triggerDto: MatchTriggerDto
	): Promise<void> {
		try {
			this.logger.debug(
				`Обработка уведомления о матче для ${triggerDto.telegramId}`
			)

			// Отправляем уведомление через WebSocket
			this.server
				.to(triggerDto.roomName)
				.emit(MatchClientMethods.TriggerData, triggerDto)

			// Инвалидируем кэш матчей пользователя
			this.cacheService.delete(`user:${triggerDto.telegramId}:matches`)

			// Публикуем событие в Redis для других частей приложения
			await this.redisService.publish(
				'match:new',
				JSON.stringify({
					userId: triggerDto.telegramId,
					matchedUserId: triggerDto.fromUser.id,
					timestamp: Date.now(),
				})
			)
		} catch (error) {
			this.logger.error(
				`Ошибка при обработке уведомления о матче: ${error.message}`,
				error.stack
			)
		}
	}

	/**
	 * Метод для отправки уведомления о новом матче пользователю
	 */
	async notifyUserAboutMatch(userId: string, matchData: any): Promise<void> {
		try {
			// Проверяем, онлайн ли пользователь
			if (this.isUserOnline(userId)) {
				// Отправляем уведомление пользователю через его личную комнату
				// this.sendToUser(userId, 'newMatch', matchData)

				this.sendToRoom(userId, 'newMatch', matchData)
				this.logger.debug(
					`Отправлено уведомление о матче пользователю ${userId}`
				)

				// Инвалидируем кэш матчей пользователя
				this.cacheService.delete(`user:${userId}:matches`)
			} else {
				this.logger.debug(
					`Пользователь ${userId} оффлайн, уведомление о матче не отправлено`
				)
			}
		} catch (error) {
			this.logger.error(
				`Ошибка при отправке уведомления о матче пользователю ${userId}: ${error.message}`,
				error.stack
			)
		}
	}

	/**
	 * Проверка, является ли ответ успешным списком матчей
	 */
	private isMatchesResponse(response: any): response is MatchesResponse {
		return (
			response &&
			Array.isArray(response.matches) &&
			typeof response.count === 'number'
		)
	}

	/**
	 * Проверка, является ли ответ ошибкой
	 */
	private isErrorResponse(response: any): response is MatchServiceResponse {
		return response && (response.status === 'error' || response.message)
	}

	/**
	 * Обработчик запроса на получение всех матчей пользователя
	 */
	@SubscribeMessage('getUserMatches')
	async handleGetUserMatches(
		@MessageBody() data: GetUserMatchesDto
	): Promise<void> {
		try {
			this.logger.debug(`Получение матчей пользователя ${data.telegramId}`)

			// Проверяем кэш
			const cacheKey = `user:${data.telegramId}:matches`
			const cachedMatches = this.cacheService.get(cacheKey)

			if (cachedMatches) {
				// Если данные в кэше, отправляем их
				this.sendToUser(data.telegramId, 'userMatches', cachedMatches)
			} else {
				// Если нет в кэше, запрашиваем через API
				const result = await this.matchService.getUserMatches(data.telegramId)

				// Проверяем, является ли результат успешным списком матчей
				if (this.isMatchesResponse(result)) {
					// Результат содержит список матчей
					this.sendToUser(data.telegramId, 'userMatches', result)

					// Кэшируем результат на 2 минуты
					if (result.matches && result.matches.length > 0) {
						this.cacheService.set(cacheKey, result, 120)
					}
				} else if (this.isErrorResponse(result)) {
					// Результат содержит ошибку
					this.sendToUser(data.telegramId, 'matchesError', {
						message: result.message || 'Ошибка при получении матчей',
						status: result.status || 'error',
					})
				} else {
					// Неизвестный результат
					this.sendToUser(data.telegramId, 'matchesError', {
						message: 'Неизвестная ошибка при получении матчей',
						status: 'error',
					})
				}
			}
		} catch (error) {
			this.logger.error(
				`Ошибка при получении матчей: ${error.message}`,
				error.stack
			)
			this.sendToUser(data.telegramId, 'matchesError', {
				message: 'Ошибка при получении матчей',
				status: 'error',
			})
		}
	}

	/**
	 * Обработка запроса на удаление матча
	 */
	@SubscribeMessage('removeMatch')
	async handleRemoveMatch(
		@MessageBody() data: { userId: string; matchId: string }
	): Promise<void> {
		try {
			this.logger.debug(
				`Удаление матча ${data.matchId} пользователем ${data.userId}`
			)

			// Удаляем матч через API
			const result = await this.matchService.removeMatch(
				data.userId,
				data.matchId
			)

			// Отправляем результат
			if (result.success) {
				this.sendToUser(data.userId, 'matchRemoved', { matchId: data.matchId })

				// Инвалидируем кэш матчей пользователя
				this.cacheService.delete(`user:${data.userId}:matches`)

				// Если есть информация о втором пользователе, инвалидируем его кэш тоже
				if (result.otherUserId) {
					this.cacheService.delete(`user:${result.otherUserId}:matches`)

					// Оповещаем второго пользователя, если он онлайн
					if (this.isUserOnline(result.otherUserId)) {
						this.sendToUser(result.otherUserId, 'matchRemoved', {
							matchId: data.matchId,
						})
					}
				}
			} else {
				this.sendToUser(data.userId, 'matchesError', {
					message: result.message || 'Ошибка при удалении матча',
					status: 'error',
				})
			}
		} catch (error) {
			this.logger.error(
				`Ошибка при удалении матча: ${error.message}`,
				error.stack
			)
			this.sendToUser(data.userId, 'matchesError', {
				message: 'Ошибка при удалении матча',
				status: 'error',
			})
		}
	}
}
