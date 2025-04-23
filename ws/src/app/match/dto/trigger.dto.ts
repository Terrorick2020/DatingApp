import { IsBoolean } from 'class-validator';
import { BaseWsConnectionDto } from '@/abstract/dto/connection.dto';

export class MatchTriggerDto extends BaseWsConnectionDto {
    @IsBoolean()
    isTrigger!: boolean
}
