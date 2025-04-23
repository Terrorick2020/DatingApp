import { BaseWsConnectionDto } from '@/abstract/dto/connection.dto';


export enum WsConnectionStatus {
    Error = 'error',
    Success = 'success',
}

export enum WsServerMethothod {
    JoinRoom = 'joinRoom',
    LeaveRoom = 'leaveRoom',
}

export enum WsClientMethods {
    Connect = 'connection'
}

export interface ResServerConnection {
    roomName: string
    telegramId: string
    status: WsConnectionStatus
}

export interface ResErrData {
    message: string
    status: WsConnectionStatus
}

export interface ClientToServerEvents {
    [WsServerMethothod.JoinRoom]: (connection: BaseWsConnectionDto) => Promise<void>
    [WsServerMethothod.LeaveRoom]: (connection: BaseWsConnectionDto) => Promise<void>
}

export interface ServerToClientEvents {
    [WsClientMethods.Connect]: (connection: ResServerConnection | ResErrData) => Promise<void>
    [WsClientMethods.Connect]: (connection: ResServerConnection | ResErrData) => Promise<void>
}
