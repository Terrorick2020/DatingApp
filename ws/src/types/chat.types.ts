import { WsClientToServerListen, WsServerToClientListener } from './base.types';
import { UpdateChatDto } from '@/app/chats/dto/update-chat.dto';

export enum EWriteType {
    None = 'None',
    Write = 'Write',
}

export enum ChatsServerMethods {
    UpdatedChat = 'updatedChat',
}

export enum ChatsClientMethods {
    UpdateData = 'updateData',
}

export interface ChatsClientToServerListen extends WsClientToServerListen {}

export interface ChatsServerToClientListener extends WsServerToClientListener {
    [ChatsClientMethods.UpdateData]: (updateData: UpdateChatDto) => Promise<void>
}
