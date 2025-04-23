import { IsEnum, IsOptional } from 'class-validator';
import { EWriteType } from '@/types/chat.types';
import { ELineStat } from '@/types/messages.types';
import { AtLeastOne } from '@/abstract/dto/validate.dto';
import { BaseWsConnectionDto } from '@/abstract/dto/connection.dto';


@AtLeastOne(['newWriteStat', 'newLineStat'], {
    message: 'Необходимо указать хотя бы одно из полей: newWriteStat или newLineStat',
})
export class MsgsUpdateIntrlocDto extends BaseWsConnectionDto {
    @IsEnum(EWriteType)
    @IsOptional()
    newWriteStat?: EWriteType

    @IsEnum(ELineStat)
    @IsOptional()
    newLineStat?: ELineStat
}
