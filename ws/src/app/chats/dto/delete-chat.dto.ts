import { IsString } from 'class-validator';
import { BaseWsConnectionDto } from '@/abstract/dto/connection.dto';


export class DeleteChatDto extends BaseWsConnectionDto {
    @IsString()
    chatId!:string
}
