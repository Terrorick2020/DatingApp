import { IsString, IsNotEmpty, IsNumber } from 'class-validator';
import { BaseWsConnectionDto } from '@/abstract/dto/connection.dto';
import type { ChatsToUser } from '@/types/chat.types';

export class AddChatDto extends BaseWsConnectionDto {
    @IsString()
    chatId!: string

    @IsNotEmpty()
    toUser!: ChatsToUser

    @IsString()
    lastMsg!: string

    @IsNumber()
    created_at!: number

    @IsNumber()
    unread_count!: number
}
