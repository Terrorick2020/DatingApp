// ws/src/app/chats/chat.gateway.ts
import { BaseWsConnectionDto } from '@/abstract/dto/connection.dto'
import type { ResErrData, ResServerConnection } from '@/types/base.types'
import { WsConnectionStatus } from '@/types/base.types'
import type {
	ChatsClientToServerEvents,
	ChatsServerToClientEvents,
} from '@/types/chat.types'
import { ChatsClientMethods, ChatsServerMethods } from '@/types/chat.types'
import { Injectable } from '@nestjs/common'
import { EventPattern, Payload } from '@nestjs/microservices'
import {
	MessageBody,
	SubscribeMessage,
	WebSocketGateway,
} from '@nestjs/websockets'
import { BaseWsGateway } from '~/src/abstract/abstract.gateway'
import { RedisService } from '../redis/redis.service'
import { ChatService } from './chat.service'
import { AddChatDto } from './dto/add-chat.dto'
import { DeleteChatDto } from './dto/delete-chat.dto'
import { UpdateChatDto } from './dto/update-chat.dto'

@WebSocketGateway(8080, {
	namespace: 'chats',
	cors: {
		origin: '*',
	},
})
@Injectable()
export class ChatGateway extends BaseWsGateway<
	ChatsClientToServerEvents,
	ChatsServerToClientEvents
