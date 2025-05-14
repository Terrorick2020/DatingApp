import { Injectable } from '@nestjs/common'
import { BaseWsService } from '@/abstract/abstract.service'
import { ConfigService } from '@nestjs/config'
import { RedisService } from '../redis/redis.service'
import { UpdateChatDto } from './dto/update-chat.dto'
import { AddChatDto } from './dto/add-chat.dto'
import { ChatsServerMethods } from '@/types/chat.types'
import { ConnectionDto } from '@/abstract/dto/connection.dto'
import { ResConnectionDto } from '@/abstract/dto/response.dto'
import { Logger } from '@nestjs/common'

@Injectable()
export class ChatService extends BaseWsService {
	constructor(
		configService: ConfigService,
		private readonly redisService: RedisService
	) {
		super(configService)
	}

	// Метод для отправки запроса на обновление чата
	async updateChat(updateDto: UpdateChatDto): Promise<any> {
		try {
			// Проверяем, существует ли чат
			const chatKey = `chat:${updateDto.chatId}`
			const chatData = await this.redisService.redis.get(chatKey)

			if (!chatData) {
				return {
					message: 'Чат не найден',
					status: 'error',
				}
			}

			// Парсим данные чата
			const chat = JSON.parse(chatData)

			// Обновляем данные чата
			let updated = false

			if (updateDto.newLastMsgId) {
				chat.last_message_id = updateDto.newLastMsgId
				updated = true
			}

			if (updateDto.newWriteStat) {
				// Обновляем статус набора текста в Redis
				const typingKey = `chat:${updateDto.chatId}:typing`

				if (updateDto.newWriteStat === 'Write') {
					// Добавляем пользователя в список печатающих
					await this.redisService.redis.sadd(typingKey, updateDto.telegramId)
					// Устанавливаем TTL для автоматического удаления через 10 секунд
					await this.redisService.redis.expire(typingKey, 10)
				} else {
					// Удаляем пользователя из списка печатающих
					await this.redisService.redis.srem(typingKey, updateDto.telegramId)
				}
			}

			if (updated) {
				// Сохраняем обновленные данные
				await this.redisService.redis.set(
					chatKey,
					JSON.stringify(chat),
					'EX',
					86400
				)
			}

			// Если у нас есть обновление счетчика непрочитанных сообщений
			if (updateDto.newUnreadCount !== undefined) {
				// Обновляем счетчик непрочитанных сообщений
				await this.redisService.redis.hset(
					`chat:${updateDto.chatId}`,
					'unreadCount',
					updateDto.newUnreadCount.toString()
				)
			}

			// Отправляем запрос в API через TCP (асинхронно)
			this.sendRequest(ChatsServerMethods.UpdatedChat, updateDto).catch(err =>
				this.logger.error(
					`Error notifying API about chat update: ${err.message}`
				)
			)

			return updateDto
		} catch (error) {
			this.logger.error(`Error updating chat: ${error.message}`, error.stack)
			return {
				message: `Ошибка при обновлении чата: ${error.message}`,
				status: 'error',
			}
		}
	}

