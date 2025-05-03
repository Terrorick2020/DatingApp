import { IsEnum } from 'class-validator';
import { EWriteType } from '@/types/chat.types';
import { ELineStat } from '@/types/messages.types';
import { ConnectionDto } from '@/abstract/dto/connection.dto';


export class MsgsUpdateIntrlocDto extends ConnectionDto {
    @IsEnum(EWriteType)
    newWriteStat!: EWriteType
}

export class MsgsUpdateLineStatInterLocDto extends ConnectionDto {
    @IsEnum(ELineStat)
    newLineStat!: ELineStat
}
