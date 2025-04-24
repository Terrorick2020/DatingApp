import { Injectable } from '@nestjs/common';
import { BaseWsService } from '@/abstract/abstract.service';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class MatchService extends BaseWsService {
    constructor(private readonly configService: ConfigService) {
        const host = configService.get<string>('API_HOST');
        const port = configService.get<number>('MATCH_PORT');

        host && port && super(host, port);
    }
}
