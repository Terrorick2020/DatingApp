import { IsString, IsEnum, ValidateIf, IsOptional, IsNumber } from 'class-validator';
import { BaseClientConnectionDto } from '@/types/base.types';
import { EWriteType } from '@/types/chat.types';

export class UpdateChatDto extends BaseClientConnectionDto {
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
