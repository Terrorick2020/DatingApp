import { ClientToServerEvents, ServerToClientEvents, ResErrData } from './base.types';
import { MsgsUpdateIntrlocDto } from '@/app/messages/dto/update-interlocator.dto';
import { MsgsSendMsgDto } from '@/app/messages/dto/send-msg.dto';
import { MsgsUpdateMsgDto } from '@/app/messages/dto/update-msg.dto';
import { EWriteType } from './chat.types';


export enum ELineStat {
    Online = 'Online',
    Offline = 'Offline',
}

export enum EReadIt {
    Readed = 'Readed',
    Unreaded = 'Unreaded',
}

export enum MsgsServerMethods {
    UpdateInterlocutor = 'UpdateInterlocutor',
    UpdateMsg = 'UpdateMsg',
    SendMsg = 'SendMsg',
}

export enum MsgsClientMethods {
    UpdateInterData = 'UpdateInterData',
    UpdateMsgData = 'UpdateMsgData',
    SendMsgData = 'SendMsgData',
}

export interface ResMsgsUpdateIntrloc {
    interlocator: string
    newWriteStat?: EWriteType
    newLineStat?: ELineStat
}

interface ResMsgsBase {
    fromUser: string
    toUser: string
    chatId: string
    msgId: string
}

export interface ResMsgsUpdateMsg extends ResMsgsBase {
    newMsg?: string
    readStat?: EReadIt
}

export interface ResMsgsSendMsg  extends ResMsgsBase {
    newMsg: string
    readStat: EReadIt
    createdAt: number
}

export interface MsgsClientToServerEvents extends ClientToServerEvents {
    [MsgsServerMethods.UpdateInterlocutor]: (updateInterlocutor: MsgsUpdateIntrlocDto) => Promise<void>
    [MsgsServerMethods.UpdateMsg]: (updateMsg: MsgsUpdateMsgDto) => Promise<void>
    [MsgsServerMethods.SendMsg]: (sendMsg: MsgsSendMsgDto) => Promise<void>
}

export interface MsgsServerToClientEvents extends ServerToClientEvents {
    [MsgsClientMethods.UpdateInterData]: (updateInterData: ResMsgsUpdateIntrloc | ResErrData) => Promise<void>
    [MsgsClientMethods.UpdateMsgData]: (updateMsgData: ResMsgsUpdateMsg | ResErrData) => Promise<void>
    [MsgsClientMethods.SendMsgData]: (sendMsgData: ResMsgsSendMsg | ResErrData) => Promise<void>
}
