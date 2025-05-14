import {
	WebSocketGateway,
	SubscribeMessage,
	MessageBody,
	ConnectedSocket,
  } from '@nestjs/websockets';
  import { Socket } from 'socket.io';
  import {
	ChatsClientMethods,
	ChatsServerMethods,
	type ChatsClientToServerEvents,
	type ChatsServerToClientEvents,
  } from '@/types/chat.types';
  import { Injectable } from '@nestjs/common';
  import { BaseWsGateway } from '~/src/abstract/abstract.gateway';
  import { ChatService } from './chat.service';
  import { MemoryCacheService } from '../memory-cache.service';
  import { RedisService } from '../redis/redis.service';
  
  @WebSocketGateway({
	namespace: 'chats',
	cors: {
	  origin: '*',
	},
  })
  @Injectable()
  export class ChatGateway extends BaseWsGateway<
	ChatService,
	ChatsClientToServerEvents,
	ChatsServerToClientEvents
  > {
	constructor(
	  private readonly chatService: ChatService,
	  protected readonly cacheService: MemoryCacheService,
	  private readonly redisService: RedisService
	) {
	  super(chatService, cacheService);
	}
  
	@SubscribeMessage('getChats')
	async handleGetChats(
	  @MessageBody() data: { userId: string; roomName: string },
	  @ConnectedSocket() client: Socket
	): Promise<void> {
	  try {
		this.logger.debug(`Processing getChats request for user ${data.userId}`);
		
		if (!data || !data.userId) {
		  this.logger.warn(`Invalid data in getChats: ${JSON.stringify(data)}`);
		  client.emit(ChatsClientMethods.ChatsError, {
			message: 'Некорректные данные запроса',
			status: 'error'
		  });
		  return;
		}
		
		// Проверяем кеш
		const cacheKey = `user:${data.userId}:chats_list`;
		const cachedChats = this.cacheService.get(cacheKey);
		
		if (cachedChats) {
		  // Если данные в кеше, отправляем их напрямую
		  client.emit(ChatsClientMethods.ChatsList, cachedChats);
		  
		  // Асинхронно обновляем кеш (без блокировки)
		  this.chatService.getUserChats(data.userId)
			.then(chats => {
			  if (chats && Array.isArray(chats)) {
				this.cacheService.set(cacheKey, chats, 60); // TTL: 60 секунд
			  }
			})
			.catch(err => this.logger.error(`Failed to update chats cache: ${err.message}`));
		} else {
		  // Иначе получаем чаты и отправляем пользователю
		  const chats = await this.chatService.getUserChats(data.userId);
		  client.emit(ChatsClientMethods.ChatsList, chats);
		  
		  // Кешируем результат
		  if (chats && Array.isArray(chats)) {
			this.cacheService.set(cacheKey, chats, 60); // TTL: 60 секунд
		  }
		}
	  } catch (error) {
		this.logger.error(`Error in getChats: ${error.message}`, error.stack);
		client.emit(ChatsClientMethods.ChatsError, {
		  message: 'Ошибка при получении списка чатов',
		  status: 'error'
		});
	  }
	}
	
	@SubscribeMessage('getChatDetails')
	async handleGetChatDetails(
	  @MessageBody() data: { chatId: string; userId: string },
	  @ConnectedSocket() client: Socket
	): Promise<void> {
	  try {
		this.logger.debug(`Processing getChatDetails for chat ${data.chatId}`);
		
		if (!data || !data.chatId || !data.userId) {
		  client.emit('chatDetailsError', {
			message: 'Некорректные данные запроса',
			status: 'error'
		  });
		  return;
		}
		
		// Проверяем кеш
		const cacheKey = `chat:${data.chatId}:details`;
		const cachedDetails = this.cacheService.get(cacheKey);
		
		if (cachedDetails) {
		  // Если данные в кеше, отправляем их напрямую
		  client.emit('chatDetails', cachedDetails);
		  
		  // Асинхронно обновляем кеш
		  this.chatService.getChatDetails(data.chatId)
			.then(details => {
			  if (details) {
				this.cacheService.set(cacheKey, details, 30); // TTL: 30 секунд
			  }
			})
			.catch(err => this.logger.error(`Failed to update chat details cache: ${err.message}`));
		} else {
		  // Иначе получаем детали чата
		  const details = await this.chatService.getChatDetails(data.chatId);
		  
		  if (!details) {
			client.emit('chatDetailsError', {
			  message: 'Чат не найден',
			  status: 'error'
			});
			return;
		  }
		  
		  client.emit('chatDetails', details);
		  
		  // Кешируем результат
		  this.cacheService.set(cacheKey, details, 30); // TTL: 30 секунд
		}
	  } catch (error) {
		this.logger.error(`Error in getChatDetails: ${error.message}`, error.stack);
		client.emit('chatDetailsError', {
		  message: 'Ошибка при получении деталей чата',
		  status: 'error'
		});
	  }
	}
	
	@SubscribeMessage('getMessages')
	async handleGetMessages(
	  @MessageBody() data: { chatId: string; userId: string; limit?: number; offset?: number },
	  @ConnectedSocket() client: Socket
	): Promise<void> {
	  try {
		this.logger.debug(`Processing getMessages for chat ${data.chatId}`);
		
		if (!data || !data.chatId || !data.userId) {
		  client.emit('messagesError', {
			message: 'Некорректные данные запроса',
			status: 'error'
		  });
		  return;
		}
		
		const limit = data.limit || 50;
		const offset = data.offset || 0;
		
		// Для сообщений используем прямой доступ к Redis из-за оптимизации
		const messagesKey = `chat:${data.chatId}:messages`;
		const orderKey = `chat:${data.chatId}:order`;
		
		// Получаем ID сообщений в правильном порядке
		const messageIds = await this.redisService.redis.zrevrange(orderKey, offset, offset + limit - 1);
		
		if (!messageIds || messageIds.length === 0) {
		  client.emit('messages', []);
		  return;
		}
		
		// Получаем сообщения из Redis
		const messagesData = await this.redisService.redis.hmget(messagesKey, ...messageIds);
		
		// Обрабатываем данные
		const messages = messagesData
		  .map(msgStr => {
			if (!msgStr) return null;
			try {
			  return JSON.parse(msgStr);
			} catch (e) {
			  return null;
			}
		  })
		  .filter(Boolean);
		
		client.emit('messages', messages);
		
		// Обновляем TTL для ключей
		await Promise.all([
		  this.redisService.redis.expire(messagesKey, 86400),
		  this.redisService.redis.expire(orderKey, 86400)
		]);
	  } catch (error) {
		this.logger.error(`Error in getMessages: ${error.message}`, error.stack);
		client.emit('messagesError', {
		  message: 'Ошибка при получении сообщений',
		  status: 'error'
		});
	  }
	}
	
	@SubscribeMessage('readMessages')
	async handleReadMessages(
	  @MessageBody() data: { chatId: string; userId: string; lastReadMessageId: string },
	  @ConnectedSocket() client: Socket
	): Promise<void> {
	  try {
		this.logger.debug(`Processing readMessages for chat ${data.chatId}`);
		
		if (!data || !data.chatId || !data.userId || !data.lastReadMessageId) {
		  client.emit('readMessagesError', {
			message: 'Некорректные данные запроса',
			status: 'error'
		  });
		  return;
		}
		
		// Обновляем статус прочтения в Redis
		const readStatusKey = `chat:${data.chatId}:read_status`;
		
		// Получаем текущий статус
		const readStatusData = await this.redisService.redis.get(readStatusKey);
		let readStatus = {};
		
		if (readStatusData) {
		  try {
			readStatus = JSON.parse(readStatusData);
		  } catch (e) {
			this.logger.error(`Error parsing read status: ${e.message}`);
		  }
		}
		
		// Обновляем статус прочтения для пользователя
		readStatus[data.userId] = data.lastReadMessageId;
		
		// Сохраняем обновленный статус
		await this.redisService.redis.set(readStatusKey, JSON.stringify(readStatus), 'EX', 86400);
		
		// Сбрасываем счетчик непрочитанных для этого пользователя
		await this.redisService.redis.hset(`chat:${data.chatId}`, 'unreadCount', '0');
		
		// Инвалидируем кеш превью
		await this.redisService.redis.del(`user:${data.userId}:chats_preview`);
		this.cacheService.delete(`user:${data.userId}:chats_list`);
		
		// Отправляем подтверждение
		client.emit('readMessagesSuccess', {
		  chatId: data.chatId,
		  lastReadMessageId: data.lastReadMessageId
		});
		
		// Получаем чат для определения другого участника
		const chatKey = `chat:${data.chatId}`;
		const chatData = await this.redisService.redis.get(chatKey);
		
		if (chatData) {
		  try {
			const chat = JSON.parse(chatData);
			
			if (chat.participants && Array.isArray(chat.participants)) {
			  // Находим другого участника
			  const otherUser = chat.participants.find(id => id !== data.userId);
			  
			  if (otherUser) {
				// Публикуем событие для оповещения
				this.redisService.redis.publish('chat:messageRead', JSON.stringify({
				  chatId: data.chatId,
				  userId: data.userId,
				  otherUser,
				  lastReadMessageId: data.lastReadMessageId
				}));
			  }
			}
		  } catch (e) {
			this.logger.error(`Error parsing chat data: ${e.message}`);
		  }
		}
	  } catch (error) {
		this.logger.error(`Error in readMessages: ${error.message}`, error.stack);
		client.emit('readMessagesError', {
		  message: 'Ошибка при обновлении статуса прочтения',
		  status: 'error'
		});
	  }
	}
	
	// Отправка уведомления об обновлении чата конкретному пользователю
	async sendChatUpdate(userId: string, updateData: any): Promise<void> {
	  if (this.isUserOnline(userId)) {
		this.sendToUser(userId, 'chatUpdate', updateData);
		this.logger.debug(`Sent chat update to user ${userId}`);
	  }
	}
	
	// Отправка уведомления об изменении статуса пользователя
	async sendUserStatusUpdate(userId: string, statusData: any): Promise<void> {
	  if (this.isUserOnline(userId)) {
		this.sendToUser(userId, 'userStatus', statusData);
		this.logger.debug(`Sent user status update to user ${userId}`);
	  }
	}
  }