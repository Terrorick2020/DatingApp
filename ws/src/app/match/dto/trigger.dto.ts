import { IsBoolean, IsNotEmpty } from 'class-validator';
import { BaseWsConnectionDto } from '@/abstract/dto/connection.dto';
import type { TrigFromUser } from '@/types/match.type';

export class MatchTriggerDto extends BaseWsConnectionDto {
    @IsBoolean()
    isTrigger!: boolean

    @IsNotEmpty()
    fromUser!: TrigFromUser
}