	// Метод для отправки запроса на создание чата
	async addChat(addChatDto: AddChatDto): Promise<any> {
		try {
			// Проверяем, не существует ли уже чат
			const chatKey = `chat:${addChatDto.chatId}`
			const existingChat = await this.redisService.redis.exists(chatKey)

			if (existingChat) {
				// Если чат уже существует, просто возвращаем данные
				return addChatDto
			}

			// Создаем новый чат
			const timestamp = addChatDto.created_at || Date.now()

			// Метаданные чата
			const chat = {
				id: addChatDto.chatId,
				participants: [addChatDto.telegramId, addChatDto.toUser.id],
				created_at: timestamp,
				last_message_id: null,
				typing: [],
			}

			// Статус прочтения
			const readStatus = {
				[addChatDto.telegramId]: null,
				[addChatDto.toUser.id]: null,
			}

			// Транзакционно сохраняем данные
			const pipeline = this.redisService.redis.pipeline()

			// Сохраняем метаданные чата
			pipeline.set(chatKey, JSON.stringify(chat), 'EX', 86400)

			// Сохраняем статус прочтения
			pipeline.set(
				`chat:${addChatDto.chatId}:read_status`,
				JSON.stringify(readStatus),
				'EX',
				86400
			)

			// Сохраняем чат в списке чатов пользователя
			const user1ChatsKey = `user:${addChatDto.telegramId}:chats`
			const user2ChatsKey = `user:${addChatDto.toUser.id}:chats`

			// Получаем текущие списки чатов
			const [user1Chats, user2Chats] = await Promise.all([
				this.redisService.redis.get(user1ChatsKey),
				this.redisService.redis.get(user2ChatsKey),
			])

			// Обновляем списки чатов
			const user1ChatsList = user1Chats ? JSON.parse(user1Chats) : []
			const user2ChatsList = user2Chats ? JSON.parse(user2Chats) : []

			if (!user1ChatsList.includes(addChatDto.chatId)) {
				user1ChatsList.push(addChatDto.chatId)
				pipeline.set(user1ChatsKey, JSON.stringify(user1ChatsList), 'EX', 86400)
			}

			if (!user2ChatsList.includes(addChatDto.chatId)) {
				user2ChatsList.push(addChatDto.chatId)
				pipeline.set(user2ChatsKey, JSON.stringify(user2ChatsList), 'EX', 86400)
			}

			// Инвалидируем кеш превью
			pipeline.del(`user:${addChatDto.telegramId}:chats_preview`)
			pipeline.del(`user:${addChatDto.toUser.id}:chats_preview`)

			// Выполняем транзакцию
			await pipeline.exec()

			// Отправляем запрос в API через TCP (асинхронно)
			this.sendRequest(ChatsServerMethods.AddChat, addChatDto).catch(err =>
				this.logger.error(`Error notifying API about new chat: ${err.message}`)
			)

			return addChatDto
		} catch (error) {
			this.logger.error(`Error adding chat: ${error.message}`, error.stack)
			return {
				message: `Ошибка при создании чата: ${error.message}`,
				status: 'error',
			}
		}
	}

	// Получение списка чатов пользователя из Redis
	async getUserChats(userId: string): Promise<any[]> {
		try {
			// Проверяем кеш превью
			const previewKey = `user:${userId}:chats_preview`
			const cachedPreviews = await this.redisService.redis.get(previewKey)

			if (cachedPreviews) {
				return JSON.parse(cachedPreviews)
			}

			// Получаем список ID чатов пользователя
			const userChatsKey = `user:${userId}:chats`
			const userChats = await this.redisService.redis.get(userChatsKey)

			if (!userChats) {
				return []
			}

			const chatIds = JSON.parse(userChats)

			if (!Array.isArray(chatIds) || chatIds.length === 0) {
				return []
			}

			// Собираем данные о чатах
			const chatPreviews = []

			for (const chatId of chatIds) {
				const chatKey = `chat:${chatId}`
				const chatData = await this.redisService.redis.get(chatKey)

				if (chatData) {
					try {
						const chat = JSON.parse(chatData)

						// Находим собеседника
						const partnerId = chat.participants?.find(id => id !== userId)

						if (partnerId) {
							// Получаем данные о пользователе из Redis (если есть кеш)
							const userDataKey = `user:${partnerId}:profile`
							const userData = await this.redisService.redis.get(userDataKey)

							let interlocutor = {
								id: partnerId,
								avatar: '',
								name: 'Unknown',
							}

							if (userData) {
								try {
									const userProfile = JSON.parse(userData)
									interlocutor = {
										id: partnerId,
										avatar: userProfile.avatar || '',
										name: userProfile.name || 'Unknown',
									}
								} catch (e) {
									this.logger.error(`Error parsing user profile: ${e.message}`)
								}
							}

							// Получаем данные о последнем сообщении
							let lastMessage = ''
							if (chat.last_message_id) {
								const msgKey = `chat:${chatId}:messages`
								const msgData = await this.redisService.redis.hget(
									msgKey,
									chat.last_message_id
								)

								if (msgData) {
									try {
										const message = JSON.parse(msgData)
										lastMessage = message.text || ''
									} catch (e) {
										this.logger.error(`Error parsing message: ${e.message}`)
									}
								}
							}

							// Получаем количество непрочитанных сообщений
							let unreadCount = 0
							const unreadCountData = await this.redisService.redis.hget(
								`chat:${chatId}`,
								'unreadCount'
							)
							if (unreadCountData) {
								unreadCount = parseInt(unreadCountData) || 0
							}

							// Добавляем превью чата
							chatPreviews.push({
								chatId,
								toUser: interlocutor,
								lastMsg: lastMessage,
								created_at: chat.created_at || 0,
								unread_count: unreadCount,
							})
						}
					} catch (e) {
						this.logger.error(`Error processing chat ${chatId}: ${e.message}`)
					}
				}
			}

			// Сортируем по времени создания (от новых к старым)
			chatPreviews.sort((a, b) => b.created_at - a.created_at)

			// Кешируем результат на 15 минут
			await this.redisService.redis.set(
				previewKey,
				JSON.stringify(chatPreviews),
				'EX',
				900
			)
			return chatPreviews
		} catch (error) {
			this.logger.error(
				`Error getting user chats: ${error.message}`,
				error.stack
			)
			return []
		}
	}

