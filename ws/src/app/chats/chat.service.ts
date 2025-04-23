import { Injectable } from '@nestjs/common';
import { BaseWsService } from '@/abstract/abstract.service';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class ChatService extends BaseWsService {
    constructor(private readonly configService: ConfigService) {
        const host = configService.get<string>('API_HOST', 'localhost');
        const port = configService.get<number>('API_PORT', 3000);

        super(host, port);
    }
}
