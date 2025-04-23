import { ClientToServerEvents, ServerToClientEvents, ResErrData } from './base.types';
import { UpdateChatDto } from '@/app/chats/dto/update-chat.dto';
import { AddChatDto } from '@/app/chats/dto/add-chat.dto';
import { DeleteChatDto } from '@/app/chats/dto/delete-chat.dto';


export enum EWriteType {
    None = 'None',
    Write = 'Write',
}

export enum ChatsServerMethods {
    UpdatedChat = 'UpdatedChat',
    AddChat = 'AddChat',
    DeleteChat = 'DeleteChat'
}

export enum ChatsClientMethods {
    UpdateData = 'UpdateData',
    AddData = 'AddData',
    DeleteData = 'DeleteData'
}

export interface ChatsClientToServerEvents extends ClientToServerEvents {}

export interface ChatsServerToClientEvents extends ServerToClientEvents {
    [ChatsClientMethods.UpdateData]: (updateData: UpdateChatDto | ResErrData) => Promise<void>
    [ChatsClientMethods.AddData]: (addData: AddChatDto | ResErrData) => Promise<void>
    [ChatsClientMethods.DeleteData]: (deleteData: DeleteChatDto | ResErrData) => Promise<void>
}

export interface ChatsToUser {
    id: string
    avatar: string
    writeStat: EWriteType
}
