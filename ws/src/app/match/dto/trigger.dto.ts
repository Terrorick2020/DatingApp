import { IsBoolean, IsNotEmpty } from 'class-validator';
import { ConnectionDto } from '@/abstract/dto/connection.dto';
import type { TrigFromUser } from '@/types/match.type';

export class MatchTriggerDto extends ConnectionDto {
    @IsBoolean()
    isTrigger!: boolean

    @IsNotEmpty()
    fromUser!: TrigFromUser
}
