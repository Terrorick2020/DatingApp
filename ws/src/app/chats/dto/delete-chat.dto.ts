import { IsString } from 'class-validator';
import { ConnectionDto } from '@/abstract/dto/connection.dto';


export class DeleteChatDto extends ConnectionDto {
    @IsString()
    chatId!:string
}
