import {
	LikeClientMethods,
	LikeServerMethods,
	type LikeClientToServerEvents,
	type LikeServerToClientEvents,
} from '@/types/like.types'
import { Injectable } from '@nestjs/common'
import { EventPattern, Payload } from '@nestjs/microservices'
import {
	MessageBody,
	SubscribeMessage,
	WebSocketGateway,
} from '@nestjs/websockets'
import { BaseWsGateway } from '~/src/abstract/abstract.gateway'
import { MemoryCacheService } from '../cache/memory-cache.service'
import { LikeTriggerDto } from './dto/trigger.dto'
import { LikeService } from './like.service'

@WebSocketGateway({
	namespace: 'likes',
	cors: {
		origin: '*',
	},
})
@Injectable()
export class LikeGateway extends BaseWsGateway<
	LikeService,
	LikeClientToServerEvents,
	LikeServerToClientEvents
> {
	constructor(
		private readonly likeService: LikeService,
		protected readonly cacheService: MemoryCacheService
	) {
		super(likeService, cacheService)
	}

	@EventPattern(LikeServerMethods.Trigger)
	async handleLikeTrigger(
		@Payload() triggerDto: LikeTriggerDto
	): Promise<void> {
		this.logger.debug(
			`Обработка уведомления о лайке для ${triggerDto.telegramId}`
		)
		this.server
			.to(triggerDto.roomName)
			.emit(LikeClientMethods.TriggerData, triggerDto)
	}

	/**
	 * Метод для отправки уведомления о новом лайке пользователю
	 */
	async notifyUserAboutLike(userId: string, likeData: any): Promise<void> {
		try {
			// Проверяем, онлайн ли пользователь
			if (this.isUserOnline(userId)) {
				// Отправляем уведомление пользователю через его личную комнату
				// this.sendToUser(userId, 'newLike', likeData)
				this.sendToRoom(userId, 'newLike', likeData);
				this.logger.debug(
					`Отправлено уведомление о лайке пользователю ${userId}`
				)
			} else {
				this.logger.debug(
					`Пользователь ${userId} оффлайн, уведомление о лайке не отправлено`
				)
			}
		} catch (error) {
			this.logger.error(
				`Ошибка при отправке уведомления о лайке пользователю ${userId}: ${error.message}`,
				error.stack
			)
		}
	}

	/**
	 * Обработчик запроса на получение лайков пользователя
	 */
	@SubscribeMessage('getUserLikes')
	async handleGetUserLikes(
		@MessageBody()
		data: {
			userId: string
			type: 'sent' | 'received' | 'matches'
		}
	): Promise<void> {
		try {
			this.logger.debug(
				`Получение лайков пользователя ${data.userId} типа ${data.type}`
			)

			// Пробуем получить из кэша
			const cacheKey = `user:${data.userId}:likes:${data.type}`
			const cachedLikes = this.cacheService.get(cacheKey)

			if (cachedLikes) {
				// Если данные в кэше, отправляем их
				this.sendToUser(data.userId, 'userLikes', {
					type: data.type,
					likes: cachedLikes,
				})
			} else {
				// Если в кэше нет, запрашиваем через API
				const likes = await this.likeService.getUserLikes(
					data.userId,
					data.type
				)

				// Отправляем результат
				this.sendToUser(data.userId, 'userLikes', {
					type: data.type,
					likes,
				})

				// Кэшируем результат на 1 минуту (если это не пустой массив)
				if (likes && likes.length > 0) {
					this.cacheService.set(cacheKey, likes, 60)
				}
			}
		} catch (error) {
			this.logger.error(
				`Ошибка при получении лайков: ${error.message}`,
				error.stack
			)
			this.sendToUser(data.userId, 'likesError', {
				message: 'Ошибка при получении лайков',
				status: 'error',
			})
		}
	}
}
