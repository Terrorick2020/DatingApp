import { IsString } from 'class-validator';
import { BaseClientConnectionDto } from '@/types/base.types';

export class ConnectionChatDto extends BaseClientConnectionDto {
    @IsString()
    telegramId!: string
}
