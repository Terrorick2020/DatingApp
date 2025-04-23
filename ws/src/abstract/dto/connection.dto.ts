import { IsString } from 'class-validator';

export class BaseWsConnectionDto {
    @IsString()
    roomName!: string

    @IsString()
    telegramId!: string    
}