	// Получение данных о чате
	async getChatDetails(chatId: string): Promise<any | null> {
		try {
			// Получаем метаданные чата
			const chatKey = `chat:${chatId}`
			const chatData = await this.redisService.redis.get(chatKey)

			if (!chatData) {
				return null
			}

			// Парсим данные чата
			const chat = JSON.parse(chatData)

			// Получаем статус прочтения
			const readStatusKey = `chat:${chatId}:read_status`
			const readStatusData = await this.redisService.redis.get(readStatusKey)
			let readStatus = {}

			if (readStatusData) {
				try {
					readStatus = JSON.parse(readStatusData)
				} catch (e) {
					this.logger.error(`Error parsing read status: ${e.message}`)
				}
			}

			// Получаем последнее сообщение (если есть)
			let lastMessage = null
			if (chat.last_message_id) {
				const messagesKey = `chat:${chatId}:messages`
				const messageData = await this.redisService.redis.hget(
					messagesKey,
					chat.last_message_id
				)

				if (messageData) {
					try {
						lastMessage = JSON.parse(messageData)
					} catch (e) {
						this.logger.error(`Error parsing last message: ${e.message}`)
					}
				}
			}

			// Формируем полные данные о чате
			return {
				id: chatId,
				metadata: chat,
				readStatus,
				lastMessage,
			}
		} catch (error) {
			this.logger.error(
				`Error getting chat details: ${error.message}`,
				error.stack
			)
			return null
		}
	}

