import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
    WebSocketGateway as NestWebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
} from '@nestjs/websockets'

import {
    ConnectionStatus,
    ClientMethods,
    ServerMethods,
    type ClientToServerEvents,
    type ServerToClientEvents,
} from '@/types/base.types'
import { Server, Socket } from 'socket.io'
import { ConnectionDto } from './dto/connection.dto'
import { ResConnectionDto } from './dto/response.dto'
import { BaseWsService } from './abstract.service'
import { Logger } from '@nestjs/common'
import { MemoryCacheService } from '../app/memory-cache.service'

export abstract class BaseWsGateway<
    TService extends BaseWsService,
    TClientToServerEvents extends ClientToServerEvents,
    TServerToClientEvents extends ServerToClientEvents
> implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
    protected readonly logger = new Logger(this.constructor.name)

    constructor(
        protected readonly service: TService,
        protected readonly cacheService: MemoryCacheService
    ) {}

    @WebSocketServer()
    protected server: Server<TClientToServerEvents, TServerToClientEvents>

    // Карты ассоциаций для пользователей и сокетов
    protected userToSocketMap = new Map<string, Set<string>>() // userId -> Set<socketId>
    protected socketToUserMap = new Map<string, string>() // socketId -> userId

    // Карта активных комнат
    protected roomMembers = new Map<string, Set<string>>() // roomName -> Set<userId>

    // Счетчики для мониторинга
    protected totalConnections = 0
    protected totalUsers = 0

    afterInit(server: Server) {
        this.logger.log(`WebSocket Gateway initialized: ${this.constructor.name}`)
    }

    handleConnection(client: Socket) {
        this.totalConnections++
        this.logger.debug(
            `Client connected: ${client.id}. Total: ${this.totalConnections}`
        )
    }

    handleDisconnect(client: Socket) {
        this.totalConnections--

        // Получаем ID пользователя
        const userId = this.socketToUserMap.get(client.id)
        if (userId) {
            // Удаляем сокет из списка сокетов пользователя
            const userSockets = this.userToSocketMap.get(userId)
            if (userSockets) {
                userSockets.delete(client.id)

                // Если это был последний сокет пользователя, отмечаем выход
                if (userSockets.size === 0) {
                    this.userToSocketMap.delete(userId)
                    this.totalUsers--

                    // Асинхронно обновляем статус офлайн
                    this.service
                        .updateUserOfflineStatus(userId)
                        .catch(err =>
                            this.logger.error(
                                `Failed to update offline status for ${userId}: ${err.message}`
                            )
                        )

                    // Удаляем пользователя из всех комнат
                    this.removeUserFromAllRooms(userId)
                } else {
                    this.userToSocketMap.set(userId, userSockets)
                }
            }
        }

        // Удаляем сокет из всех маппингов
        this.socketToUserMap.delete(client.id)

        this.logger.debug(
            `Client disconnected: ${client.id}. Total: ${this.totalConnections}`
        )
    }

    @SubscribeMessage(ServerMethods.JoinRoom)
    async handleJoinRoom(
        @MessageBody() connectionDto: ConnectionDto,
        @ConnectedSocket() client: Socket
    ): Promise<void> {
        const { telegramId, roomName } = connectionDto

        try {
            // Сохраняем ассоциацию сокета с пользователем
            this.socketToUserMap.set(client.id, telegramId)

            // Добавляем сокет к списку сокетов пользователя
            if (!this.userToSocketMap.has(telegramId)) {
                this.userToSocketMap.set(telegramId, new Set<string>())
                this.totalUsers++
            }

            const userSockets = this.userToSocketMap.get(telegramId)!
            userSockets.add(client.id)

            // Теперь подключаем пользователя к комнате
            client.join(telegramId) // Личная комната пользователя

            // Если указана дополнительная комната, подключаем и к ней
            if (roomName && roomName !== telegramId) {
                client.join(roomName)

                // Добавляем пользователя в комнату
                if (!this.roomMembers.has(roomName)) {
                    this.roomMembers.set(roomName, new Set<string>())
                }

                const roomUsers = this.roomMembers.get(roomName)!
                roomUsers.add(telegramId)
            }

            // Обновляем статус в Redis
            this.service
                .joinRoom(connectionDto)
                .then(() => {
                    this.logger.debug(`User ${telegramId} joined room ${roomName}`)
                })
                .catch(err => {
                    this.logger.error(
                        `Error joining room ${roomName} for user ${telegramId}: ${err.message}`
                    )
                })

            // Отправляем подтверждение подключения
            client.emit(ClientMethods.Connection, {
                roomName: roomName || telegramId,
                telegramId,
                status: ConnectionStatus.Success,
            })
        } catch (error) {
            this.logger.error(
                `Error handling join room for ${telegramId}: ${error.message}`,
                error.stack
            )
            client.emit(ClientMethods.Connection, {
                roomName: roomName || telegramId,
                telegramId,
                message: 'Error joining room',
                status: ConnectionStatus.Error,
            })
        }
    }

    @SubscribeMessage(ServerMethods.LeaveRoom)
    async handleLeaveRoom(
        @MessageBody() connectionDto: ConnectionDto,
        @ConnectedSocket() client: Socket
    ): Promise<void> {
        const { telegramId, roomName } = connectionDto

        try {
            // Покидаем только указанную комнату (не личную)
            if (roomName && roomName !== telegramId) {
                client.leave(roomName)

                // Удаляем пользователя из комнаты
                const roomUsers = this.roomMembers.get(roomName)
                if (roomUsers) {
                    roomUsers.delete(telegramId)

                    // Если комната пуста, удаляем ее
                    if (roomUsers.size === 0) {
                        this.roomMembers.delete(roomName)
                    }
                }
            }

            // Обновляем Redis (асинхронно)
            this.service.leaveRoom(connectionDto).catch(err => {
                this.logger.error(
                    `Error leaving room ${roomName} for user ${telegramId}: ${err.message}`
                )
            })

            // Отправляем подтверждение
            client.emit(ClientMethods.Connection, {
                roomName,
                telegramId,
                status: ConnectionStatus.Success,
            })
        } catch (error) {
            this.logger.error(
                `Error handling leave room for ${telegramId}: ${error.message}`,
                error.stack
            )
            client.emit(ClientMethods.Connection, {
                roomName,
                telegramId,
                message: 'Error leaving room',
                status: ConnectionStatus.Error,
            })
        }
    }

    // Отправить событие всем сокетам конкретного пользователя
    protected sendToUser<T = any>(userId: string, event: string, data: T): void {
        (this.server as any).to(userId).emit(event, data);
    }

    // Отправить событие в конкретную комнату
    protected sendToRoom<T = any>(roomName: string, event: string, data: T): void {
        (this.server as any).to(roomName).emit(event, data);
    }

    // Удалить пользователя из всех комнат
    private removeUserFromAllRooms(userId: string): void {
        for (const [roomName, users] of this.roomMembers.entries()) {
            if (users.has(userId)) {
                users.delete(userId)

                // Если комната пуста, удаляем ее
                if (users.size === 0) {
                    this.roomMembers.delete(roomName)
                }
            }
        }
    }

    // Проверка, онлайн ли пользователь (имеет активные соединения)
    protected isUserOnline(userId: string): boolean {
        const sockets = this.userToSocketMap.get(userId)
        return sockets !== undefined && sockets.size > 0
    }

    // Получить список онлайн-пользователей в комнате
    protected getOnlineUsersInRoom(roomName: string): string[] {
        const users = this.roomMembers.get(roomName)
        if (!users) return []

        // Фильтруем только онлайн-пользователей
        return Array.from(users).filter(userId => this.isUserOnline(userId))
    }

    // Получить метрики для мониторинга
    getMetrics() {
        return {
            connections: this.totalConnections,
            users: this.totalUsers,
            rooms: this.roomMembers.size,
        }
    }
}