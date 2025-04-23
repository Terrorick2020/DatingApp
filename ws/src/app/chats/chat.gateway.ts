import { WebSocketGateway } from '@nestjs/websockets';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ChatService } from './chat.service';
import { ChatsServerMethods, ChatsClientMethods } from '@/types/chat.types';
import { BaseWsConnectionDto } from '@/abstract/dto/connection.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { AddChatDto } from './dto/add-chat.dto';
import { DeleteChatDto } from './dto/delete-chat.dto';
import { BaseWsGateway } from '@/abstract/abstract.geteway';
import type { ChatsClientToServerEvents, ChatsServerToClientEvents } from '@/types/chat.types';
import type { ResServerConnection } from '@/types/base.types';


@WebSocketGateway(8080, {
  namespace: 'chats',
  cors: {
    origin: '*'
  }
})
export class ChatGateway extends BaseWsGateway<ChatsClientToServerEvents, ChatsServerToClientEvents> {
  constructor(private readonly chatService: ChatService) {
    super();
  }

  protected async joinRoomService(connectionDto: BaseWsConnectionDto): Promise<ResServerConnection> {
    return await this.chatService.joinRoom(connectionDto);
  }

  protected async leaveRoomService(connectionDto: BaseWsConnectionDto): Promise<ResServerConnection> {
    return await this.chatService.leaveRoom(connectionDto);
  }

  @EventPattern(ChatsServerMethods.UpdatedChat)
  async handleUpdateChat(@Payload() updateDto: UpdateChatDto): Promise<void> {
    this.server.to(updateDto.roomName).emit(ChatsClientMethods.UpdateData, updateDto)
  }

  @EventPattern(ChatsServerMethods.AddChat)
  async handleAddChat(@Payload() addChatDto: AddChatDto): Promise<void> {
    this.server.to(addChatDto.roomName).emit(ChatsClientMethods.AddData, addChatDto)
  }

  @EventPattern(ChatsServerMethods.DeleteChat)
  async handleDeleteChat(@Payload() deleteChatDto: DeleteChatDto): Promise<void> {
    this.server.to(deleteChatDto.roomName).emit(ChatsClientMethods.DeleteData, deleteChatDto)
  }
}
