import { Injectable } from '@nestjs/common'
import { BaseWsService } from '@/abstract/abstract.service'
import { ConfigService } from '@nestjs/config'
import { RedisService } from '../redis/redis.service'
import { ConnectionDto } from '@/abstract/dto/connection.dto'
import { LikeTriggerDto } from './dto/trigger.dto'
import { SendMatchTcpPatterns } from '@/types/like.types'
import { ResConnectionDto } from '@/abstract/dto/response.dto'
import { Logger } from '@nestjs/common'

@Injectable()
export class LikeService extends BaseWsService {

	constructor(
		protected readonly configService: ConfigService,
		private readonly redisService: RedisService
	) {
		super(configService)
	}

	/**
	 * Получение лайков пользователя
	 */
	async getUserLikes(
		userId: string,
		type: 'sent' | 'received' | 'matches'
	): Promise<any[]> {
		try {
			this.logger.debug(`Получение лайков пользователя ${userId} типа ${type}`)

			// Используем API через TCP для получения лайков
			const response = await this.sendRequest('getUserLikes', { userId, type })

			// Проверяем, что ответ не содержит ошибку
			if (response && (response as any).status === 'error') {
				this.logger.warn(
					`Ошибка при получении лайков пользователя ${userId}: ${
						(response as any).message
					}`
				)
				return []
			}

			// Если ответ содержит успешный результат в формате ApiResponse
			if (response && (response as any).success && (response as any).data) {
				return (response as any).data
			}

			// Если ответ содержит данные как массив напрямую
			if (response && Array.isArray(response)) {
				return response
			}

			// Если ответ не содержит данные в ожидаемом формате
			return []
		} catch (error) {
			this.logger.error(
				`Ошибка при получении лайков пользователя ${userId}: ${error.message}`,
				error.stack
			)
			return []
		}
	}

	/**
	 * Отправка уведомления о лайке
	 */
	async sendLikeTrigger(triggerDto: LikeTriggerDto): Promise<void> {
		try {
			this.logger.debug(
				`Отправка уведомления о лайке для ${triggerDto.telegramId} от ${triggerDto.fromUser.id}`
			)

			// Отправляем запрос через TCP
			await this.sendRequest(SendMatchTcpPatterns.Trigger, triggerDto)

			// Публикуем событие через Redis для межсервисной коммуникации
			await this.redisService.publish(
				'like:new',
				JSON.stringify({
					fromUserId: triggerDto.fromUser.id,
					toUserId: triggerDto.telegramId,
					timestamp: Date.now(),
				})
			)
		} catch (error) {
			this.logger.error(
				`Ошибка при отправке уведомления о лайке: ${error.message}`,
				error.stack
			)
		}
	}

	/**
	 * Создание нового лайка
	 */
	async createLike(fromUserId: string, toUserId: string): Promise<any> {
		try {
			this.logger.debug(`Создание лайка от ${fromUserId} к ${toUserId}`)

			// Отправляем запрос на создание лайка через TCP
			const response = await this.sendRequest('createLike', {
				fromUserId,
				toUserId,
			})

			// Проверяем успешность операции
			if (response && (response as any).status === 'error') {
				return {
					success: false,
					message: (response as any).message || 'Ошибка при создании лайка',
				}
			}

			// Если лайк привел к взаимному матчу
			if (
				response &&
				(response as any).data &&
				(response as any).data.isMatch
			) {
				// Публикуем событие о новом матче через Redis
				await this.redisService.publish(
					'match:new',
					JSON.stringify({
						user1Id: fromUserId,
						user2Id: toUserId,
						timestamp: Date.now(),
						chatId: (response as any).data.chatId,
					})
				)

				return {
					success: true,
					isMatch: true,
					chatId: (response as any).data.chatId,
				}
			}

			return {
				success: true,
				isMatch: false,
			}
		} catch (error) {
			this.logger.error(
				`Ошибка при создании лайка: ${error.message}`,
				error.stack
			)
			return {
				success: false,
				message: `Ошибка при создании лайка: ${error.message}`,
			}
		}
	}

