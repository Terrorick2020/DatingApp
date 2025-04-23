import { ClientToServerEvents, ServerToClientEvents } from './base.types';


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

export interface MsgsClientToServerEvents extends ClientToServerEvents {
    [MsgsServerMethods.UpdateInterlocutor]: (updateInterlocutor: ) => Promise<void>
    [MsgsServerMethods.UpdateMsg]: (updateMsg: ) => Promise<void>
    [MsgsServerMethods.SendMsg]: (sendMsg: ) => Promise<void>
}

export interface MsgsServerToClientEvents extends ServerToClientEvents {
    [MsgsClientMethods.UpdateInterData]: (updateInterData: ) => Promise<void>
    [MsgsClientMethods.UpdateMsgData]: (updateMsgData: ) => Promise<void>
    [MsgsClientMethods.SendMsgData]: (sendMsgData: ) => Promise<void>
}
