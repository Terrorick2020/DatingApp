import { Injectable } from '@nestjs/common';
import { BaseWsService } from '@/abstract/abstract.service';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { ConnectionDto } from '@/abstract/dto/connection.dto';
import { MsgsUpdateIntrlocDto } from './dto/update-interlocator.dto';
import { MsgsSendMsgDto } from './dto/send-msg.dto';
import { MsgsUpdateMsgDto } from './dto/update-msg.dto';
import { MsgsServerMethods } from '@/types/messages.types';
import { Logger } from '@nestjs/common';

@Injectable()
export class MessagesService extends BaseWsService {
  private readonly logger = new Logger(MessagesService.name);
  private readonly messageTimeout = 86400; // 24 часа в секундах
  
  constructor(
    protected readonly configService: ConfigService,
    private readonly redisService: RedisService
  ) {
    super(configService);
  }
  
  /**
   * Оптимизированный метод отправки сообщения
   */
  async sendMsg(msgsUpdateMsgDto: MsgsUpdateMsgDto): Promise<any> {
    try {
      // Проверяем существование чата напрямую через Redis
      const { chatId, telegramId, newMsg, roomName } = msgsUpdateMsgDto;
      const chatKey = `chat:${chatId}`;
      
      // Проверяем, существует ли чат
      const chatData = await this.redisService.redis.get(chatKey);
      if (!chatData) {
        return {
          message: 'Чат не найден',
          status: 'error'
        };
      }
      
      // Парсим данные чата
      const chat = JSON.parse(chatData);
      
      // Проверяем, является ли пользователь участником чата
      if (!chat.participants.includes(telegramId)) {
        return {
          message: 'Вы не являетесь участником этого чата',
          status: 'error'
        };
      }
      
      // Определяем получателя
      const toUser = chat.participants.find(id => id !== telegramId);
      if (!toUser) {
        return {
          message: 'Не удалось определить получателя',
          status: 'error'
        };
      }
      
      // Генерируем ID сообщения и метку времени
      const msgId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const timestamp = Date.now();
      
      // Создаем структуру сообщения
      const message = {
        id: msgId,
        chatId,
        fromUser: telegramId,
        toUser,
        text: newMsg,
        created_at: timestamp,
        updated_at: timestamp,
        readStat: 'Unreaded'
      };
      
      // Пакетная операция для сохранения сообщения и обновления метаданных чата
      const pipeline = this.redisService.redis.pipeline();
      
      // 1. Сохраняем сообщение в хеш-таблицу
      const messagesKey = `chat:${chatId}:messages`;
      pipeline.hset(messagesKey, msgId, JSON.stringify(message));
      
      // 2. Обновляем порядок сообщений
      const orderKey = `chat:${chatId}:order`;
      pipeline.zadd(orderKey, timestamp, msgId);
      
      // 3. Обновляем метаданные чата
      chat.last_message_id = msgId;
      pipeline.set(chatKey, JSON.stringify(chat), 'EX', this.messageTimeout);
      
      // 4. Устанавливаем TTL для ключей
      pipeline.expire(messagesKey, this.messageTimeout);
      pipeline.expire(orderKey, this.messageTimeout);
      
      // Выполняем пакетные операции
      await pipeline.exec();
      
      // Отправляем TCP запрос только при необходимости сложной бизнес-логики
      // или для синхронизации с API (асинхронно)
      this.sendRequest(MsgsServerMethods.SendMsg, msgsUpdateMsgDto)
        .catch(err => this.logger.error(`Error notifying API about new message: ${err.message}`));
      
      this.logger.debug(`Message ${msgId} sent to chat ${chatId} successfully`);
      
      // Возвращаем результат
      return {
        chatId,
        msgId,
        fromUser: telegramId,
        toUser,
        newMsg,
        createdAt: timestamp,
        readStat: 'Unreaded'
      };
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`, error.stack);
      return {
        message: 'Ошибка при отправке сообщения',
        status: 'error'
      };
    }
  }
  
  /**
   * Обновление информации о собеседнике (статус печати и т.д.)
   */
  async updateInterlocutor(msgsUpdateIntrlocDto: MsgsUpdateIntrlocDto): Promise<any> {
    try {
      // Используем Redis напрямую для оптимизации скорости
      if (msgsUpdateIntrlocDto.newWriteStat) {
        // Обрабатываем статус набора текста
        const { telegramId, roomName } = msgsUpdateIntrlocDto;
        
        // Получаем данные о чате
        const chatsKey = `user:${telegramId}:chats`;
        const userChats = await this.redisService.redis.get(chatsKey);
        
        if (userChats) {
          const chatIds = JSON.parse(userChats);
          
          // Находим чат с собеседником
          let targetChatId = null;
          
          for (const chatId of chatIds) {
            const chatKey = `chat:${chatId}`;
            const chatData = await this.redisService.redis.get(chatKey);
            
            if (chatData) {
              const chat = JSON.parse(chatData);
              
              if (chat.participants && 
                  Array.isArray(chat.participants) && 
                  chat.participants.includes(roomName)) {
                targetChatId = chatId;
                break;
              }
            }
          }
          
          if (targetChatId) {
            // Обновляем статус набора текста
            const typingKey = `chat:${targetChatId}:typing`;
            
            if (msgsUpdateIntrlocDto.newWriteStat === 'Write') {
              // Добавляем пользователя в список печатающих
              await this.redisService.redis.sadd(typingKey, telegramId);
              // Устанавливаем TTL для автоматического удаления через 10 секунд
              await this.redisService.redis.expire(typingKey, 10);
            } else {
              // Удаляем пользователя из списка печатающих
              await this.redisService.redis.srem(typingKey, telegramId);
            }
            
            // Отправляем TCP запрос для синхронизации с API (асинхронно)
            this.sendRequest(MsgsServerMethods.UpdateInterlocutor, msgsUpdateIntrlocDto)
              .catch(err => this.logger.error(`Error notifying API about interlocutor update: ${err.message}`));
            
            return {
              interlocator: roomName,
              newWriteStat: msgsUpdateIntrlocDto.newWriteStat
            };
          }
        }
      }
      
      // Если не сработала прямая обработка, падаем на TCP запрос
      return await this.sendRequest(
        MsgsServerMethods.UpdateInterlocutor,
        msgsUpdateIntrlocDto
      );
    } catch (error) {
      this.logger.error(`Error updating interlocutor: ${error.message}`, error.stack);
      return {
        message: 'Ошибка при обновлении статуса собеседника',
        status: 'error'
      };
    }
  }
  
  /**
   * Обновление сообщения
   */
  async updateMsg(msgsSendMsgDto: MsgsSendMsgDto): Promise<any> {
    try {
      // Передаем запрос в API через TCP
      return await this.sendRequest(
        MsgsServerMethods.UpdateMsg,
        msgsSendMsgDto
      );
    } catch (error) {
      this.logger.error(`Error updating message: ${error.message}`, error.stack);
      return {
        message: 'Ошибка при обновлении сообщения',
        status: 'error'
      };
    }
  }
  
  /**
   * Метод для обновления статуса пользователя
   */
  async updateUserStatus(userId: string, isOnline: boolean): Promise<void> {
    try {
      // Обновляем статус в Redis
      if (isOnline) {
        // Онлайн с TTL 1 час
        await this.redisService.redis.set(`user:${userId}:status`, 'online', 'EX', 3600);
      } else {
        // Офлайн с TTL 24 часа
        await this.redisService.redis.set(`user:${userId}:status`, 'offline', 'EX', 86400);
      }
      
      // Получаем список чатов пользователя
      const chatsKey = `user:${userId}:chats`;
      const userChats = await this.redisService.redis.get(chatsKey);
      
      if (userChats) {
        const chatIds = JSON.parse(userChats);
        const notifyUsers = new Set<string>();
        
        // Находим всех пользователей, которым нужно отправить обновление
        for (const chatId of chatIds) {
          const chatKey = `chat:${chatId}`;
          const chatData = await this.redisService.redis.get(chatKey);
          
          if (chatData) {
            try {
              const chat = JSON.parse(chatData);
              
              if (chat.participants && Array.isArray(chat.participants)) {
                // Добавляем собеседников в список для оповещения
                for (const participant of chat.participants) {
                  if (participant !== userId) {
                    notifyUsers.add(participant);
                  }
                }
              }
            } catch (error) {
              this.logger.error(`Error parsing chat data: ${error.message}`);
            }
          }
        }
        
        // Публикуем событие в Redis для всех инстансов
        if (notifyUsers.size > 0) {
          this.redisService.redis.publish('user:status', JSON.stringify({
            userId,
            status: isOnline ? 'online' : 'offline',
            notifyUsers: Array.from(notifyUsers),
            timestamp: Date.now()
          }));
        }
      }
    } catch (error) {
      this.logger.error(`Error updating user status: ${error.message}`, error.stack);
    }
  }
  
  /**
   * Обработка подключения к комнате
   */
  async joinRoom(connectionDto: ConnectionDto): Promise<any> {
    try {
      // Обновляем статус пользователя на онлайн
      await this.updateUserStatus(connectionDto.telegramId, true);
      
      return {
        roomName: connectionDto.roomName,
        telegramId: connectionDto.telegramId,
        status: 'success'
      };
    } catch (error) {
      this.logger.error(`Error joining room: ${error.message}`, error.stack);
      return {
        message: 'Ошибка при подключении к комнате',
        status: 'error'
      };
    }
  }
  
  /**
   * Обработка отключения от комнаты
   */
  async leaveRoom(connectionDto: ConnectionDto): Promise<any> {
    try {
      // Специальный случай - если мы покидаем личную комнату, обновляем статус на оффлайн
      if (connectionDto.roomName === connectionDto.telegramId) {
        await this.updateUserStatus(connectionDto.telegramId, false);
      }
      
      return {
        roomName: connectionDto.roomName,
        telegramId: connectionDto.telegramId,
        status: 'success'
      };
    } catch (error) {
      this.logger.error(`Error leaving room: ${error.message}`, error.stack);
      return {
        message: 'Ошибка при отключении от комнаты',
        status: 'error'
      };
    }
  }
  
  /**
   * Метод для обновления статуса пользователя на оффлайн
   */
  async updateUserOfflineStatus(userId: string): Promise<void> {
    await this.updateUserStatus(userId, false);
  }
}