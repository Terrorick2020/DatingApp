import {
    MsgsServerMethods,
    type ResMsgsUpdateIntrloc,
    type ResMsgsUpdateMsg,
    type ResMsgsSendMsg,
} from '@/types/messages.types';

import { Injectable } from '@nestjs/common';
import { MsgsUpdateIntrlocDto } from '@/app/messages/dto/update-interlocator.dto';
import { MsgsSendMsgDto } from '@/app/messages/dto/send-msg.dto';
import { MsgsUpdateMsgDto } from '@/app/messages/dto/update-msg.dto';
import { BaseWsService } from '@/abstract/abstract.service';
import { ConfigService } from '@nestjs/config';
import { type ResErrData, WsConnectionStatus } from '@/types/base.types';


@Injectable()
export class MessagesService extends BaseWsService {
    constructor(private readonly configService: ConfigService) {
        const host = configService.get<string>('API_HOST');
        const port = configService.get<number>('MSGS_PORT');

        host && port && super(host, port);
    }

    async updateInterlocutor(msgsUpdateIntrlocDto: MsgsUpdateIntrlocDto): Promise<ResMsgsUpdateIntrloc | ResErrData> {
        return await this.sendRequest<
            MsgsServerMethods,
            MsgsUpdateIntrlocDto,
            ResMsgsUpdateIntrloc
        > (MsgsServerMethods.UpdateInterlocutor, msgsUpdateIntrlocDto);
    }

    async updateMsg(msgsSendMsgDto: MsgsSendMsgDto): Promise<ResMsgsUpdateMsg | ResErrData> {
        return await this.sendRequest<
            MsgsServerMethods,
            MsgsSendMsgDto,
            ResMsgsUpdateMsg
        > (MsgsServerMethods.UpdateMsg, msgsSendMsgDto);
    }

    async sendMsg(msgsUpdateMsgDto: MsgsUpdateMsgDto): Promise<ResMsgsSendMsg | ResErrData> {
        return await this.sendRequest<
            MsgsServerMethods,
            MsgsUpdateMsgDto,
            ResMsgsSendMsg
        > (MsgsServerMethods.SendMsg, msgsUpdateMsgDto);
    }
}