	/**
	 * Обработка подключения к комнате
	 */
	async joinRoom(connectionDto: ConnectionDto): Promise<ResConnectionDto> {
		try {
			// Получаем статус пользователя и обновляем его
			const userStatusKey = `user:${connectionDto.telegramId}:status`
			await this.redisService.redis.set(userStatusKey, 'online', 'EX', 3600)

			// Сохраняем комнату пользователя
			const userRoomKey = `user:${connectionDto.telegramId}:room`
			await this.redisService.redis.set(
				userRoomKey,
				connectionDto.roomName,
				'EX',
				3600
			)

			// Получаем чаты пользователя
			const userChatsKey = `user:${connectionDto.telegramId}:chats`
			const userChats = await this.redisService.redis.get(userChatsKey)

			if (userChats) {
				const chatIds = JSON.parse(userChats)
				const notifyUsers = new Set<string>()

				// Находим всех пользователей, которым нужно отправить обновление
				for (const chatId of chatIds) {
					const chatKey = `chat:${chatId}`
					const chatData = await this.redisService.redis.get(chatKey)

					if (chatData) {
						try {
							const chat = JSON.parse(chatData)

							if (chat.participants && Array.isArray(chat.participants)) {
								// Добавляем собеседников в список для оповещения
								for (const participant of chat.participants) {
									if (participant !== connectionDto.telegramId) {
										notifyUsers.add(participant)
									}
								}
							}
						} catch (error) {
							this.logger.error(`Error parsing chat data: ${error.message}`)
						}
					}
				}

				// Публикуем событие в Redis для всех инстансов
				if (notifyUsers.size > 0) {
					this.redisService.redis.publish(
						'user:status',
						JSON.stringify({
							userId: connectionDto.telegramId,
							status: 'online',
							notifyUsers: Array.from(notifyUsers),
							timestamp: Date.now(),
						})
					)
				}
			}

			return {
				roomName: connectionDto.roomName,
				telegramId: connectionDto.telegramId,
				status: ConnectionStatus.Success,
			}
		} catch (error) {
			this.logger.error(`Error joining room: ${error.message}`, error.stack)
			return {
				roomName: connectionDto.roomName,
				telegramId: connectionDto.telegramId,
				message: `Ошибка при подключении к комнате: ${error.message}`,
				status: ConnectionStatus.Error,
			}
		}
	}

	/**
	 * Обработка отключения от комнаты
	 */
	async leaveRoom(connectionDto: ConnectionDto): Promise<ResConnectionDto> {
		try {
			// Если пользователь покидает свою личную комнату, обновляем статус на оффлайн
			if (connectionDto.roomName === connectionDto.telegramId) {
				await this.updateUserOfflineStatus(connectionDto.telegramId)
			}

			return {
				roomName: connectionDto.roomName,
				telegramId: connectionDto.telegramId,
				status: ConnectionStatus.Success,
			}
		} catch (error) {
			this.logger.error(`Error leaving room: ${error.message}`, error.stack)
			return {
				roomName: connectionDto.roomName,
				telegramId: connectionDto.telegramId,
				message: `Ошибка при отключении от комнаты: ${error.message}`,
				status: ConnectionStatus.Error,
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
			await this.redisService.redis.set(userStatusKey, 'offline', 'EX', 86400)

			// Удаляем привязку к комнате
			const userRoomKey = `user:${userId}:room`
			await this.redisService.redis.del(userRoomKey)

			// Получаем чаты пользователя
			const userChatsKey = `user:${userId}:chats`
			const userChats = await this.redisService.redis.get(userChatsKey)

			if (userChats) {
				const chatIds = JSON.parse(userChats)
				const notifyUsers = new Set<string>()

				// Находим всех пользователей, которым нужно отправить обновление
				for (const chatId of chatIds) {
					const chatKey = `chat:${chatId}`
					const chatData = await this.redisService.redis.get(chatKey)

					if (chatData) {
						try {
							const chat = JSON.parse(chatData)

							if (chat.participants && Array.isArray(chat.participants)) {
								// Добавляем собеседников в список для оповещения
								for (const participant of chat.participants) {
									if (participant !== userId) {
										notifyUsers.add(participant)
									}
								}
							}
						} catch (error) {
							this.logger.error(`Error parsing chat data: ${error.message}`)
						}
					}
				}

				// Публикуем событие в Redis для всех инстансов
				if (notifyUsers.size > 0) {
					this.redisService.redis.publish(
						'user:status',
						JSON.stringify({
							userId,
							status: 'offline',
							notifyUsers: Array.from(notifyUsers),
							timestamp: Date.now(),
						})
					)
				}
			}
		} catch (error) {
			this.logger.error(
				`Error updating user offline status: ${error.message}`,
				error.stack
			)
		}
	}
}
