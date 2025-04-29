// ws/src/app/chats/chat.service.ts
import { Injectable } from '@nestjs/common';
import { BaseWsService } from '@/abstract/abstract.service';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { UpdateChatDto } from './dto/update-chat.dto';
import { AddChatDto } from './dto/add-chat.dto';
import { ChatsServerMethods } from '@/types/chat.types';
import { BaseWsConnectionDto } from '@/abstract/dto/connection.dto';
import { ResServerConnection, ResErrData, WsConnectionStatus } from '@/types/base.types';

@Injectable()
export class ChatService extends BaseWsService {
    constructor(
        private readonly configService: ConfigService,
        private readonly redisService: RedisService
    ) {
        const host = configService.get<string>('API_HOST');
        const port = configService.get<number>('CHATS_PORT');

        host && port && super(host, port);
    }
    
    // Расширенный метод joinRoom
    async joinRoom(connectionDto: BaseWsConnectionDto): Promise<ResServerConnection | ResErrData> {
        try {
            // Обновляем статус пользователя в Redis
            await this.redisService.set(`user:${connectionDto.telegramId}:status`, 'online', 3600);
            await this.redisService.set(`user:${connectionDto.telegramId}:room`, connectionDto.roomName, 3600);
            
            // Вызываем базовый метод для присоединения к комнате
            return await super.joinRoom(connectionDto);
        } catch (error) {
            console.error('Error in joinRoom:', error);
            return {
                message: 'Error joining room',
                status: WsConnectionStatus.Error
            };
        }
    }
    
    // Расширенный метод leaveRoom
    async leaveRoom(connectionDto: BaseWsConnectionDto): Promise<ResServerConnection | ResErrData> {
        try {
            // Обновляем статус пользователя в Redis
            await this.redisService.set(`user:${connectionDto.telegramId}:status`, 'offline', 3600);
            await this.redisService.del(`user:${connectionDto.telegramId}:room`);
            
            // Вызываем базовый метод для выхода из комнаты
            return await super.leaveRoom(connectionDto);
        } catch (error) {
            console.error('Error in leaveRoom:', error);
            return {
                message: 'Error leaving room',
                status: WsConnectionStatus.Error
            };
        }
    }
    
    // Метод для отправки запроса на обновление чата
    async updateChat(updateDto: UpdateChatDto): Promise<any> {
        return this.sendRequest<
            ChatsServerMethods, 
            UpdateChatDto, 
            any
        >(ChatsServerMethods.UpdatedChat, updateDto);
    }
    
    // Метод для отправки запроса на создание чата
    async addChat(addChatDto: AddChatDto): Promise<any> {
        return this.sendRequest<
            ChatsServerMethods,
            AddChatDto,
            any
        >(ChatsServerMethods.AddChat, addChatDto);
    }
    
    // Получение списка чатов пользователя из Redis
    async getUserChats(userId: string): Promise<any[]> {
        try {
            const chatIds = await this.redisService.getList(`user:${userId}:chats`);
            
            if (!chatIds.length) {
                // Если в Redis нет данных, запрашиваем из API
                return await this.getUserChatsFromApi(userId);
            }
            
            const chats: any[] = [];
            for (const chatId of chatIds) {
                const chat: any = await this.getChatDetails(chatId);
                if (chat) chats.push(chat);
            }
            
            return chats;
        } catch (error) {
            console.error('Error getting user chats:', error);
            return [];
        }
    }
    
    // Получение списка чатов из API
    private async getUserChatsFromApi(userId: string): Promise<any[]> {
        try {
            // Используем специальный метод для получения чатов (должен быть реализован на API)
            const result = await this.sendRequest<
                any,
                { userId: string },
                any[]
            >('getUserChats' as any, { userId });
            
            // Кешируем полученные данные
            if (Array.isArray(result)) {
                for (const chat of result) {
                    if (chat && chat.id) {
                        await this.cacheChatData(chat);
                        await this.redisService.addToList(`user:${userId}:chats`, chat.id);
                    }
                }
                return result;
            }
            
            return [];
        } catch (error) {
            console.error('Error fetching user chats from API:', error);
            return [];
        }
    }
    
    // Получение информации о чате
    async getChatDetails(chatId: string): Promise<any | null> {
        try {
            // Сначала пробуем получить из Redis
            const cachedData = await this.redisService.hgetall(`chat:${chatId}`);
            
            if (cachedData && Object.keys(cachedData).length > 0) {
                return {
                    id: chatId,
                    ...cachedData,
                    unreadCount: parseInt(cachedData.unreadCount || '0'),
                    createdAt: parseInt(cachedData.createdAt || '0')
                };
            }
            
            // Если в Redis нет данных, запрашиваем из API
            const result = await this.sendRequest<
                any,
                { chatId: string },
                any
            >('getChatDetails' as any, { chatId });
            
            // Кешируем полученные данные
            if (result && typeof result === 'object' && !result.message) {
                await this.cacheChatData(result);
                return result;
            }
            
            return null;
        } catch (error) {
            console.error('Error fetching chat details:', error);
            return null;
        }
    }
    
    // Вспомогательный метод для кеширования данных чата
    private async cacheChatData(chat: Record<string, any>): Promise<void> {
        if (!chat || !chat.id) return;
        
        try {
            const chatData = {
                lastMsgId: chat.lastMsgId || '',
                lastMsgText: chat.lastMsgText || '',
                unreadCount: (chat.unreadCount || 0).toString(),
                createdAt: (chat.createdAt || Date.now()).toString(),
                updatedAt: (chat.updatedAt || Date.now()).toString()
            };
            
            // Используем хеши для хранения данных чата
            await this.redisService.hset(`chat:${chat.id}`, 'lastMsgId', chatData.lastMsgId);
            await this.redisService.hset(`chat:${chat.id}`, 'lastMsgText', chatData.lastMsgText);
            await this.redisService.hset(`chat:${chat.id}`, 'unreadCount', chatData.unreadCount);
            await this.redisService.hset(`chat:${chat.id}`, 'createdAt', chatData.createdAt);
            await this.redisService.hset(`chat:${chat.id}`, 'updatedAt', chatData.updatedAt);
            
            // Устанавливаем срок жизни ключа
            await this.redisService.expire(`chat:${chat.id}`, 3600);
            
            // Если есть информация о пользователях, кешируем и ее
            if (chat.users && Array.isArray(chat.users)) {
                await this.redisService.set(
                    `chat:${chat.id}:users`, 
                    JSON.stringify(chat.users), 
                    3600
                );
                
                // Добавляем этот чат в список чатов каждого пользователя
                for (const userId of chat.users) {
                    await this.redisService.addToList(`user:${userId}:chats`, chat.id);
                }
            }
        } catch (error) {
            console.error('Error caching chat data:', error);
        }
    }
}