import { ClientToServerEvents, ServerToClientEvents } from './base.types'
import { LikeTriggerDto } from '@/app/like/dto/trigger.dto'

export interface TrigFromUser {
	id: string
	avatar: string
	name: string
}

export enum LikeServerMethods {
	Trigger = 'Trigger',
}

export enum LikeClientMethods {
	TriggerData = 'TriggerData',
}

export interface LikeClientToServerEvents extends ClientToServerEvents {}

export interface LikeServerToClientEvents extends ServerToClientEvents {
	[LikeClientMethods.TriggerData]: (triggerDto: LikeTriggerDto) => Promise<void>
}
