import {
	MsgsServerMethods,
	type ResMsgsUpdateIntrloc,
	type ResMsgsUpdateMsg,
	type ResMsgsSendMsg,
} from '@/types/messages.types'

import { Injectable } from '@nestjs/common'
import { MsgsUpdateIntrlocDto } from '@/app/messages/dto/update-interlocator.dto'
import { MsgsSendMsgDto } from '@/app/messages/dto/send-msg.dto'
import { MsgsUpdateMsgDto } from '@/app/messages/dto/update-msg.dto'
import { BaseWsService } from '@/abstract/abstract.service'
import { ConfigService } from '@nestjs/config'
import { ResConnectionDto } from '~/src/abstract/dto/response.dto'

@Injectable()
export class MessagesService extends BaseWsService {
	constructor(protected readonly configService: ConfigService) {
		super(configService)
	}

	async updateInterlocutor(
		msgsUpdateIntrlocDto: MsgsUpdateIntrlocDto
	): Promise<ResMsgsUpdateIntrloc | ResConnectionDto> {
		return await this.sendRequest<
			MsgsServerMethods,
			MsgsUpdateIntrlocDto,
			ResMsgsUpdateIntrloc
		>(MsgsServerMethods.UpdateInterlocutor, msgsUpdateIntrlocDto)
	}

	async updateMsg(
		msgsSendMsgDto: MsgsSendMsgDto
	): Promise<ResMsgsUpdateMsg | ResConnectionDto> {
		return await this.sendRequest<
			MsgsServerMethods,
			MsgsSendMsgDto,
			ResMsgsUpdateMsg
		>(MsgsServerMethods.UpdateMsg, msgsSendMsgDto)
	}

	async sendMsg(
		msgsUpdateMsgDto: MsgsUpdateMsgDto
	): Promise<ResMsgsSendMsg | ResConnectionDto> {
		return await this.sendRequest<
			MsgsServerMethods,
			MsgsUpdateMsgDto,
			ResMsgsSendMsg
		>(MsgsServerMethods.SendMsg, msgsUpdateMsgDto)
	}
}