	/**
	 * Удаление лайка
	 */
	async deleteLike(fromUserId: string, toUserId: string): Promise<any> {
		try {
			this.logger.debug(`Удаление лайка от ${fromUserId} к ${toUserId}`)

			// Отправляем запрос на удаление лайка через TCP
			const response = await this.sendRequest('deleteLike', {
				fromUserId,
				toUserId,
			})

			// Проверяем успешность операции
			if (response && (response as any).status === 'error') {
				return {
					success: false,
					message: (response as any).message || 'Ошибка при удалении лайка',
				}
			}

			return { success: true }
		} catch (error) {
			this.logger.error(
				`Ошибка при удалении лайка: ${error.message}`,
				error.stack
			)
			return {
				success: false,
				message: `Ошибка при удалении лайка: ${error.message}`,
			}
		}
	}

	/**
	 * Обработка подключения к комнате
	 */
	async joinRoom(connectionDto: ConnectionDto): Promise<ResConnectionDto> {
		try {
			this.logger.debug(
				`Пользователь ${connectionDto.telegramId} подключается к комнате ${connectionDto.roomName}`
			)

			// Обновляем статус пользователя
			const userStatusKey = `user:${connectionDto.telegramId}:status`
			await this.redisService.set(userStatusKey, 'online', 3600)

			// Сохраняем комнату пользователя
			const userRoomKey = `user:${connectionDto.telegramId}:room`
			await this.redisService.set(userRoomKey, connectionDto.roomName, 3600)

			return {
				roomName: connectionDto.roomName,
				telegramId: connectionDto.telegramId,
				status: 'success',
			}
		} catch (error) {
			this.logger.error(
				`Ошибка при подключении к комнате: ${error.message}`,
				error.stack
			)
			return {
				roomName: connectionDto.roomName,
				telegramId: connectionDto.telegramId,
				message: `Ошибка при подключении к комнате: ${error.message}`,
				status: 'error',
			}
		}
	}

	/**
	 * Обработка отключения от комнаты
	 */
	async leaveRoom(connectionDto: ConnectionDto): Promise<ResConnectionDto> {
		try {
			this.logger.debug(
				`Пользователь ${connectionDto.telegramId} покидает комнату ${connectionDto.roomName}`
			)

			// Если пользователь покидает свою личную комнату, обновляем статус на оффлайн
			if (connectionDto.roomName === connectionDto.telegramId) {
				await this.updateUserOfflineStatus(connectionDto.telegramId)
			}

			return {
				roomName: connectionDto.roomName,
				telegramId: connectionDto.telegramId,
				status: 'success',
			}
		} catch (error) {
			this.logger.error(
				`Ошибка при отключении от комнаты: ${error.message}`,
				error.stack
			)
			return {
				roomName: connectionDto.roomName,
				telegramId: connectionDto.telegramId,
				message: `Ошибка при отключении от комнаты: ${error.message}`,
				status: 'error',
			}
		}
	}

	/**
	 * Обновление статуса пользователя на оффлайн
	 */
	async updateUserOfflineStatus(userId: string): Promise<void> {
		try {
			// Обновляем статус в Redis
			const userStatusKey = `user:${userId}:status`
			await this.redisService.set(userStatusKey, 'offline', 86400)

			// Удаляем привязку к комнате
			const userRoomKey = `user:${userId}:room`
			await this.redisService.del(userRoomKey)

			// Публикуем событие об изменении статуса пользователя
			await this.redisService.publish(
				'user:status',
				JSON.stringify({
					userId,
					status: 'offline',
					timestamp: Date.now(),
				})
			)
		} catch (error) {
			this.logger.error(
				`Ошибка при обновлении статуса пользователя ${userId} на оффлайн: ${error.message}`,
				error.stack
			)
		}
	}
}
