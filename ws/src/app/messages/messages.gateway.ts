import { MsgsSendMsgDto } from '@/app/messages/dto/send-msg.dto'
import { MsgsUpdateIntrlocDto } from '@/app/messages/dto/update-interlocator.dto'
import { MsgsUpdateMsgDto } from '@/app/messages/dto/update-msg.dto'
import {
	MsgsClientMethods,
	MsgsServerMethods,
	type MsgsClientToServerEvents,
	type MsgsServerToClientEvents,
} from '@/types/messages.types'
import { Injectable } from '@nestjs/common'
import {
	MessageBody,
	SubscribeMessage,
	WebSocketGateway,
} from '@nestjs/websockets'
import { BaseWsGateway } from '~/src/abstract/abstract.gateway'
import { MemoryCacheService } from '../cache/memory-cache.service'
import { RedisService } from '../redis/redis.service'
import { MessagesService } from './messages.service'

@WebSocketGateway({
	namespace: 'messages',
	cors: {
		origin: '*',
	},
})
@Injectable()
export class MessagesGateway extends BaseWsGateway<
	MessagesService,
	MsgsClientToServerEvents,
	MsgsServerToClientEvents
> {
	constructor(
		private readonly messagesService: MessagesService,
		protected readonly cacheService: MemoryCacheService,
		private readonly redisService: RedisService
	) {
		super(messagesService, cacheService)
	}

	@SubscribeMessage(MsgsServerMethods.UpdateInterlocutor)
	async handleUpdateInterlocutor(
		@MessageBody() msgsUpdateIntrlocDto: MsgsUpdateIntrlocDto
	): Promise<void> {
		try {
			this.logger.debug(
				`Processing UpdateInterlocutor: ${JSON.stringify(msgsUpdateIntrlocDto)}`
			)

			// Быстрая проверка кеша перед вызовом сервиса
			const cacheKey = `interlocutor:${msgsUpdateIntrlocDto.telegramId}:${msgsUpdateIntrlocDto.roomName}`
			const cachedData = this.cacheService.get(cacheKey)

			if (cachedData) {
				// Если данные в кеше, отправляем их напрямую
				this.sendToUser(
					msgsUpdateIntrlocDto.roomName,
					MsgsClientMethods.UpdateInterData,
					cachedData
				)

				// Асинхронно обновляем кеш через сервис
				this.messagesService
					.updateInterlocutor(msgsUpdateIntrlocDto)
					.then(response => {
						// Обновляем кеш только при успешном ответе
						if (response && response.status !== 'error') {
							this.cacheService.set(cacheKey, response, 30) // TTL: 30 секунд
						}
					})
					.catch(err =>
						this.logger.error(`Failed to update interlocutor: ${err.message}`)
					)
			} else {
				// Если кеша нет, вызываем сервис и ждем ответа
				const response = await this.messagesService.updateInterlocutor(
					msgsUpdateIntrlocDto
				)

				this.sendToUser(
					msgsUpdateIntrlocDto.roomName,
					MsgsClientMethods.UpdateInterData,
					response
				)

				// Кешируем успешный ответ
				if (response && response.status !== 'error') {
					this.cacheService.set(cacheKey, response, 30) // TTL: 30 секунд
				}
			}
		} catch (error) {
			this.logger.error(
				`Error in handleUpdateInterlocutor: ${error.message}`,
				error.stack
			)

			this.sendToUser(
				msgsUpdateIntrlocDto.roomName,
				MsgsClientMethods.UpdateInterData,
				{
					message: 'Ошибка при обновлении статуса собеседника',
					status: 'error',
				}
			)
		}
	}

	@SubscribeMessage(MsgsServerMethods.UpdateMsg)
	async handleUpdateMsg(
		@MessageBody() msgsSendMsgDto: MsgsSendMsgDto
	): Promise<void> {
		try {
			this.logger.debug(
				`Processing UpdateMsg: ${JSON.stringify(msgsSendMsgDto)}`
			)

			const response = await this.messagesService.updateMsg(msgsSendMsgDto)

			this.sendToUser(
				msgsSendMsgDto.roomName,
				MsgsClientMethods.UpdateMsgData,
				response
			)

			// Если обновление успешно, публикуем событие в Redis для оповещения всех серверов
			if (response && response.chatId) {
				const recipientId = response.toUser

				// Публикуем событие для получателя сообщения
				this.redisService.redis.publish(
					'chat:updateMsg',
					JSON.stringify({
						chatId: response.chatId,
						messageId: response.msgId,
						fromUser: msgsSendMsgDto.telegramId,
						toUser: recipientId,
						type: 'update',
					})
				)
			}
		} catch (error) {
			this.logger.error(
				`Error in handleUpdateMsg: ${error.message}`,
				error.stack
			)

			this.sendToUser(
				msgsSendMsgDto.roomName,
				MsgsClientMethods.UpdateMsgData,
				{
					message: 'Ошибка при обновлении сообщения',
					status: 'error',
				}
			)
		}
	}

	@SubscribeMessage(MsgsServerMethods.SendMsg)
	async handleSendMsg(
		@MessageBody() msgsUpdateMsgDto: MsgsUpdateMsgDto
	): Promise<void> {
		try {
			this.logger.debug(
				`Processing SendMsg: ${JSON.stringify(msgsUpdateMsgDto)}`
			)
			const response = await this.messagesService.sendMsg(msgsUpdateMsgDto)

			// Отправляем подтверждение отправителю
			this.sendToUser(
				msgsUpdateMsgDto.roomName,
				MsgsClientMethods.SendMsgData,
				response
			)

			// Если сообщение успешно отправлено, публикуем событие в Redis
			if (response && response.chatId) {
				const recipientId = response.toUser

				// Публикуем событие для получателя сообщения
				this.redisService.redis.publish(
					'chat:newMessage',
					JSON.stringify({
						chatId: response.chatId,
						messageId: response.msgId,
						fromUser: msgsUpdateMsgDto.telegramId,
						toUser: recipientId,
						text: msgsUpdateMsgDto.newMsg,
						timestamp: response.createdAt,
					})
				)
			}
		} catch (error) {
			this.logger.error(`Error in handleSendMsg: ${error.message}`, error.stack)

			this.sendToUser(
				msgsUpdateMsgDto.roomName,
				MsgsClientMethods.SendMsgData,
				{
					message: 'Ошибка при отправке сообщения',
					status: 'error',
				}
			)
		}
	}

	// Метод для прямого уведомления пользователя о новом сообщении
	async sendDirectMessageNotification(
		userId: string,
		messageData: any
	): Promise<void> {
		try {
			// Если пользователь онлайн (имеет активные сокеты)
			if (this.isUserOnline(userId)) {
				this.sendToUser(userId, 'newMessage', messageData)

				this.logger.debug(`Sent direct message notification to user ${userId}`)
			} else {
				this.logger.debug(`User ${userId} is offline, not sending notification`)
			}
		} catch (error) {
			this.logger.error(
				`Error sending direct message notification: ${error.message}`,
				error.stack
			)
		}
	}

	// Получение статуса набора текста (typing)
	@SubscribeMessage('getTypingStatus')
	async getTypingStatus(
		@MessageBody() data: { userId: string; chatId: string }
	): Promise<void> {
		try {
			const { userId, chatId } = data

			// Получаем данные из Redis напрямую для минимальной задержки
			const typingKey = `chat:${chatId}:typing`
			const typingUsers = await this.redisService.redis.smembers(typingKey)

			// Фильтруем, чтобы не отображать себя же в списке печатающих
			const otherTypingUsers = typingUsers.filter(id => id !== userId)

			// Отправляем статус
			this.sendToUser(userId, 'typingStatus', {
				chatId,
				typingUsers: otherTypingUsers,
			})
		} catch (error) {
			this.logger.error(
				`Error getting typing status: ${error.message}`,
				error.stack
			)
		}
	}

	// Установка статуса набора текста
	@SubscribeMessage('setTypingStatus')
	async setTypingStatus(
		@MessageBody() data: { userId: string; chatId: string; isTyping: boolean }
	): Promise<void> {
		try {
			const { userId, chatId, isTyping } = data

			// Ключ для хранения статусов печати в чате
			const typingKey = `chat:${chatId}:typing`

			if (isTyping) {
				// Добавляем пользователя в список печатающих
				await this.redisService.redis.sadd(typingKey, userId)
				// Устанавливаем TTL для автоматического удаления через 10 секунд
				await this.redisService.redis.expire(typingKey, 10)
			} else {
				// Удаляем пользователя из списка
				await this.redisService.redis.srem(typingKey, userId)
			}
			const chatKey = `chat:${chatId}`
			const chatData = await this.redisService.redis.get(chatKey)

			if (chatData) {
				try {
					const chat = JSON.parse(chatData)

					// Находим пользователей чата
					if (chat.participants && Array.isArray(chat.participants)) {
						// Получаем собеседника
						const otherUsers = chat.participants.filter(id => id !== userId)

						// Публикуем изменение статуса через Redis Pub/Sub
						for (const otherUser of otherUsers) {
							// Проверяем, онлайн ли собеседник
							if (this.isUserOnline(otherUser)) {
								// Отправляем напрямую через WebSocket
								this.sendToUser(otherUser, 'typingStatus', {
									chatId,
									userId,
									isTyping,
								})
							}
						}
					}
				} catch (error) {
					this.logger.error(`Error parsing chat data: ${error.message}`)
				}
			}
		} catch (error) {
			this.logger.error(
				`Error setting typing status: ${error.message}`,
				error.stack
			)
		}
	}
}
