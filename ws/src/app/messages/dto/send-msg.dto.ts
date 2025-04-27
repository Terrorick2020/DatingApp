import { IsString } from 'class-validator';
import { BaseWsConnectionDto } from '@/abstract/dto/connection.dto';


export class MsgsSendMsgDto extends BaseWsConnectionDto {
    @IsString()
    chatId!: string

    @IsString()
    toUser!: string

    @IsString()
    newMsg!: string
}
