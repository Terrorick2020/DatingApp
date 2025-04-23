import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EReadIt } from '@/types/messages.types';
import { AtLeastOne } from '@/abstract/dto/validate.dto';
import { BaseWsConnectionDto } from '@/abstract/dto/connection.dto';


@AtLeastOne(['newVarMsg', 'readStat'], {
    message: 'Необходимо указать хотя бы одно из полей: newVarMsg или readStat',
})
export class MsgsUpdateMsgDto extends BaseWsConnectionDto {
    @IsString()
    chatId!: string

    @IsString()
    msgId!: string

    @IsString()
    @IsOptional()
    newMsg?: string

    @IsEnum(EReadIt)
    @IsOptional()
    readStat?: EReadIt
}
