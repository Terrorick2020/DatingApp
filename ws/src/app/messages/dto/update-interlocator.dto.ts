import { IsEnum } from 'class-validator';
import { EWriteType } from '@/types/chat.types';
import { ELineStat } from '@/types/messages.types';
import { BaseWsConnectionDto } from '@/abstract/dto/connection.dto';


export class MsgsUpdateIntrlocDto extends BaseWsConnectionDto {
    @IsEnum(EWriteType)
    newWriteStat!: EWriteType
}

export class MsgsUpdateLineStatInterLocDto extends BaseWsConnectionDto {
    @IsEnum(ELineStat)
    newLineStat!: ELineStat
}
