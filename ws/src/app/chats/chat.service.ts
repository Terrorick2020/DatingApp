import { Injectable } from '@nestjs/common';
import { ConnectionChatDto } from './dto/connection-chats.dto';
import { WsConnectionStatus } from '@/types/base.types';
import type { WsServerConnection } from '@/types/base.types';

@Injectable()
export class ChatService {
    async joinRoom(connectionDto: ConnectionChatDto): Promise<WsServerConnection> {
        const resConnection: WsServerConnection = {
            roomName: connectionDto.roomName,
            telegramId: connectionDto.telegramId,
            status: WsConnectionStatus.Success,
        }

        return resConnection;
    }

    async leaveRoom(connectionDto: ConnectionChatDto): Promise<WsServerConnection> {
        const resConnection: WsServerConnection = {
            roomName: connectionDto.roomName,
            telegramId: connectionDto.telegramId,
            status: WsConnectionStatus.Success,
        }

        return resConnection;
    }
}