> {
	constructor(
		private readonly chatService: ChatService,
		private readonly redisService: RedisService
	) {
		super()
	}

	protected async joinRoomService(
		connectionDto: BaseWsConnectionDto
	): Promise<ResServerConnection | ResErrData> {
		try {
			// Кешируем информацию о пользователе в Redis
			await this.redisService.set(
				`user:${connectionDto.telegramId}:status`,
				'online',
				3600
			)
			await this.redisService.set(
				`user:${connectionDto.telegramId}:room`,
				connectionDto.roomName,
				3600
			)

			// Логируем подключение пользователя
			console.log(
				`User ${connectionDto.telegramId} joined room ${connectionDto.roomName}`
			)

			return await this.chatService.joinRoom(connectionDto)
		} catch (error) {
			console.error('Error in joinRoomService:', error)
			return {
				message: 'Error joining room',
				status: WsConnectionStatus.Error,
			}
		}
	}

	protected async leaveRoomService(
		connectionDto: BaseWsConnectionDto
	): Promise<ResServerConnection | ResErrData> {
		try {
			// Обновляем статус пользователя в Redis
			await this.redisService.set(
				`user:${connectionDto.telegramId}:status`,
				'offline',
				3600
			)
			await this.redisService.del(`user:${connectionDto.telegramId}:room`)

			// Логируем отключение пользователя
			console.log(
				`User ${connectionDto.telegramId} left room ${connectionDto.roomName}`
			)

			return await this.chatService.leaveRoom(connectionDto)
		} catch (error) {
			console.error('Error in leaveRoomService:', error)
			return {
				message: 'Error leaving room',
				status: WsConnectionStatus.Error,
			}
		}
	}

	// Слушаем события от API сервиса по TCP
	@EventPattern(ChatsServerMethods.UpdatedChat)
	async handleUpdateChat(@Payload() updateDto: UpdateChatDto): Promise<void> {
		try {
			// Кешируем обновленную информацию о чате
			if (updateDto && updateDto.chatId) {
				await this.redisService.set(
					`chat:${updateDto.chatId}:lastUpdate`,
					Date.now().toString(),
					3600
				)

				if (updateDto.newLastMsgId) {
					await this.redisService.set(
						`chat:${updateDto.chatId}:lastMsgId`,
						updateDto.newLastMsgId,
						3600
					)
				}

				if (updateDto.newUnreadCount !== undefined) {
					await this.redisService.set(
						`chat:${updateDto.chatId}:unreadCount`,
						updateDto.newUnreadCount.toString(),
						3600
					)
				}
			}

			// Отправляем событие всем подключенным клиентам в комнате
			if (updateDto && updateDto.roomName) {
				this.server
					.to(updateDto.roomName)
					.emit(ChatsClientMethods.UpdateData, updateDto)
				console.log(
					`Chat ${updateDto.chatId} updated in room ${updateDto.roomName}`
				)
			}
		} catch (error) {
			console.error('Error handling chat update:', error)
		}
	}

	@EventPattern(ChatsServerMethods.AddChat)
	async handleAddChat(@Payload() addChatDto: AddChatDto): Promise<void> {
		try {
			// Кешируем информацию о новом чате
			if (addChatDto && addChatDto.chatId) {
				await this.redisService.set(
					`chat:${addChatDto.chatId}:createdAt`,
					addChatDto.created_at.toString(),
					3600
				)

				if (addChatDto.toUser && addChatDto.toUser.id) {
					await this.redisService.set(
						`chat:${addChatDto.chatId}:users`,
						JSON.stringify([addChatDto.telegramId, addChatDto.toUser.id]),
						3600
					)

					// Добавляем чат в список чатов пользователя
					await this.redisService.addToList(
						`user:${addChatDto.telegramId}:chats`,
						addChatDto.chatId
					)

					await this.redisService.addToList(
						`user:${addChatDto.toUser.id}:chats`,
						addChatDto.chatId
					)
				}
			}

			// Отправляем событие клиентам
			if (addChatDto && addChatDto.roomName) {
				this.server
					.to(addChatDto.roomName)
					.emit(ChatsClientMethods.AddData, addChatDto)
				console.log(
					`New chat ${addChatDto.chatId} created in room ${addChatDto.roomName}`
				)
			}
		} catch (error) {
			console.error('Error handling add chat:', error)
		}
	}

	@EventPattern(ChatsServerMethods.DeleteChat)
	async handleDeleteChat(
		@Payload() deleteChatDto: DeleteChatDto
	): Promise<void> {
		try {
			// Получаем пользователей из кеша перед удалением
			const usersStr = await this.redisService.get(
				`chat:${deleteChatDto.chatId}:users`
			)
			const users = usersStr ? JSON.parse(usersStr) : []

			// Очищаем кеш удаленного чата
			await this.redisService.del(`chat:${deleteChatDto.chatId}:createdAt`)
			await this.redisService.del(`chat:${deleteChatDto.chatId}:lastUpdate`)
			await this.redisService.del(`chat:${deleteChatDto.chatId}:lastMsgId`)
			await this.redisService.del(`chat:${deleteChatDto.chatId}:unreadCount`)
			await this.redisService.del(`chat:${deleteChatDto.chatId}:users`)

			// Удаляем чат из списка чатов пользователя
			for (const userId of users) {
				await this.redisService.removeFromList(
					`user:${userId}:chats`,
					deleteChatDto.chatId
				)
			}

			// Отправляем событие клиентам
			if (deleteChatDto && deleteChatDto.roomName) {
				this.server
					.to(deleteChatDto.roomName)
					.emit(ChatsClientMethods.DeleteData, deleteChatDto)
				console.log(
					`Chat ${deleteChatDto.chatId} deleted from room ${deleteChatDto.roomName}`
				)
			}
		} catch (error) {
			console.error('Error handling delete chat:', error)
		}
	}

	// Метод для получения чатов пользователя
	@SubscribeMessage('getChats')
	async getChats(
		@MessageBody() data: { userId: string; roomName: string }
	): Promise<void> {
		try {
			if (!data || !data.userId || !data.roomName) {
				console.error('Invalid data in getChats:', data)
				return
			}

			// Получаем список чатов из кеша или API
			const chats = await this.chatService.getUserChats(data.userId)

			// Отправляем список чатов клиенту
			this.server.to(data.roomName).emit(ChatsClientMethods.ChatsList, chats)
		} catch (error) {
			console.error('Error in getChats:', error)
			this.server.to(data.roomName).emit(ChatsClientMethods.ChatsError, {
				message: 'Failed to get chats',
				status: 'error',
			})
		}
	}

	// Обработка нового сообщения (от MessagesGateway)
	@EventPattern('newMessage')
	async handleNewMessage(@Payload() data: Record<string, any>): Promise<void> {
		try {
			if (!data || !data.chatId) {
				console.error('Invalid data in handleNewMessage:', data)
				return
			}

			const { chatId, messageId, text, senderId, timestamp } = data

			// Обновляем метаданные чата в Redis
			await this.redisService.hset(`chat:${chatId}`, 'lastMsgId', messageId)
			await this.redisService.hset(`chat:${chatId}`, 'lastMsgText', text)
			await this.redisService.hset(
				`chat:${chatId}`,
				'updatedAt',
				timestamp?.toString() || Date.now().toString()
			)

			// Получаем пользователей чата
			const usersStr = await this.redisService.get(`chat:${chatId}:users`)
			const users = usersStr ? JSON.parse(usersStr) : []

			for (const userId of users) {
				if (userId !== senderId) {
					// Получаем текущий счетчик непрочитанных
					const unreadCountStr = await this.redisService.hget(
						`chat:${chatId}`,
						'unreadCount'
					)
					const currentCount = unreadCountStr ? parseInt(unreadCountStr) : 0

					// Увеличиваем счетчик
					await this.redisService.hset(
						`chat:${chatId}`,
						'unreadCount',
						(currentCount + 1).toString()
					)

					// Отправляем обновление получателю
					const userRoom = await this.redisService.get(`user:${userId}:room`)
					if (userRoom) {
						const updateDto: UpdateChatDto = {
							roomName: userRoom,
							telegramId: userId,
							chatId,
							newLastMsgId: messageId,
							newUnreadCount: currentCount + 1,
						}

						this.server
							.to(userRoom)
							.emit(ChatsClientMethods.UpdateData, updateDto)
					}
				} else {
					// Отправляем обновление отправителю
					const senderRoom = await this.redisService.get(
						`user:${senderId}:room`
					)
					if (senderRoom) {
						const updateDto: UpdateChatDto = {
							roomName: senderRoom,
							telegramId: senderId,
							chatId,
							newLastMsgId: messageId,
							newUnreadCount: 0, // Для отправителя сообщения все прочитано
						}

						this.server
							.to(senderRoom)
							.emit(ChatsClientMethods.UpdateData, updateDto)
					}
				}
			}
		} catch (error) {
			console.error('Error handling new message:', error)
		}
	}

	// Обработка прочтения сообщения
	@EventPattern('messageRead')
	async handleMessageRead(@Payload() data: Record<string, any>): Promise<void> {
		try {
			if (!data || !data.chatId || !data.userId) {
				console.error('Invalid data in handleMessageRead:', data)
				return
			}

			const { chatId, userId } = data

			// Сбрасываем счетчик непрочитанных для этого пользователя
			await this.redisService.hset(`chat:${chatId}`, 'unreadCount', '0')

			// Отправляем обновление на клиент
			const userRoom = await this.redisService.get(`user:${userId}:room`)
			if (userRoom) {
				const updateDto: UpdateChatDto = {
					roomName: userRoom,
					telegramId: userId,
					chatId,
					newUnreadCount: 0,
				}

				this.server.to(userRoom).emit(ChatsClientMethods.UpdateData, updateDto)
			}
		} catch (error) {
			console.error('Error handling message read:', error)
		}
	}
}
