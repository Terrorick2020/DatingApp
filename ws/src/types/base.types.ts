import { IsString } from 'class-validator';

export enum WsConnectionStatus {
    Error = 'error',
    Success = 'success',
}

export class BaseClientConnectionDto {
    @IsString()
    roomName!: string
}

export interface WsClientConnection {
    roomName: string
    telegramId: string
}

export enum WsServerMethothod {
    JoinRoom = 'joinRoom',
    LeaveRoom = 'leaveRoom',
}

export enum WsClientMethods {
    Connect = 'connection'
}

export interface WsServerConnection extends WsClientConnection {
    status: WsConnectionStatus
}

export interface WsClientToServerListen {
    [WsServerMethothod.JoinRoom]: (connection: WsClientConnection) => Promise<void>
    [WsServerMethothod.LeaveRoom]: (connection: WsClientConnection) => Promise<void>
}

export interface WsServerToClientListener {
    [WsClientMethods.Connect]: (connection: WsServerConnection) => Promise<void>
    [WsClientMethods.Connect]: (connection: WsServerConnection) => Promise<void>
}
