import { IsString } from 'class-validator';
import { ConnectionDto } from '@/abstract/dto/connection.dto';


export class MsgsSendMsgDto extends ConnectionDto {
    @IsString()
    chatId!: string

    @IsString()
    toUser!: string

    @IsString()
    newMsg!: string
}
