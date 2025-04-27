import { ClientToServerEvents, ServerToClientEvents } from './base.types';
import { MatchTriggerDto } from '@/app/match/dto/trigger.dto';


export interface TrigFromUser {
    id: string
    avatar: string
    name: string
}

export enum MatchServerMethods {
    Trigger = 'Trigger',
}

export enum MatchClientMethods {
    TriggerData = 'TriggerData',
}

export interface MatchClientToServerEvents extends ClientToServerEvents {}

export interface MatchServerToClientEvents extends ServerToClientEvents {
    [MatchClientMethods.TriggerData]: (triggerDto: MatchTriggerDto) => Promise<void>
}
