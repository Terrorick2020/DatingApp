import { IsString, IsEnum, ValidateIf, IsOptional, IsNumber } from 'class-validator';
import { BaseWsConnectionDto } from '@/abstract/dto/connection.dto';
import { EWriteType } from '@/types/chat.types';

export class UpdateChatDto extends BaseWsConnectionDto {
    @IsString()
    chatId!: string

    @ValidateIf((o) => o.newWriteStat === undefined)
    @IsString()
    @IsOptional()
    newLastMsgId!: string

    @ValidateIf((o) => o.newLastMsgId === undefined)
    @IsEnum(EWriteType)
    @IsOptional()
    newWriteStat?: EWriteType

    @IsNumber()
    @IsOptional()
    newUnreadCount?: number
}
