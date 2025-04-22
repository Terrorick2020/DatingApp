import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { EventPattern, Payload } from '@nestjs/microservices';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { WsClientMethods, WsServerMethothod } from '@/types/base.types';
import { ChatsServerMethods, ChatsClientMethods } from '@/types/chat.types';
import { ConnectionChatDto } from './dto/connection-chats.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { WsConnectionStatus } from '@/types/base.types';
import type { ChatsClientToServerListen, ChatsServerToClientListener } from '@/types/chat.types';
import type { WsServerConnection } from '@/types/base.types';

@WebSocketGateway(8080, {
  namespace: 'chat',
  cors: {
    origin: '*'
  }
})
export class ChatGateway {
  @WebSocketServer()
  server: Server<ChatsClientToServerListen, ChatsServerToClientListener>;

  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage(WsServerMethothod.JoinRoom)
  async handleJoinRoom(@MessageBody() connectionDto: ConnectionChatDto, @ConnectedSocket() client: Socket): Promise<void> {

    const resJoinRoom: WsServerConnection = await this.chatService.joinRoom(connectionDto);

    if( resJoinRoom.status === WsConnectionStatus.Success ) {
      client.join(connectionDto.roomName);
    }

    client.emit(WsClientMethods.Connect, resJoinRoom);
  }

  @EventPattern(ChatsServerMethods.UpdatedChat)
  async handleUpdateChat(@Payload() updateDto: UpdateChatDto): Promise<void> {
    this.server.to(updateDto.roomName).emit(ChatsClientMethods.UpdateData, updateDto)
  }

  @SubscribeMessage(WsServerMethothod.LeaveRoom)
  async handleLeaveRoom(@MessageBody() connectionDto: ConnectionChatDto, @ConnectedSocket() client: Socket): Promise<void> {

    const resLeaveRoom: WsServerConnection = await this.chatService.leaveRoom(connectionDto);

    client.leave(connectionDto.roomName);
    client.emit(WsClientMethods.Connect, resLeaveRoom);
  }
}
